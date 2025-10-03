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
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';

import { migrate } from './database/migration';
import {
  RepositoryDao,
  ScaffolderTaskDao,
  TaskLocationsDao,
} from './database/repositoryDao';
import { createRouter } from './service/router';

/**
 * The bulk-import backend plugin.
 * @public
 */
export const bulkImportPlugin = createBackendPlugin({
  pluginId: 'bulk-import',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        http: coreServices.httpRouter,
        cache: coreServices.cache,
        discovery: coreServices.discovery,
        permissions: coreServices.permissions,
        httpAuth: coreServices.httpAuth,
        auth: coreServices.auth,
        catalogApi: catalogServiceRef,
        auditor: coreServices.auditor,
        database: coreServices.database,
      },
      async init({
        config,
        logger,
        http,
        cache,
        discovery,
        permissions,
        httpAuth,
        auth,
        catalogApi,
        auditor,
        database,
      }) {
        const knex = await database.getClient();

        migrate(knex);
        const repositoryDao = new RepositoryDao(knex, logger);
        const taskDao = new ScaffolderTaskDao(knex);
        const taskLocationsDao = new TaskLocationsDao(knex);

        const router = await createRouter({
          config,
          cache,
          discovery,
          permissions,
          logger,
          httpAuth,
          auth,
          catalogApi,
          auditor,
          repositoryDao,
          taskDao,
          taskLocationsDao,
        });
        http.use(router);
        http.addAuthPolicy({
          path: '/ping',
          allow: 'unauthenticated',
        });
      },
    });
  },
});
