/*
 * Copyright The Backstage Authors
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
import { CatalogClient } from '@backstage/catalog-client';
import { dynamicPluginsServiceRef } from '@backstage/backend-dynamic-feature-service';

import {
  ExtensionsApi,
  ExtensionsCatalogClient,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import { createRouter } from './router';
import { InstallationDataService } from './installation/InstallationDataService';

/**
 * Extensions backend plugin
 *
 * @public
 */
export const extensionsPlugin = createBackendPlugin({
  pluginId: 'extensions',
  register(env) {
    env.registerInit({
      deps: {
        auth: coreServices.auth,
        config: coreServices.rootConfig,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        discovery: coreServices.discovery,
        logger: coreServices.logger,
        permissions: coreServices.permissions,
        pluginProvider: dynamicPluginsServiceRef,
      },
      async init({
        pluginProvider,
        auth,
        config,
        httpAuth,
        httpRouter,
        discovery,
        logger,
        permissions,
      }) {
        const catalogApi = new CatalogClient({ discoveryApi: discovery });

        const extensionsApi: ExtensionsApi = new ExtensionsCatalogClient({
          auth,
          catalogApi,
        });

        const installationDataService: InstallationDataService =
          InstallationDataService.fromConfig({
            config,
            extensionsApi,
            logger,
          });

        httpRouter.use(
          await createRouter({
            httpAuth,
            installationDataService,
            extensionsApi,
            permissions,
            pluginProvider,
            logger,
            config,
          }),
        );
      },
    });
  },
});

// /**
//  * @public
//  * @deprecated Use extensionsPlugin instead
//  */
// export const extensionsPlugin = extensionsPlugin;
