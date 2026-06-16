/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as http from 'http';
import * as https from 'https';
import { STREAM_REQUEST_TIMEOUT_MS } from '../../../constants';
import { ResponsesApiError } from './ResponsesApiError';

export async function streamRequest(
  baseUrl: string,
  token: string | undefined,
  agent: http.Agent | https.Agent,
  endpoint: string,
  body: unknown,
  onData: (data: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const url = new URL(`${baseUrl}${endpoint}`);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const bodyStr = JSON.stringify(body);

  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Stream aborted before request started'));
      return;
    }

    const isHttps = url.protocol === 'https:';
    const reqOptions: https.RequestOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        ...headers,
        'Content-Length': Buffer.byteLength(bodyStr),
      },
      agent,
    };

    const transport = isHttps ? https : http;
    const req = transport.request(reqOptions, res => {
      if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
        let errorData = '';
        res.on('data', chunk => {
          errorData += chunk;
        });
        res.on('end', () => {
          reject(
            new ResponsesApiError(
              res.statusCode!,
              `Streaming request failed`,
              errorData,
            ),
          );
        });
        return;
      }

      let buffer = '';

      res.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data && data !== '[DONE]') {
              onData(data);
            }
          }
        }
      });

      res.on('end', () => {
        if (buffer.startsWith('data: ')) {
          const data = buffer.slice(6).trim();
          if (data && data !== '[DONE]') {
            onData(data);
          }
        }
        resolve();
      });

      res.on('error', e => {
        reject(new Error(`Streaming response error: ${e.message}`));
      });
    });

    if (signal) {
      const onAbort = () => {
        req.destroy();
        reject(new Error('Stream aborted by client'));
      };
      signal.addEventListener('abort', onAbort, { once: true });
      req.on('close', () => signal.removeEventListener('abort', onAbort));
    }

    req.setTimeout(STREAM_REQUEST_TIMEOUT_MS, () => {
      req.destroy();
      reject(
        new Error(
          `Streaming request timed out after ${
            STREAM_REQUEST_TIMEOUT_MS / 1000
          } seconds`,
        ),
      );
    });

    req.on('error', e => {
      reject(
        new Error(`Responses API streaming connection error: ${e.message}`),
      );
    });

    req.write(bodyStr);
    req.end();
  });
}
