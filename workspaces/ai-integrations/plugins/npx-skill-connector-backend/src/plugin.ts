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
import { processArtifacts } from './services/processArtifacts';
import type { NpxSourceConfig } from './services/types';

/**
 * npxSkillConnectorPlugin backend plugin
 *
 * Registers public Agent Skills v0.2 index sources, discovers entries,
 * retrieves and verifies artifacts, normalizes metadata, and serves
 * snapshots via GET /skills/:sourceId.
 *
 * It does not create AiResource entities or mutate the catalog.
 * Public sources only; no npx execution, Git crawling, or
 * private-registry authentication.
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

        // Schedule periodic refresh for each source
        for (const source of sources) {
          await scheduler.scheduleTask({
            id: `npx-skill-connector:refresh:${source.id}`,
            ...source.schedule,
            fn: async (abortSignal?: AbortSignal) => {
              const childLogger = logger.child({
                source: source.id,
              });
              await refreshSource(source, snapshots, childLogger, abortSignal);
            },
          });
        }

        logger.info(
          `npx skill connector initialized with ${sources.length} source(s)`,
        );
      },
    });
  },
});

/**
 * Runs a single source refresh: discover, retrieve artifacts, verify,
 * normalize, and publish the snapshot atomically.
 *
 * Exported for testing; not part of the public package API.
 *
 * @internal
 */
export async function refreshSource(
  source: NpxSourceConfig,
  snapshots: Map<string, SkillSnapshot>,
  logger: LoggerService,
  abortSignal?: AbortSignal,
): Promise<void> {
  logger.info(`Starting refresh for source '${source.id}'`);

  try {
    // Discover entries from the index
    const discovery = await discoverIndex(source, logger, abortSignal);

    if (discovery.entries.length === 0 && !discovery.complete) {
      // Total discovery failure — no entries, incomplete
      snapshots.set(
        source.id,
        createFailedSnapshot(
          { id: source.id, type: 'npx' },
          new Date().toISOString(),
        ),
      );
      logger.error(`Discovery failed for source '${source.id}'`);
      return;
    }

    // Process artifacts for discovered entries
    const processing = await processArtifacts(
      discovery.entries,
      source,
      logger,
      abortSignal,
    );

    // Combine failed keys from discovery and artifact processing
    const allFailedKeys = [...discovery.failedKeys, ...processing.failedKeys];

    // Discovery is complete only if both phases completed without failures
    const discoveryComplete =
      discovery.complete && processing.failedKeys.length === 0;

    const observedAt = new Date().toISOString();

    const snapshot = boundSnapshot({
      source: { id: source.id, type: 'npx' },
      records: processing.records,
      failedSkillKeys: allFailedKeys,
      discoveryComplete,
      observedAt,
    });

    // Publish atomically
    snapshots.set(source.id, snapshot);

    logger.info(
      `Refresh complete for source '${source.id}': ` +
        `status=${snapshot.status}, ` +
        `skills=${snapshot.skills.length}, ` +
        `failedKeys=${snapshot.failedSkillKeys.length}`,
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    logger.error(
      `Unexpected error during refresh for source '${source.id}': ${detail}`,
    );
    snapshots.set(
      source.id,
      createFailedSnapshot(
        { id: source.id, type: 'npx' },
        new Date().toISOString(),
      ),
    );
  }
}
