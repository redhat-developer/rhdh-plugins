import { TranslationFunction } from '@backstage/core-plugin-api/alpha';
import { x2aPluginTranslationRef } from '../../translations';

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

/**
 * Gives user-friendly names to the types set by the backend.
 *
 * Keep in sync with constants produced by the backend.
 */
export const humanizeArtifactType = (
  t: TranslationFunction<typeof x2aPluginTranslationRef.T>,
  type: string,
): string => {
  switch (type) {
    case 'migration_plan':
      return t('artifact.types.migration_plan');
    case 'module_migration_plan':
      return t('artifact.types.module_migration_plan');
    case 'migrated_sources':
      return t('artifact.types.migrated_sources');
    default:
      // Do not fail but let developers know...
      // eslint-disable-next-line no-console
      console.error(`humanizeArtifactType: Unknown artifact type: ${type}`);
      return type;
  }
};
