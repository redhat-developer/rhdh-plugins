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
 * Validates a raw JSON string as a JSON object (not an array or primitive).
 *
 * Returns:
 * - `''` if the string is empty / whitespace (valid — no schema set)
 * - `'syntax'` if the string is non-empty but not valid JSON
 * - `'object'` if it is valid JSON but not an object (`{}`)
 * - a parsed `Record<string, unknown>` when the string is a valid JSON object
 */
export function validateJsonObject(
  raw: string,
): '' | 'syntax' | 'object' | Record<string, unknown> {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return 'object';
    }
    return parsed as Record<string, unknown>;
  } catch {
    return 'syntax';
  }
}
