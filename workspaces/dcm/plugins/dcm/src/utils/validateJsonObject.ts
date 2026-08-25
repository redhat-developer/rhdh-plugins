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

/** Discriminated union returned by {@link validateJsonObject}. */
export type JsonObjectResult =
  | { status: 'empty' }
  | { status: 'syntax' }
  | { status: 'not_object' }
  | { status: 'ok'; value: Record<string, unknown> };

/**
 * Validates a raw JSON string as a JSON object (not an array or primitive).
 *
 * Returns a discriminated union:
 * - `{ status: 'empty' }` — string is empty / whitespace (no schema set)
 * - `{ status: 'syntax' }` — non-empty but not valid JSON
 * - `{ status: 'not_object' }` — valid JSON but not a plain object
 * - `{ status: 'ok'; value: Record<string, unknown> }` — valid JSON object
 */
export function validateJsonObject(raw: string): JsonObjectResult {
  const trimmed = raw.trim();
  if (!trimmed) return { status: 'empty' };
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return { status: 'not_object' };
    }
    return { status: 'ok', value: parsed as Record<string, unknown> };
  } catch {
    return { status: 'syntax' };
  }
}
