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
 * Portable AbortError check that works even when DOMException is unavailable
 * (e.g. older Node.js runtimes or non-browser environments).
 */
export function isAbortError(err: unknown): boolean {
  if (
    typeof DOMException !== 'undefined' &&
    err instanceof DOMException &&
    err.name === 'AbortError'
  ) {
    return true;
  }
  if (err instanceof Error && err.name === 'AbortError') return true;
  return false;
}
