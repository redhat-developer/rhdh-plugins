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

import type { Artifact, Job } from '../../client/src/schema/openapi';
import { ArtifactKind } from './ArtifactKind';

/**
 * Returns the project migration plan artifact, if the project has one.
 *
 * @public
 */
export function findMigrationPlanArtifact(project: {
  migrationPlan?: Artifact;
}): Artifact | undefined {
  const artifact = project.migrationPlan;
  return artifact && ArtifactKind.from(artifact.type).isMigrationPlan()
    ? artifact
    : undefined;
}

/**
 * Returns the module migration plan artifact produced by the module's analyze job, if any.
 *
 * @public
 */
export function findModuleMigrationPlanArtifact(module: {
  analyze?: Pick<Job, 'artifacts'>;
}): Artifact | undefined {
  return module.analyze?.artifacts?.find(a =>
    ArtifactKind.from(a.type).isModuleMigrationPlan(),
  );
}
