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
import type { NpxSourceConfig } from './services/types';

/**
 * npxSkillConnectorPlugin backend plugin
 *
 * Registers public Agent Skills v0.2 index sources and serves their
 * initial loading snapshots via GET /skills/:sourceId.
 *
 * It does not create AiResource entities or mutate the catalog.
 * Public sources only; no npx execution, Git crawling, or
 * private-registry authentication.
 *
 * Index retrieval, parsing, and artifact normalization are left to
 * following stories (tasks 3.1, 3.2, 3.4).
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
      },
      async init({ logger, httpRouter, config }) {
        const sources: NpxSourceConfig[] = readSourceConfigs(config, logger);
        const snapshots = new Map<string, SkillSnapshot>();

        for (const source of sources) {
          snapshots.set(
            source.id,
            createLoadingSnapshot({ id: source.id, type: 'npx' }),
          );
        }

        httpRouter.use(createRouter(snapshots));
        logger.info(
          `npx skill connector initialized with ${sources.length} source(s)`,
        );
      },
    });
  },
});
