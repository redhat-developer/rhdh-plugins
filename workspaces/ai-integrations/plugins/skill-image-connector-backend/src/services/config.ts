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

import type { Config } from '@backstage/config';
import { InputError } from '@backstage/errors';
import { validateAllowedOrigin } from './HttpClient';
import type { SkillImageOptions } from './types';
import { DEFAULT_SKILL_IMAGE_OPTIONS, MAX_TIMER_DELAY_MS } from './types';

/**
 * Resolve acquisition settings without mutating shared defaults. Image and discovery config parsing stays in plugin.ts
 * to reuse the OCI reference, tag, and token-realm validators from OciClient.
 */
export function readSkillImageOptions(config: Config): SkillImageOptions {
  const source = config.getOptionalConfig('skillImageConnector');
  const DEFAULT_NUMERIC_OPTIONS: Omit<SkillImageOptions, 'allowedOrigins'> =
    DEFAULT_SKILL_IMAGE_OPTIONS;
  const options = { ...DEFAULT_NUMERIC_OPTIONS };
  for (const key of Object.keys(options) as Array<
    keyof typeof DEFAULT_NUMERIC_OPTIONS
  >) {
    const value = source?.getOptionalNumber(key) ?? options[key];
    const minimum = key === 'maxRetries' ? 0 : 1;
    const maximum =
      key === 'fetchTimeoutMs' ||
      key === 'retryBaseDelayMs' ||
      key === 'sourceOperationDeadlineMs'
        ? MAX_TIMER_DELAY_MS
        : Number.MAX_SAFE_INTEGER;
    if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
      throw new InputError(
        `skillImageConnector.${key} must be an integer between ${minimum} and ${maximum}`,
      );
    }
    options[key] = value;
  }
  const allowedOrigins = source?.getOptionalStringArray('allowedOrigins');
  if (allowedOrigins) {
    try {
      return Object.freeze({
        ...options,
        allowedOrigins: Object.freeze(
          allowedOrigins.map(validateAllowedOrigin),
        ),
      });
    } catch (error) {
      // Include the validator's reason, not the input URL or error object,
      // which could contain embedded credentials.
      const detail = error instanceof Error ? error.message : 'Invalid origin';
      throw new InputError(`skillImageConnector.allowedOrigins: ${detail}`);
    }
  }
  return Object.freeze(options);
}
