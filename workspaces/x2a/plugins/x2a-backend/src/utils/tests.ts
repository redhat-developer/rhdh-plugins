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
import {
  Artifact,
  MigrationPhase,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

export const LONG_TEST_TIMEOUT = 60 * 1000;
export const nonExistentId = '00000000-0000-0000-0000-000000000000';

export const getTestArtifacts = (
  phase: MigrationPhase,
): Pick<Artifact, 'type' | 'value'>[] => {
  const artifacts: Pick<Artifact, 'type' | 'value'>[] = [];
  if (phase === 'init') {
    artifacts.push({
      value: 'migration_plan',
      type: 'migration_plan',
    });
  } else if (phase === 'analyze') {
    artifacts.push({
      value: 'module_migration_plan',
      type: 'module_migration_plan',
    });
  } else if (phase === 'migrate') {
    artifacts.push({
      value: 'migrated_sources',
      type: 'migrated_sources',
    });
  }
  return artifacts;
};
