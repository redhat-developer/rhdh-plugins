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

import type { Response } from 'express';
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { NormalizedStreamEvent } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { FlushableResponse } from './types';
import { KagentiStreamNormalizer } from '../providers/kagenti/stream/KagentiStreamNormalizer';

export function safeInt(val: unknown): number | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  const n = Number(val);
  return Number.isFinite(n) ? Math.floor(n) : undefined;
}

export function clampLimit(
  raw: number | undefined,
  defaultLimit: number,
  maxLimit: number,
): number {
  const val = raw ?? defaultLimit;
  return Math.min(Math.max(1, val), maxLimit);
}

export function setupSse(
  res: Response,
  logger: LoggerService,
): { disconnected: { current: boolean }; abortController: AbortController } {
  res.setHeader('Content-Encoding', 'identity');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const disconnected = { current: false };
  const abortController = new AbortController();
  res.on('close', () => {
    disconnected.current = true;
    abortController.abort();
    logger.debug('Client disconnected from Kagenti sandbox stream');
  });
  return { disconnected, abortController };
}

export function writeSse(
  res: Response,
  event: NormalizedStreamEvent,
  disconnected: { current: boolean },
): void {
  if (!disconnected.current) {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
    (res as FlushableResponse).flush?.();
  }
}

export async function handleSseStream(
  res: Response,
  logger: LoggerService,
  kagentiCfg: { verboseStreamLogging?: boolean },
  streamFn: (
    onLine: (line: string) => void,
    signal: AbortSignal,
  ) => Promise<void>,
): Promise<void> {
  const { disconnected, abortController } = setupSse(res, logger);
  const verboseLog = kagentiCfg.verboseStreamLogging ? logger : undefined;
  const normalizer = new KagentiStreamNormalizer(verboseLog);

  try {
    await streamFn((line: string) => {
      for (const event of normalizer.normalize(line)) {
        writeSse(res, event, disconnected);
      }
    }, abortController.signal);
    if (!disconnected.current) {
      res.write('data: [DONE]\n\n');
      res.end();
    }
  } catch (err) {
    if (abortController.signal.aborted) {
      return;
    }
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`SSE stream error: ${msg}`);
    if (!disconnected.current) {
      writeSse(
        res,
        { type: 'stream.error', error: 'Stream failed', code: 'stream_error' },
        disconnected,
      );
      res.end();
    }
  }
}
