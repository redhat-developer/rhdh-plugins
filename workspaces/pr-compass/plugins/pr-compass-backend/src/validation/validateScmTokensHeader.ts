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

import type { LoggerService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import { z } from 'zod';
import { SCM_TOKENS_MAX_BYTES, SCM_TOKENS_HEADER } from './constants';

/** Parses the `x-scm-tokens` header into a source id to token map. */
export function validateScmTokensHeader(
  rawTokenHeader: string | undefined,
  logger: LoggerService,
): Record<string, string> | undefined {
  if (!rawTokenHeader) {
    return undefined;
  }

  if (rawTokenHeader.length > SCM_TOKENS_MAX_BYTES) {
    logger.warn(
      `'${SCM_TOKENS_HEADER}' header exceeds maximum allowed size, ignoring`,
    );
    return undefined;
  }

  const schema = z.record(
    z.string().min(1, 'tokens must be non-empty strings'),
  );

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawTokenHeader);
  } catch (e) {
    throw new InputError(
      `Invalid ${SCM_TOKENS_HEADER} header: ${(e as Error).message}`,
    );
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new InputError(`Invalid '${SCM_TOKENS_HEADER}' header`);
  }

  return result.data;
}
