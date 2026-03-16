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
 * Handles both legacy "Llama Stack API error: ..." format and the newer
 * "Responses API error: ..." format from ResponsesApiError.
 */
export function sanitizeErrorMessage(raw: string): {
  message: string;
  inferredStatus?: number;
} {
  const match = raw.match(
    /(?:Llama Stack|Responses) API error:\s*(\d{3})\s*[^-]*-\s*(.*)/s,
  );
  if (match) {
    const status = parseInt(match[1], 10);
    const body = match[2].trim();
    try {
      const parsed = JSON.parse(body);
      if (typeof parsed.detail === 'string') {
        return { message: parsed.detail, inferredStatus: status };
      }
    } catch {
      // Body may not be JSON; fall through to truncation
    }
    const truncated = body.length > 300 ? `${body.substring(0, 300)}...` : body;
    return { message: truncated, inferredStatus: status };
  }
  return { message: raw };
}
