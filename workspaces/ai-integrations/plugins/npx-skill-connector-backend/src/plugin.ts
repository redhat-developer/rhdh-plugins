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
import { createLoadingSnapshot } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import type {
  SkillSnapshot,
  SnapshotSource,
} from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import { createRouter } from './router';
import { readNpxConnectorOptions, readSourceConfigs } from './services/config';
import type { NpxSourceConfig } from './services/types';

/**
 * npxSkillConnectorPlugin backend plugin
 *
 * Acquires data from public Agent Skills v0.2 discovery indexes
 * configured in app-config. Provides safe outbound transport for
 * index and artifact requests. Serves source-scoped SkillSnapshots
 * via GET /skills/:sourceId.
 *
 * This connector acquires data only; it does not create AiResource
 * entities or mutate the catalog. Public sources only; no npx
 * execution, Git crawling, or private-registry authentication.
 *
 * Index parsing and artifact normalization are left to following stories
 * (tasks 3.1, 3.2, 3.4). This story establishes the plugin skeleton,
 * configuration, and safe transport.
 *
 * @public
 */
export const npxSkillConnectorPlugin = createBackendPlugin({
  pluginId: 'npx-skill-connector',
  register(env) {
    env.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        lifecycle: coreServices.lifecycle,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        scheduler: coreServices.scheduler,
      },
      async init({ logger, httpRouter, lifecycle, config, scheduler }) {
        const pluginLogger = logger.child({
          source: 'npxSkillConnectorPlugin',
        });

        const options = readNpxConnectorOptions(config);
        const sources: NpxSourceConfig[] = readSourceConfigs(
          config,
          pluginLogger,
        );

        // Per-source snapshot storage — atomic publication
        const snapshots = new Map<string, SkillSnapshot>();

        // Initialize each source with loading snapshot
        for (const source of sources) {
          const snapshotSource: SnapshotSource = {
            id: source.id,
            type: 'npx',
          };
          snapshots.set(source.id, createLoadingSnapshot(snapshotSource));
        }

        httpRouter.use(await createRouter(pluginLogger, snapshots));
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });

        for (const source of sources) {
          pluginLogger.info(
            `Source '${source.id}': indexUrl=${source.indexUrl}, ` +
              `schedule=${JSON.stringify(source.schedule)}`,
          );

          await scheduler.scheduleTask({
            id: `npx-skill-refresh-${source.id}`,
            ...source.schedule,
            fn: async (_abortSignal: AbortSignal) => {
              // Index parsing and artifact retrieval/normalization are
              // implemented in tasks 3.1, 3.2, 3.4.
              // This task (3.3/5.1) establishes plugin skeleton, config,
              // and safe transport. The scheduled refresh is a placeholder
              // that logs readiness — the HTTP client exercised by tests
              // is the primary deliverable.
              pluginLogger.info(
                `Refresh placeholder for source '${source.id}' — ` +
                  `transport and config are ready; index parsing pending`,
              );
            },
          });
        }

        lifecycle.addShutdownHook(async () => {
          pluginLogger.info('npx skill connector shutting down');
        });

        pluginLogger.info(
          `npx skill connector initialized with ${sources.length} source(s) ` +
            `(fetchTimeoutMs=${options.fetchTimeoutMs}, ` +
            `maxArtifactSizeBytes=${options.maxArtifactSizeBytes}, ` +
            `maxArtifacts=${options.maxArtifacts})`,
        );
      },
    });
  },
});
