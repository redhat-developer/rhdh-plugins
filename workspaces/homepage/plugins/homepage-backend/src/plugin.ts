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
import { homepagePermissions } from '@red-hat-developer-hub/backstage-plugin-homepage-common';
import { homepageDefaultCardPermissionResourceRef } from './permissions/resource';
import { rules as homepageRules } from './permissions/rules';
import { createRouter } from './router';
import { defaultWidgetsServiceRef } from './services/DefaultWidgetsService';

/**
 * homepagePlugin backend plugin
 *
 * @public
 */
export const homepagePlugin = createBackendPlugin({
  pluginId: 'homepage',
  register(env) {
    env.registerInit({
      deps: {
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        permissionsRegistry: coreServices.permissionsRegistry,
        defaultWidgets: defaultWidgetsServiceRef,
      },
      async init({
        httpAuth,
        httpRouter,
        permissionsRegistry,
        defaultWidgets,
      }) {
        permissionsRegistry.addResourceType({
          resourceRef: homepageDefaultCardPermissionResourceRef,
          getResources: async (resourceRefs: string[]) => {
            return resourceRefs.map(id => ({ id }));
          },
          permissions: homepagePermissions,
          rules: Object.values(homepageRules),
        });
        httpRouter.use(
          await createRouter({
            httpAuth,
            defaultWidgets,
          }),
        );
      },
    });
  },
});
