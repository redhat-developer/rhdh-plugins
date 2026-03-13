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
 * Extracts an error message from a non-ok fetch Response.
 *
 * Tries to parse the Backstage-standard `{ error: { message } }` JSON body;
 * falls back to the provided `fallback` string.
 */
export async function extractResponseError(
  response: Pick<Response, 'json'>,
  fallback: string,
): Promise<string> {
  try {
    const body = (await response.json()) as {
      error?: { message?: string };
    };
    return body?.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}
