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
 * Recursively unwraps deeply-nested DCM API error messages into a single
 * human-readable string.
 *
 * The DCM backend proxy re-wraps each upstream error as a JSON detail string,
 * which may itself contain another JSON-encoded error. This function walks
 * the chain and returns the innermost detail or title value.
 *
 * @public
 */
export function extractApiError(err: unknown): string {
  let raw: string;
  if (err instanceof Error) {
    raw = err.message;
  } else if (typeof err === 'string') {
    raw = err;
  } else {
    try {
      raw = JSON.stringify(err) ?? '';
    } catch {
      raw = '';
    }
  }
  return unwrap(raw);
}

function tryParseJson(s: string): Record<string, unknown> | null {
  try {
    const val = JSON.parse(s);
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      return val as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function unwrap(input: string): string {
  const jsonStart = input.indexOf('{');
  if (jsonStart === -1) return input.trim();

  const jsonStr = input.slice(jsonStart);
  const parsed = tryParseJson(jsonStr);

  if (!parsed) {
    const rawPrefix = input.slice(0, jsonStart).trimEnd();
    const prefix = (
      rawPrefix.endsWith(':') ? rawPrefix.slice(0, -1) : rawPrefix
    ).trim();
    return prefix || input.trim();
  }

  const detail = typeof parsed.detail === 'string' ? parsed.detail.trim() : '';
  const title = typeof parsed.title === 'string' ? parsed.title.trim() : '';

  if (detail) {
    // If detail itself contains a nested JSON object, recurse into it
    if (detail.includes('{')) {
      const deeper = unwrap(detail);
      // Only use the deeper result when it's genuinely different (i.e. we dug further)
      if (deeper && deeper !== detail) return deeper;
    }
    return detail;
  }

  return title || input.trim();
}
