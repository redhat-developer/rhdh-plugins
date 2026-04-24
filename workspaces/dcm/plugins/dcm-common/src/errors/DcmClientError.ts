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

import type { DcmApiError } from '../types/common';

/**
 * Error thrown by DCM API clients when the upstream returns a non-OK response.
 *
 * Carries the HTTP `status` code and, when the response body is valid RFC 7807
 * / AEP-193 JSON, a structured `apiError` object.  The `.message` is always a
 * human-readable string so existing `catch (e) { ... e.message }` usage
 * continues to work without changes.
 *
 * @public
 */
export class DcmClientError extends Error {
  /** HTTP response status code (e.g. 404, 422, 503). */
  readonly status: number;

  /**
   * Parsed RFC 7807 / AEP-193 problem detail, when the upstream body was valid
   * JSON with a `title` field.  `undefined` for non-JSON or unrecognised shapes.
   */
  readonly apiError: DcmApiError | undefined;

  constructor(message: string, status: number, apiError?: DcmApiError) {
    super(message);
    this.name = 'DcmClientError';
    this.status = status;
    this.apiError = apiError;
  }

  /**
   * Attempt to build a `DcmClientError` from a raw response body string.
   *
   * If the body is valid JSON with a `title` property it is treated as a
   * `DcmApiError`; otherwise only the raw text is used for the message.
   */
  static fromResponse(
    serviceName: string,
    status: number,
    body: string,
  ): DcmClientError {
    let apiError: DcmApiError | undefined;
    try {
      const parsed = JSON.parse(body);
      if (
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed) &&
        typeof parsed.title === 'string'
      ) {
        apiError = parsed as DcmApiError;
      }
    } catch {
      // body is not JSON — apiError stays undefined
    }

    const detail = apiError?.detail ?? apiError?.title ?? body;
    const message = `DCM ${serviceName} API error ${status}: ${detail}`;
    return new DcmClientError(message, status, apiError);
  }
}
