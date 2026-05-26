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
import {
  ArtifactKind,
  normalizeSourceTechnology,
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
    const metadataArtifact = context.artifacts.find(a =>
      ArtifactKind.from(a.type).isProjectMetadata(),
    );
    if (!metadataArtifact) {
      return;
    }

    let metadataModules: MetadataModule[];
    try {
      const parsed = JSON.parse(metadataArtifact.value);
      if (!Array.isArray(parsed)) {
        context.logger.warn(
          `project_metadata artifact is not an array, skipping module sync`,
        );
        return;
      }
      metadataModules = parsed;
    } catch (error) {
      context.logger.warn(
        `Failed to parse project_metadata artifact, skipping module sync: ${error instanceof Error ? error.message : String(error)}`,
      );
      return;
    }

    await this.syncModules(context, metadataModules);
  }

  private normalizeTechWithWarning(
    logger: LoggerService,
    technology: string | undefined,
    moduleName: string,
  ): ReturnType<typeof normalizeSourceTechnology> {
    const normalized = normalizeSourceTechnology(technology);
    if (technology && !normalized) {
      logger.warn(
        `Unrecognized source technology "${technology}" for module "${moduleName}" - storing as undefined`,
      );
    }
    return normalized;
  }

  private classifyModuleChanges(
    logger: LoggerService,
    existingModules: Awaited<
      ReturnType<PhaseActionContext['x2aDatabase']['listModules']>
    >,
    metadataModules: MetadataModule[],
    projectId: string,
  ) {
    const existingByName = new Map(
      existingModules.map(m => [m.name.trim(), m]),
    );
    const metadataNames = new Set(metadataModules.map(m => m.name.trim()));

    logger.debug(
      `syncModules for project ${projectId}: existingNames=[${[...existingByName.keys()].join(', ')}], metadataNames=[${[...metadataNames].join(', ')}]`,
    );

    // Modules in DB but not in metadata: soft-delete
    const toRemove = existingModules.filter(
      m => !metadataNames.has(m.name.trim()) && !m.removedAt,
    );

    // Modules in metadata but not in DB (or previously soft-deleted): add or restore
    const toAdd: MetadataModule[] = [];
    const toRestore: typeof existingModules = [];
    const toUpdate: Array<{
      id: string;
      sourcePath?: string;
      technology?: ReturnType<typeof normalizeSourceTechnology>;
    }> = [];

    for (const mm of metadataModules) {
      const existing = existingByName.get(mm.name.trim());
      if (existing) {
        const technology = this.normalizeTechWithWarning(
          logger,
          mm.technology,
          mm.name,
        );
        const pathChanged = existing.sourcePath !== mm.path;
        const techChanged = existing.technology !== technology;

        if (existing.removedAt) {
          toRestore.push(existing);
        }

        if (pathChanged || techChanged) {
          toUpdate.push({
            id: existing.id,
            ...(pathChanged ? { sourcePath: mm.path } : {}),
            ...(techChanged ? { technology } : {}),
          });
        }
      } else {
        toAdd.push(mm);
      }
    }

    return { toRemove, toAdd, toRestore, toUpdate };
  }

  private async syncModules(
    context: PhaseActionContext,
    metadataModules: MetadataModule[],
  ): Promise<void> {
    const { projectId, x2aDatabase, logger } = context;

    const existingModules = await x2aDatabase.listModules({
      projectId,
      includeRemoved: true,
    });

    logger.debug(
      `syncModules for project ${projectId}: existingNames=[${existingModules.map(m => m.name).join(', ')}], metadataNames=[${metadataModules.map(m => m.name).join(', ')}]`,
    );

    const { toRemove, toAdd, toRestore, toUpdate } = this.classifyModuleChanges(
      logger,
      existingModules,
      metadataModules,
      projectId,
    );

    // Persist the changes
    await Promise.all([
      ...toRemove.map(m => {
        logger.info(
          `Soft-deleting module "${m.name}" (${m.id}) from project ${projectId}`,
        );
        return x2aDatabase.softDeleteModule({ id: m.id });
      }),
      ...toRestore.map(m => {
        logger.info(
          `Restoring previously removed module "${m.name}" (${m.id}) in project ${projectId}`,
        );
        return x2aDatabase.restoreModule({ id: m.id });
      }),
    ]);

    await Promise.all(
      toAdd.map(m => {
        const technology = this.normalizeTechWithWarning(
          logger,
          m.technology,
          m.name,
        );
        logger.info(
          `Creating module "${m.name}" for project ${projectId} with technology ${technology}`,
        );
        return x2aDatabase.createModule({
          name: m.name,
          sourcePath: m.path,
          projectId,
          technology,
        });
      }),
    );

    await Promise.all(
      toUpdate.map(({ id, sourcePath, technology }) => {
        logger.info(
          `Updating module (${id}) in project ${projectId}: sourcePath=${sourcePath ?? '(unchanged)'}, technology=${technology ?? '(unchanged)'}`,
        );
        return x2aDatabase.updateModule({ id, sourcePath, technology });
      }),
    );

    logger.info(
      `Module sync complete for project ${projectId}: added=${toAdd.length}, removed=${toRemove.length}, restored=${toRestore.length}, updated=${toUpdate.length}`,
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
