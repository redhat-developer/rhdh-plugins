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

import type { LoggerService } from '@backstage/backend-plugin-api';
import type {
  Artifact,
  MigrationPhase,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import type { RouterDeps } from './types';

interface MetadataModule {
  name: string;
  path: string;
  description?: string;
  technology?: string;
}

export interface PhaseActionContext {
  projectId: string;
  artifacts: Artifact[];
  x2aDatabase: RouterDeps['x2aDatabase'];
  logger: LoggerService;
}

interface PhaseAction {
  execute(context: PhaseActionContext): Promise<void>;
}

class InitPhaseAction implements PhaseAction {
  async execute(context: PhaseActionContext): Promise<void> {
    const metadataArtifact = context.artifacts.find(
      a => a.type === 'project_metadata',
    );
    if (!metadataArtifact) {
      return;
    }

    let metadataModules: MetadataModule[];
    try {
      metadataModules = JSON.parse(metadataArtifact.value);
    } catch (error) {
      context.logger.warn(
        `Failed to parse project_metadata artifact, skipping module sync: ${error instanceof Error ? error.message : String(error)}`,
      );
      return;
    }

    await this.syncModules(context, metadataModules);
  }

  private async syncModules(
    context: PhaseActionContext,
    metadataModules: MetadataModule[],
  ): Promise<void> {
    const { projectId, x2aDatabase, logger } = context;

    const existingModules = await x2aDatabase.listModules({ projectId });
    const existingNames = new Set(existingModules.map(m => m.name));
    const metadataNames = new Set(metadataModules.map(m => m.name));

    const toAdd = metadataModules.filter(m => !existingNames.has(m.name));
    const toRemove = existingModules.filter(m => !metadataNames.has(m.name));

    await Promise.all(
      toRemove.map(m => {
        logger.info(
          `Removing module "${m.name}" (${m.id}) from project ${projectId}`,
        );
        return x2aDatabase.deleteModule({ id: m.id });
      }),
    );

    await Promise.all(
      toAdd.map(m => {
        logger.info(`Creating module "${m.name}" for project ${projectId}`);
        return x2aDatabase.createModule({
          name: m.name,
          sourcePath: m.path,
          projectId,
        });
      }),
    );

    logger.info(
      `Module sync complete for project ${projectId}: added=${toAdd.length}, removed=${toRemove.length}, kept=${existingModules.length - toRemove.length}`,
    );
  }
}

const phaseActionRegistry = new Map<MigrationPhase, PhaseAction>([
  ['init', new InitPhaseAction()],
]);

export async function executePhaseActions(
  phase: MigrationPhase,
  context: PhaseActionContext,
): Promise<void> {
  const action = phaseActionRegistry.get(phase);
  if (!action) {
    return;
  }

  await action.execute(context);
}
