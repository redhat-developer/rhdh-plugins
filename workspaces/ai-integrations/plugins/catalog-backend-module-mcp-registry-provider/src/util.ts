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

/**
 * Strip trailing `/` characters with a linear scan (no regex backtracking).
 *
 * @internal
 */
export function stripTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value.charAt(end - 1) === '/') {
    end -= 1;
  }
  return end === value.length ? value : value.slice(0, end);
}

/**
 * Format an unknown thrown value for operator-facing error text.
 *
 * Prefer the deepest `cause` message (Node/undici often wraps network
 * failures as `TypeError: fetch failed` with a useful cause). Never
 * prefixes the Error constructor name (e.g. `TypeError:`).
 *
 * @internal
 */
export function formatErrorDetail(err: unknown): string {
  if (err instanceof Error) {
    let current: Error = err;
    // Walk a short cause chain for a more specific message.
    for (let depth = 0; depth < 5; depth += 1) {
      const cause = (current as Error & { cause?: unknown }).cause;
      if (!(cause instanceof Error) || !cause.message) {
        break;
      }
      current = cause;
    }
    if (current.message) {
      return current.message;
    }
    return current.name || 'unknown error';
  }
  if (typeof err === 'string' && err.length > 0) {
    return err;
  }
  return String(err);
}
