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
import { prCompassPermissions } from '@red-hat-developer-hub/backstage-plugin-pr-compass-common';
import {
  prCompassProvidersExtensionPoint,
  type PullRequestProvider,
} from '@red-hat-developer-hub/backstage-plugin-pr-compass-node';
import { PullRequestProvidersRegistry } from './providers/PullRequestProvidersRegistry';
import { PullRequestService } from './service/PullRequestService';
import { SourceResolver } from './service/SourceResolver';
import { createRouter } from './service/router';
import { DEFAULT_MAX_PULL_REQUESTS } from './constants';

/**
 * The PR Compass backend plugin.
 *
 * @public
 */
export const prCompassPlugin = createBackendPlugin({
  pluginId: 'pr-compass',
  register(env) {
    const registry = new PullRequestProvidersRegistry();

    env.registerExtensionPoint(prCompassProvidersExtensionPoint, {
      addPullRequestProvider(...providers: PullRequestProvider[]) {
        providers.forEach(provider => registry.register(provider));
      },
    });

    env.registerInit({
      deps: {
        config: coreServices.rootConfig,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        permissions: coreServices.permissions,
        permissionsRegistry: coreServices.permissionsRegistry,
      },
      async init({
        config,
        httpAuth,
        httpRouter,
        logger,
        permissions,
        permissionsRegistry,
      }) {
        permissionsRegistry.addPermissions(prCompassPermissions);

        const sources = SourceResolver.fromConfig(config, {
          providersRegistry: registry,
        });

        const maxPullRequests =
          config.getOptionalNumber('prCompass.maxPullRequests') ??
          DEFAULT_MAX_PULL_REQUESTS;

        const pullRequestService = new PullRequestService({
          sourceResolver: sources,
          providersRegistry: registry,
          logger,
          maxPullRequests,
        });

        httpRouter.use(
          await createRouter({
            pullRequestService,
            sourceResolver: sources,
            httpAuth,
            permissions,
          }),
        );

        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
      },
    });
  },
});
