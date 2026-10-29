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
 * Whether the value is a plain path relative to the repository root.
 *
 * The stored artifact values are produced by an external tool; before using one
 * to address a file in the SCM, reject anything that is not a plain relative
 * path: empty values, absolute paths, URLs, backslashes, control characters and
 * `.`/`..` segments.
 */
export function isSafeRepoRelativePath(value: string): boolean {
  if (!value || value.startsWith('/') || value.includes('\\')) {
    return false;
  }
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(value)) {
    return false;
  }
  // `scheme:` as in https://..., or a Windows drive letter
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) {
    return false;
  }
  return value
    .split('/')
    .every(segment => segment !== '' && segment !== '.' && segment !== '..');
}
