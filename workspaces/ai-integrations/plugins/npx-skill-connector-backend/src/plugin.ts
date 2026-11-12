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
import type { SkillSnapshot } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import { createRouter } from './router';
import { readSourceConfigs } from './services/config';
import { refreshSource } from './services/refreshSource';
import type { NpxSourceConfig } from './services/types';

/**
 * npxSkillConnectorPlugin backend plugin
 *
 * Registers public Agent Skills v0.2 index sources, discovers entries,
 * retrieves and verifies artifacts, normalizes metadata, and serves
 * authenticated snapshots via GET /skills/:sourceId.
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
          logger.debug(
            `Source '${source.id}': schedule=${JSON.stringify(
              source.schedule,
            )}`,
          );
        }

        logger.info(
          `npx skill connector initialized with ${sources.length} source(s)`,
        );
      },
    });
  },
});
