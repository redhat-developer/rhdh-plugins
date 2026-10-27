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

import { networkError, ScmErrorContext } from './httpErrors';

export type FetchFn = typeof fetch;

const REQUEST_TIMEOUT_MS = 30_000;

/** Calls the SCM, turning network failures and timeouts into a user-facing error. */
export async function scmRequest(
  fetchFn: FetchFn,
  url: string,
  init: RequestInit,
  ctx: ScmErrorContext,
): Promise<Response> {
  try {
    return await fetchFn(url, {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (e) {
    throw networkError(ctx, e);
  }
}
