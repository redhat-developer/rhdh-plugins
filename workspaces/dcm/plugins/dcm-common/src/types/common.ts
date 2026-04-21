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
 * Common types shared across all DCM API services.
 *
 * @public
 */

/** AEP-193 / RFC 7807 error type codes returned by DCM services. */
export type DcmErrorType =
  | 'INVALID_ARGUMENT'
  | 'UNAUTHENTICATED'
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'PERMISSION_DENIED'
  | 'RESOURCE_EXHAUSTED'
  | 'FAILED_PRECONDITION'
  | 'ABORTED'
  | 'OUT_OF_RANGE'
  | 'UNIMPLEMENTED'
  | 'INTERNAL'
  | 'UNAVAILABLE'
  | 'DEADLINE_EXCEEDED';

/** RFC 7807 / AEP-193 problem detail returned on API errors. */
export interface DcmApiError {
  type: DcmErrorType | (string & {});
  status?: number;
  title: string;
  detail?: string;
  instance?: string;
}

/** Health check response returned by each DCM service's `/health` endpoint. */
export interface DcmHealth {
  status: string;
  path?: string;
}
