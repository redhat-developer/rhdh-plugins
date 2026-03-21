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
 * True when the HTTP response indicates success (2xx). Prefers `response.ok`
 * when present; otherwise uses `status` (some tests omit `ok`).
 */
export function isHttpSuccessResponse(
  response: Pick<Response, 'ok' | 'status'>,
): boolean {
  if (typeof response.ok === 'boolean') {
    return response.ok;
  }
  const { status } = response;
  return typeof status === 'number' && status >= 200 && status < 300;
}

/**
 * Extracts an error message from a non-ok fetch Response.
 *
 * Supports Backstage `{ error: { message } }`, and the x2a-backend init run
 * conflict shape `{ error: string, message: string }` (e.g. HTTP 409).
 */
export async function extractResponseError(
  response: Pick<Response, 'json'>,
  fallback: string,
): Promise<string> {
  try {
    const body = (await response.json()) as {
      error?: { message?: string } | string;
      message?: string;
    };
    if (typeof body?.error === 'string' && typeof body?.message === 'string') {
      return body.message;
    }
    if (
      body?.error &&
      typeof body.error === 'object' &&
      typeof body.error.message === 'string'
    ) {
      return body.error.message;
    }
    if (typeof body?.message === 'string') {
      return body.message;
    }
    return fallback;
  } catch {
    return fallback;
  }
}
