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

import { Config } from '@backstage/config';

import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';

import {
  DEFAULT_EXPENSIVE_RATE_LIMIT_MAX,
  DEFAULT_GENERAL_RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
} from '../constant';
import { getIdentity } from './getIdentity';

export type RateLimitTier = 'expensive' | 'general';

export function getRateLimitMax(config: Config, tier: RateLimitTier): number {
  const configKey =
    tier === 'expensive'
      ? 'lightspeed.rateLimit.expensive.max'
      : 'lightspeed.rateLimit.general.max';
  const defaultMax =
    tier === 'expensive'
      ? DEFAULT_EXPENSIVE_RATE_LIMIT_MAX
      : DEFAULT_GENERAL_RATE_LIMIT_MAX;

  const configured = config.getOptionalNumber(configKey);
  if (configured === undefined) {
    return defaultMax;
  }

  if (configured <= 0) {
    return 0; // rate limit of 0 means disabled
  }

  return Math.floor(configured);
}

export function createRateLimitMiddleware(
  config: Config,
  tier: RateLimitTier,
): RequestHandler {
  const max = getRateLimitMax(config, tier);

  if (max === 0) {
    return (_req, _res, next) => next();
  }

  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max,
    standardHeaders: false,
    legacyHeaders: false,
    keyGenerator: req => getIdentity(req).userEntityRef,
    handler: (req, res, _next, options) => {
      const resetTime = req.rateLimit?.resetTime;
      const retryAfter = resetTime
        ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
        : Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);

      res.setHeader('Retry-After', String(retryAfter));
      res.status(options.statusCode).json({
        error: {
          name: 'RateLimitExceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter,
        },
      });
    },
  });
}
