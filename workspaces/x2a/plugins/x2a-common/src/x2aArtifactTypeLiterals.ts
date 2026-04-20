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

import type { ArtifactType } from '../client/src/schema/openapi/generated/models/ArtifactType.model';

/**
 * Every {@link ArtifactType} value from OpenAPI, in enum order for Zod `z.enum()` and similar.
 * Update when OpenAPI / codegen adds or removes an artifact type.
 *
 * @public
 */
export const X2A_ARTIFACT_TYPE_VALUES = [
  'migration_plan',
  'module_migration_plan',
  'migrated_sources',
  'project_metadata',
  'ansible_project',
] as const satisfies readonly ArtifactType[];

/**
 * Compile-time check: {@link X2A_ARTIFACT_TYPE_VALUES} matches OpenAPI {@link ArtifactType}.
 * If codegen changes, update the tuple.
 *
 * @public
 */
export type X2AArtifactTypeValuesSyncWithOpenApi =
  ArtifactType extends (typeof X2A_ARTIFACT_TYPE_VALUES)[number]
    ? (typeof X2A_ARTIFACT_TYPE_VALUES)[number] extends ArtifactType
      ? true
      : false
    : false;
