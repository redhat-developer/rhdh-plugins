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
 * Extract a user-safe message and HTTP status code from a raw error string.
 *
 * Handles:
 * - Legacy "Llama Stack API error: ..." format
 * - "Responses API error: ..." format from ResponsesApiError
 * - "Kagenti API error: ..." format from KagentiApiClient
 * - Kagenti stream errors with status codes
 *
 * Strips upstream server detail/stack traces to avoid leaking internals.
 */
export function sanitizeErrorMessage(raw: string): {
  message: string;
  inferredStatus?: number;
} {
  // Bounded quantifiers to avoid catastrophic backtracking (S5852)
  const llamaRegex =
    /(?:Llama Stack|Responses) API error:\s*(\d{3})\s*[^\n-]{0,200}-\s*([\s\S]{0,10000})/;
  const llamaMatch = llamaRegex.exec(raw);
  if (llamaMatch) {
    return extractFromMatch(llamaMatch);
  }

  const kagentiRegex =
    /Kagenti (?:API|stream request failed).*?status\s+(\d{3})(?:\s*-\s*([\s\S]{0,10000}))?/;
  const kagentiMatch = kagentiRegex.exec(raw);
  if (kagentiMatch) {
    return extractFromMatch(kagentiMatch);
  }

  return { message: raw };
}

function extractFromMatch(match: RegExpExecArray): {
  message: string;
  inferredStatus?: number;
} {
  const status = Number.parseInt(match[1], 10);
  const body = (match[2] ?? '').trim();
  if (!body) {
    return { message: `Request failed with status ${status}`, inferredStatus: status };
  }
  try {
    const parsed = JSON.parse(body);
    if (typeof parsed.detail === 'string') {
      return { message: parsed.detail, inferredStatus: status };
    }
    if (typeof parsed.message === 'string') {
      return { message: parsed.message, inferredStatus: status };
    }
  } catch {
    // Body may not be JSON; fall through to truncation
  }
  const truncated = body.length > 300 ? `${body.substring(0, 300)}...` : body;
  return { message: truncated, inferredStatus: status };
}
