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
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import type { LoggerService } from '@backstage/backend-plugin-api';
import {
  boundSnapshot,
  createFailedSnapshot,
  createLoadingSnapshot,
} from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import type { SkillSnapshot } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import { createRouter } from './router';
import { readSourceConfigs } from './services/config';
import { discoverIndex } from './services/discoverIndex';
import type { NpxSourceConfig } from './services/types';

/**
 * Runs a single discovery refresh for one source, updating the snapshot
 * map atomically.
 */
async function refreshSource(
  source: NpxSourceConfig,
  snapshots: Map<string, SkillSnapshot>,
  logger: LoggerService,
): Promise<void> {
  const sourceLogger = logger.child({ source: source.id });
  sourceLogger.info(`Starting index discovery for source '${source.id}'`);

  try {
    const result = await discoverIndex(source, sourceLogger);
    const observedAt = new Date().toISOString();

    if (result.entries.length === 0 && !result.complete) {
      // No usable entries and discovery was incomplete → failed
      snapshots.set(
        source.id,
        createFailedSnapshot({ id: source.id, type: 'npx' }, observedAt),
      );
      sourceLogger.warn(
        `Discovery failed for source '${source.id}': no entries discovered`,
      );
      return;
    }

    // Build snapshot using boundSnapshot for deterministic ordering and limits.
    // Entries from discoverIndex are already validated discovery candidates;
    // they become records with the entry name as key and the index URL/digest
    // as trusted source identity. Full artifact retrieval and normalization
    // is handled by task 3.2.
    const records = result.entries.map(entry => ({
      key: entry.name,
      name: entry.name,
      ...(entry.description ? { description: entry.description } : {}),
      sourceUri: entry.url,
      digest: entry.digest,
      ...(entry.type === 'skill-md'
        ? { extensions: { npx: { type: 'skill-md' as const } } }
        : {}),
    }));

    const snapshot = boundSnapshot({
      source: { id: source.id, type: 'npx' },
      records,
      failedSkillKeys: result.failedKeys,
      discoveryComplete: result.complete,
      observedAt,
    });

    snapshots.set(source.id, snapshot);
    sourceLogger.info(
      `Discovery completed for source '${source.id}': ${result.entries.length} entries, ` +
        `${result.failedKeys.length} failed keys, status=${snapshot.status}`,
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    sourceLogger.error(
      `Discovery refresh failed for source '${source.id}': ${detail}`,
    );
    const observedAt = new Date().toISOString();
    snapshots.set(
      source.id,
      createFailedSnapshot({ id: source.id, type: 'npx' }, observedAt),
    );
  }
}

/**
 * npxSkillConnectorPlugin backend plugin
 *
 * Registers public Agent Skills v0.2 index sources, discovers skill-md
 * entries via scheduled refresh, and serves normalized snapshots via
 * GET /skills/:sourceId.
 *
 * It does not create AiResource entities or mutate the catalog.
 * Public sources only; no npx execution, Git crawling, or
 * private-registry authentication.
 *
 * Artifact retrieval, verification, and frontmatter normalization are
 * left to following stories (tasks 3.2, 3.3).
 *
 * @public
 */
export const npxSkillConnectorPlugin = createBackendPlugin({
  pluginId: 'npx-skill-connector',
  register(env) {
    env.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        scheduler: coreServices.scheduler,
      },
      async init({ logger, httpRouter, config, scheduler }) {
        const sources: NpxSourceConfig[] = readSourceConfigs(config, logger);
        const snapshots = new Map<string, SkillSnapshot>();

        for (const source of sources) {
          snapshots.set(
            source.id,
            createLoadingSnapshot({ id: source.id, type: 'npx' }),
          );
        }

        httpRouter.use(createRouter(snapshots));

        // Schedule discovery for each source
        for (const source of sources) {
          await scheduler.scheduleTask({
            id: `npx-skill-connector:discover:${source.id}`,
            ...source.schedule,
            fn: async () => refreshSource(source, snapshots, logger),
          });
        }

        logger.info(
          `npx skill connector initialized with ${sources.length} source(s)`,
        );
      },
    });
  },
});
