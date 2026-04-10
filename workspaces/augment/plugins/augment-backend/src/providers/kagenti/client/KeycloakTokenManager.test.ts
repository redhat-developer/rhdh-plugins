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
import { KeycloakTokenManager } from './KeycloakTokenManager';
import { createMockLogger } from '../../../test-utils/mocks';

describe('KeycloakTokenManager', () => {
  let server: http.Server;
  let serverPort: number;
  let tokenCallCount: number;

  beforeAll(async () => {
    tokenCallCount = 0;
    server = http.createServer((req, res) => {
      tokenCallCount++;
      if (req.url === '/token' && req.method === 'POST') {
        const chunks: Buffer[] = [];
        req.on('data', c => chunks.push(c));
        req.on('end', () => {
          const body = Buffer.concat(chunks).toString();
          if (body.includes('grant_type=client_credentials')) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                access_token: `token-${tokenCallCount}`,
                expires_in: 300,
                token_type: 'Bearer',
              }),
            );
          } else {
            res.writeHead(400);
            res.end('Bad request');
          }
        });
      } else if (req.url === '/fail') {
        res.writeHead(401);
        res.end('Unauthorized');
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    await new Promise<void>(resolve => {
      server.listen(0, () => {
        const addr = server.address();
        serverPort = typeof addr === 'object' && addr ? addr.port : 0;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
  });

  beforeEach(() => {
    tokenCallCount = 0;
  });

  it('acquires a token from the endpoint', async () => {
    const mgr = new KeycloakTokenManager({
      tokenEndpoint: `http://localhost:${serverPort}/token`,
      clientId: 'test-client',
      clientSecret: 'test-secret',
      logger: createMockLogger(),
    });

    const token = await mgr.getToken();
    expect(token).toBe('token-1');
  });

  it('returns cached token on subsequent calls', async () => {
    const mgr = new KeycloakTokenManager({
      tokenEndpoint: `http://localhost:${serverPort}/token`,
      clientId: 'test-client',
      clientSecret: 'test-secret',
      logger: createMockLogger(),
    });

    const t1 = await mgr.getToken();
    const t2 = await mgr.getToken();
    expect(t1).toBe(t2);
    expect(tokenCallCount).toBe(1);
  });

  it('deduplicates concurrent requests', async () => {
    const mgr = new KeycloakTokenManager({
      tokenEndpoint: `http://localhost:${serverPort}/token`,
      clientId: 'test-client',
      clientSecret: 'test-secret',
      logger: createMockLogger(),
    });

    const [t1, t2, t3] = await Promise.all([
      mgr.getToken(),
      mgr.getToken(),
      mgr.getToken(),
    ]);
    expect(t1).toBe(t2);
    expect(t2).toBe(t3);
    expect(tokenCallCount).toBe(1);
  });

  it('clears cache and re-acquires', async () => {
    const mgr = new KeycloakTokenManager({
      tokenEndpoint: `http://localhost:${serverPort}/token`,
      clientId: 'test-client',
      clientSecret: 'test-secret',
      logger: createMockLogger(),
    });

    await mgr.getToken();
    mgr.clearCache();
    const t2 = await mgr.getToken();
    expect(t2).toBe('token-2');
    expect(tokenCallCount).toBe(2);
  });

  it('rejects when the endpoint returns an error', async () => {
    const mgr = new KeycloakTokenManager({
      tokenEndpoint: `http://localhost:${serverPort}/fail`,
      clientId: 'test-client',
      clientSecret: 'test-secret',
      logger: createMockLogger(),
    });

    await expect(mgr.getToken()).rejects.toThrow(/status 401/);
  });

  it('clearCache during in-flight request prevents stale cache write', async () => {
    const mgr = new KeycloakTokenManager({
      tokenEndpoint: `http://localhost:${serverPort}/token`,
      clientId: 'test-client',
      clientSecret: 'test-secret',
      logger: createMockLogger(),
    });

    const firstTokenPromise = mgr.getToken();
    mgr.clearCache();
    const firstToken = await firstTokenPromise;
    expect(firstToken).toBe('token-1');

    const secondToken = await mgr.getToken();
    expect(secondToken).toBe('token-2');
    expect(tokenCallCount).toBe(2);
  });

  it('getTokenForStreaming forces refresh when remaining lifetime is insufficient', async () => {
    const mgr = new KeycloakTokenManager({
      tokenEndpoint: `http://localhost:${serverPort}/token`,
      clientId: 'test-client',
      clientSecret: 'test-secret',
      logger: createMockLogger(),
      tokenExpiryBufferSeconds: 60,
    });

    const t1 = await mgr.getToken();
    expect(t1).toBe('token-1');
    expect(tokenCallCount).toBe(1);

    // Request a token with a minimum lifetime longer than the remaining validity.
    // The token expires in 300s with 60s buffer = 240s effective.
    // Requesting 999999ms > remaining → forces refresh.
    const t2 = await mgr.getTokenForStreaming(999_999_000);
    expect(t2).toBe('token-2');
    expect(tokenCallCount).toBe(2);
  });

  it('getTokenForStreaming returns cached token when lifetime is sufficient', async () => {
    const mgr = new KeycloakTokenManager({
      tokenEndpoint: `http://localhost:${serverPort}/token`,
      clientId: 'test-client',
      clientSecret: 'test-secret',
      logger: createMockLogger(),
      tokenExpiryBufferSeconds: 60,
    });

    const t1 = await mgr.getToken();
    expect(t1).toBe('token-1');

    // Request token with a very short minimum lifetime — should use cached
    const t2 = await mgr.getTokenForStreaming(1000);
    expect(t2).toBe('token-1');
    expect(tokenCallCount).toBe(1);
  });
});
