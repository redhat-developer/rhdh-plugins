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

import { mockServices } from '@backstage/backend-test-utils';

import express from 'express';
import request from 'supertest';

import {
  DEFAULT_EXPENSIVE_RATE_LIMIT_MAX,
  DEFAULT_GENERAL_RATE_LIMIT_MAX,
} from '../constant';
import {
  createRateLimitMiddleware,
  getRateLimitMax,
} from './createRateLimitMiddleware';

describe('getRateLimitMax', () => {
  it('returns default expensive max when config is omitted', () => {
    const config = mockServices.rootConfig({ data: {} });
    expect(getRateLimitMax(config, 'expensive')).toBe(
      DEFAULT_EXPENSIVE_RATE_LIMIT_MAX,
    );
  });

  it('returns default general max when config is omitted', () => {
    const config = mockServices.rootConfig({ data: {} });
    expect(getRateLimitMax(config, 'general')).toBe(
      DEFAULT_GENERAL_RATE_LIMIT_MAX,
    );
  });

  it('returns configured max values when provided', () => {
    const config = mockServices.rootConfig({
      data: {
        'intelligent-assistant': {
          rateLimit: {
            expensive: { max: 10 },
            general: { max: 50 },
          },
        },
      },
    });

    expect(getRateLimitMax(config, 'expensive')).toBe(10);
    expect(getRateLimitMax(config, 'general')).toBe(50);
  });

  it('treats negative values as disabled (0)', () => {
    const config = mockServices.rootConfig({
      data: {
        'intelligent-assistant': {
          rateLimit: {
            expensive: { max: -1 },
            general: { max: -5 },
          },
        },
      },
    });

    expect(getRateLimitMax(config, 'expensive')).toBe(0);
    expect(getRateLimitMax(config, 'general')).toBe(0);
  });

  it('floors decimal values to integers', () => {
    const config = mockServices.rootConfig({
      data: {
        'intelligent-assistant': {
          rateLimit: {
            expensive: { max: 10.7 },
            general: { max: 50.3 },
          },
        },
      },
    });

    expect(getRateLimitMax(config, 'expensive')).toBe(10);
    expect(getRateLimitMax(config, 'general')).toBe(50);
  });
});

describe('createRateLimitMiddleware', () => {
  function createTestApp(
    max: number,
    tier: 'expensive' | 'general' = 'general',
  ) {
    const app = express();
    const config = mockServices.rootConfig({
      data: {
        'intelligent-assistant': {
          rateLimit: {
            [tier]: { max },
          },
        },
      },
    });

    app.use((req, _res, next) => {
      req.credentials = { $$type: '@backstage/BackstageCredentials' } as any;
      req.userEntityRef = 'user:default/test-user';
      next();
    });
    app.get('/test', createRateLimitMiddleware(config, tier), (_req, res) => {
      res.json({ ok: true });
    });

    return app;
  }

  it('allows requests up to the configured max', async () => {
    const app = createTestApp(1);

    const first = await request(app).get('/test');
    expect(first.status).toBe(200);
    expect(first.body).toEqual({ ok: true });
  });

  it('returns 429 with Retry-After when limit is exceeded', async () => {
    const app = createTestApp(1);

    await request(app).get('/test');
    const second = await request(app).get('/test');

    expect(second.status).toBe(429);
    expect(second.headers['retry-after']).toBeDefined();
    expect(second.body).toEqual({
      error: {
        name: 'RateLimitExceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: expect.any(Number),
      },
    });
  });

  it('does not rate limit when max is 0', async () => {
    const app = createTestApp(0);

    const first = await request(app).get('/test');
    const second = await request(app).get('/test');

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
  });

  it('tracks limits independently per user', async () => {
    const config = mockServices.rootConfig({
      data: {
        'intelligent-assistant': {
          rateLimit: {
            general: { max: 1 },
          },
        },
      },
    });
    const app = express();

    app.use((req, _res, next) => {
      req.credentials = { $$type: '@backstage/BackstageCredentials' } as any;
      req.userEntityRef =
        req.headers['x-test-user']?.toString() ?? 'user:default/user-a';
      next();
    });
    app.get(
      '/test',
      createRateLimitMiddleware(config, 'general'),
      (_req, res) => {
        res.json({ ok: true });
      },
    );

    await request(app).get('/test').set('x-test-user', 'user:default/user-a');
    const blockedForA = await request(app)
      .get('/test')
      .set('x-test-user', 'user:default/user-a');
    const allowedForB = await request(app)
      .get('/test')
      .set('x-test-user', 'user:default/user-b');

    expect(blockedForA.status).toBe(429);
    expect(allowedForB.status).toBe(200);
  });
});
