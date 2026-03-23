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
  ArtifactType,
  Module,
  ModulePhase,
  Project,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

type PhasePrerequisite =
  | { source: 'module'; from: ModulePhase; artifactType: ArtifactType }
  | { source: 'project'; artifactType: ArtifactType };

const phaseOwnPrerequisite: Record<ModulePhase, PhasePrerequisite> = {
  analyze: { source: 'project', artifactType: 'migration_plan' },
  migrate: {
    source: 'module',
    from: 'analyze',
    artifactType: 'module_migration_plan',
  },
  publish: {
    source: 'module',
    from: 'migrate',
    artifactType: 'migrated_sources',
  },
};

const phaseOrder: ModulePhase[] = ['analyze', 'migrate', 'publish'];

const checkPrerequisite = (
  prereq: PhasePrerequisite,
  module: Module,
  project: Project,
): boolean => {
  if (prereq.source === 'project') {
    return project.migrationPlan?.type === prereq.artifactType;
  }
  return !!module[prereq.from]?.artifacts?.some(
    a => a.type === prereq.artifactType,
  );
};

/**
 * Returns true when the module has all prerequisite artifacts
 * needed to run the given phase — including all prerequisites
 * of preceding phases.
 */
export const hasPhasePrerequisites = (
  module: Module,
  phase: ModulePhase,
  project: Project,
): boolean => {
  for (const p of phaseOrder) {
    if (!checkPrerequisite(phaseOwnPrerequisite[p], module, project)) {
      return false;
    }
    if (p === phase) {
      break;
    }
  }
  return true;
};
