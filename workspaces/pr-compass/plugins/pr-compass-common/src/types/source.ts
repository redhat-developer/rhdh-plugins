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
 * SCM integration supported by a registered pull request provider.
 *
 * @public
 */
export type Source = {
  /** Unique source ID in the format of `type:host`. */
  id: string;
  /** The SCM integration type that matches a registered pull request provider, e.g. `github`. */
  type: string;
  host: string;
  title: string;
  /** Base URL of the SCM integration, used to obtain user credentials. */
  baseUrl: string;
};

/**
 * Error codes for source operations.
 *
 * @public
 */
export const SourceErrorCodes = {
  SCM_SESSION_REQUIRED: 'SCM_SESSION_REQUIRED',
  UNAUTHORISED: 'UNAUTHORISED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  FETCH_FAILED: 'FETCH_FAILED',
} as const;

/**
 * Error code for source operation.
 *
 * @public
 */
export type SourceErrorCode =
  (typeof SourceErrorCodes)[keyof typeof SourceErrorCodes];

/**
 * Outcome of retrieving pull requests from a source.
 *
 * @public
 */
export type SourceStatus = {
  sourceId: string;
  /** Whether additional matching pull requests were omitted due to the limit. */
  truncated?: boolean;
  error?: SourceErrorCode;
};

/**
 * Response of SCM sources supported by registered pull request providers.
 *
 * @public
 */
export type SourcesResponse = {
  sources: Source[];
};
