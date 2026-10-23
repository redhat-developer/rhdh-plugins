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

/** Maximum duration of one external provider operation, including response reading. */
export const REQUEST_TIMEOUT_MS = 30_000;

/** Bound a request even when a supplied client ignores AbortSignal. */
export async function withRequestTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  parent?: AbortSignal,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const cancel = () =>
    controller.abort(parent?.reason ?? new Error('Provider run aborted'));
  if (parent?.aborted) cancel();
  else parent?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(
    () => controller.abort(new Error('Provider request timed out')),
    timeoutMs,
  );
  let rejectOnAbort: (() => void) | undefined;
  try {
    return await new Promise<T>((resolve, reject) => {
      rejectOnAbort = () => reject(controller.signal.reason);
      controller.signal.addEventListener('abort', rejectOnAbort, {
        once: true,
      });
      if (controller.signal.aborted) {
        rejectOnAbort();
        return;
      }
      Promise.resolve()
        .then(() => operation(controller.signal))
        .then(resolve, reject);
    });
  } finally {
    clearTimeout(timer);
    parent?.removeEventListener('abort', cancel);
    if (rejectOnAbort)
      controller.signal.removeEventListener('abort', rejectOnAbort);
  }
}
