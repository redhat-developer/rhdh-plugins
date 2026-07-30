/**
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

import { ArtifactKind } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { TFuncX2A } from '../../hooks/useTranslation';

/**
 * Gives user-friendly names to the types set by the backend.
 *
 * Keep in sync with constants produced by the backend.
 */
export const humanizeArtifactType = (
  t: TFuncX2A,
  kind: ArtifactKind,
): string => {
  if (kind.isMigrationPlan()) return t('artifact.types.migration_plan');
  if (kind.isModuleMigrationPlan())
    return t('artifact.types.module_migration_plan');
  if (kind.isMigratedSources()) return t('artifact.types.migrated_sources');
  if (kind.isProjectMetadata()) return t('artifact.types.project_metadata');
  if (kind.isAnsibleProject()) return t('artifact.types.ansible_project');

  // Do not fail but let developers know...
  // eslint-disable-next-line no-console
  console.error(
    `humanizeArtifactType: Unknown artifact type: ${kind.toString()}`,
  );
  return kind.toString();
};
