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
 * Common types and utilities for the DCM plugin.
 * Add shared code between frontend and backend plugins here.
 *
 * @packageDocumentation
 */

/** Plugin ID for the DCM plugin. @public */
export const DCM_COMMON_PLUGIN_ID = 'dcm' as const;

export { dcmPluginReadPermission, dcmPluginPermissions } from './permissions';
export {
  DCM_ENTITY_STATUS,
  DCM_ENTITY_STATUS_VALUES,
  displayDcmEntityStatus,
  displayDcmEntityStatusLoose,
  parseDcmEntityStatus,
  type DcmEntityStatus,
} from './entityStatus';

export * from './types';
export * from './clients';
export { DcmClientError } from './errors/DcmClientError';
export { extractApiError } from './utils/extractApiError';
