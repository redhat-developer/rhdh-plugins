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

import { CustomErrorBase, isError } from '@backstage/errors';
import {
  SourceErrorCodes,
  type SourceErrorCode,
} from '@red-hat-developer-hub/backstage-plugin-pr-compass-common';

const providerErrorCodes: ReadonlySet<string> = new Set(
  Object.values(SourceErrorCodes).filter(
    code => code !== SourceErrorCodes.SCM_SESSION_REQUIRED,
  ),
);

/**
 * A pull request provider failure
 *
 * @public
 */
export class PullRequestProviderError extends CustomErrorBase {
  name = 'PullRequestProviderError' as const;

  static is(value: unknown): value is PullRequestProviderError {
    if (!isError(value) || value.name !== 'PullRequestProviderError') {
      return false;
    }
    const { code } = value as { code?: unknown };
    return typeof code === 'string' && providerErrorCodes.has(code);
  }

  constructor(
    readonly code: Exclude<SourceErrorCode, 'SCM_SESSION_REQUIRED'>,
    message?: string,
  ) {
    super(message ?? code);
  }
}
