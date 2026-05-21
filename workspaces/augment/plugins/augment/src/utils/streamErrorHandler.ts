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

import { isAbortError } from './isAbortError';

/**
 * Classifies a stream error and returns an error message string if the caller
 * should display an error. Returns undefined when the error should be ignored
 * (user cancelled via AbortError, or component unmounted).
 */
const FRIENDLY_ERROR_MAP: Array<[RegExp, string]> = [
  [
    /\[Errno -?\d+\]\s*Name or service not known/i,
    'Unable to connect to the agent. Check that it is deployed and the Kagenti URL is configured correctly.',
  ],
  [
    /connection\s*(error|refused|reset)/i,
    'Unable to connect to the agent. The service may be starting up or temporarily unavailable.',
  ],
  [
    /ECONNREFUSED/i,
    'Connection refused. The agent service is not accepting connections.',
  ],
  [
    /ETIMEDOUT|timed?\s*out/i,
    'The request timed out. The agent may be under heavy load.',
  ],
  [
    /no healthy upstream|upstream connect error/i,
    'The agent service has no healthy instances. It may be scaling up or redeploying.',
  ],
  [
    /context_id.*not found|context.*expired/i,
    'The conversation context has expired. Please start a new chat session.',
  ],
  [
    /agent.*not ready|agent.*unavailable/i,
    'The agent is not ready to accept requests. It may still be initializing.',
  ],
  [
    /network|fetch failed/i,
    'A network error occurred. Check your connection and try again.',
  ],
  [
    /401|unauthorized/i,
    'Authentication failed. Your session may have expired.',
  ],
  [
    /403|forbidden/i,
    'Access denied. You may not have permission to use this agent.',
  ],
  [/404|not found/i, 'The requested agent or endpoint was not found.'],
  [/5\d{2}\s/i, 'The server encountered an error. Please try again later.'],
];

function friendlyError(raw: string): string {
  for (const [pattern, friendly] of FRIENDLY_ERROR_MAP) {
    if (pattern.test(raw)) return friendly;
  }
  return raw;
}

export function handleStreamError(
  err: unknown,
  _abortControllerRef: { current: AbortController | null },
  mountedRef: { current: boolean },
): string | undefined {
  if (isAbortError(err)) {
    return undefined;
  }
  if (!mountedRef.current) {
    return undefined;
  }
  if (err instanceof Error) {
    return friendlyError(err.message);
  }
  return 'An unexpected error occurred.';
}
