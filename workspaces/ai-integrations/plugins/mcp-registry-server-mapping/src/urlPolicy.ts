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
 * Emitted URL scheme policy (D11).
 *
 * Trims whitespace, parses as an absolute URL (WHATWG URL, no base),
 * and returns true only when the scheme is http or https. All other
 * schemes (javascript:, data:, file:, vbscript:, blob:, etc.),
 * relative paths, scheme-relative //host, and scp-like git@host:path
 * are refused. Host appearance does not affect the gate.
 *
 * @public
 */
export function isAllowedUrl(candidate: string | undefined | null): boolean {
  if (candidate === undefined || candidate === null) {
    return false;
  }

  const trimmed = candidate.trim();
  if (trimmed.length === 0) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLocaleLowerCase('en-US');
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    // Not a valid absolute URL (relative paths, scp-like, etc.)
    return false;
  }
}
