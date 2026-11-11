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
 * Escape control characters and Unicode line separators in diagnostic text.
 * Validation must use the original value, not this display representation.
 *
 * @internal
 */
export function escapeDiagnosticValue(value: string): string {
  return String(value).replace(
    /[\p{Cc}\u2028\u2029]/gu,
    character => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`,
  );
}
