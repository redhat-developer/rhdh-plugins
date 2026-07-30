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

export class ResponsesApiError extends Error {
  readonly statusCode: number;
  readonly detail: string;
  readonly rawBody: string;

  constructor(statusCode: number, statusMessage: string, rawBody: string) {
    const detail = ResponsesApiError.extractDetail(rawBody);
    super(`Responses API error: ${statusCode} ${statusMessage} - ${detail}`);
    Object.setPrototypeOf(this, ResponsesApiError.prototype);
    this.name = 'ResponsesApiError';
    this.statusCode = statusCode;
    this.detail = detail;
    this.rawBody = rawBody;
  }

  isValidationError(): boolean {
    return this.statusCode === 400 || this.statusCode === 422;
  }

  mentionsToolType(): boolean {
    const combined = `${this.detail} ${this.rawBody}`;
    return /unsupported.*tool|tool.*type.*unsupported|function.*tool|unknown.*tool/i.test(
      combined,
    );
  }

  mentionsStrictField(): boolean {
    const combined = `${this.detail} ${this.rawBody}`;
    return (
      /\bstrict\b.*\b(field|param|key|property|schema|valid)/i.test(combined) ||
      /\b(field|param|key|property|unexpected|extra|unknown)\b.*\bstrict\b/i.test(
        combined,
      )
    );
  }

  isContextOverflowError(): boolean {
    const combined = `${this.detail} ${this.rawBody}`;
    return (
      this.statusCode === 400 &&
      /max_tokens\s+must\s+be\s+at\s+least\s+1,\s+got\s+-?\d+/i.test(combined)
    );
  }

  private static extractDetail(rawBody: string): string {
    try {
      const parsed = JSON.parse(rawBody);
      if (typeof parsed.detail === 'string') return parsed.detail;
      if (Array.isArray(parsed.detail)) {
        return parsed.detail
          .map((d: { msg?: string; loc?: unknown[] }) =>
            d.msg
              ? `${d.msg}${d.loc ? ` at ${JSON.stringify(d.loc)}` : ''}`
              : JSON.stringify(d),
          )
          .join('; ');
      }
      if (typeof parsed.error === 'string') return parsed.error;
      if (typeof parsed.message === 'string') return parsed.message;
    } catch {
      // Not JSON
    }
    return rawBody.length > 300 ? `${rawBody.substring(0, 300)}...` : rawBody;
  }
}

export interface ResponsesApiRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

/** @deprecated Use ResponsesApiError instead */
export const LlamaStackApiError = ResponsesApiError;
