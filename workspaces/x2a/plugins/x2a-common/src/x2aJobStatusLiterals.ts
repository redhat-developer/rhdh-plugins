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

import type { JobStatusEnum } from '../client/src/schema/openapi/generated/models/JobStatusEnum.model';

/**
 * Every {@link JobStatusEnum} value (same union as module aggregate `ModuleStatus` in OpenAPI), in
 * a stable order for Zod `z.enum()` and similar. Update when OpenAPI / codegen adds or removes a
 * status.
 *
 * @public
 */
export const X2A_JOB_STATUS_VALUES = [
  'pending',
  'running',
  'success',
  'error',
  'cancelled',
] as const satisfies readonly JobStatusEnum[];

/**
 * Compile-time check: {@link X2A_JOB_STATUS_VALUES} matches OpenAPI {@link JobStatusEnum}
 * (and module `ModuleStatus`). If codegen adds/removes a status, update the tuple.
 *
 * @remarks
 * Written without private helper aliases so API Extractor does not emit `ae-forgotten-export`
 * warnings for this package's API report.
 *
 * @public
 */
export type X2AJobStatusValuesSyncWithOpenApi =
  JobStatusEnum extends (typeof X2A_JOB_STATUS_VALUES)[number]
    ? (typeof X2A_JOB_STATUS_VALUES)[number] extends JobStatusEnum
      ? true
      : false
    : false;

// compile-type assert
const _assertJobStatusValuesSync: X2AJobStatusValuesSyncWithOpenApi = true;
void _assertJobStatusValuesSync;
