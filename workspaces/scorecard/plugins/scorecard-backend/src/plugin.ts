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
import { createRouter } from './service/router';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import {
  MetricProvider,
  scorecardMetricsExtensionPoint,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { MetricProvidersRegistry } from './providers/MetricProvidersRegistry';
import { CatalogMetricService } from './service/CatalogMetricService';
import { CatalogClient } from '@backstage/catalog-client';
import { ThresholdEvaluator } from './threshold/ThresholdEvaluator';
import { scorecardPermissions } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  scorecardMetricPermissionResourceRef,
  rules as scorecardRules,
} from './permissions/rules';
import { migrate } from './database/migration';
import { DatabaseMetricValuesStore } from './database/DatabaseMetricValuesStore';
import { connectMetricProviders } from './providers/Connection';

/**
 * scorecardPlugin backend plugin
 *
 * @public
 */
export const scorecardPlugin = createBackendPlugin({
  pluginId: 'scorecard',
  register(env) {
    const metricProvidersRegistry = new MetricProvidersRegistry();

    env.registerExtensionPoint(scorecardMetricsExtensionPoint, {
      addMetricProvider(...newMetricProviders: MetricProvider[]) {
        newMetricProviders.forEach(metricProvider => {
          metricProvidersRegistry.register(metricProvider);
        });
      },
    });

    env.registerInit({
      deps: {
        discovery: coreServices.discovery,
        auth: coreServices.auth,
        httpRouter: coreServices.httpRouter,
        catalog: catalogServiceRef,
        httpAuth: coreServices.httpAuth,
        logger: coreServices.logger,
        permissions: coreServices.permissions,
        permissionsRegistry: coreServices.permissionsRegistry,
        database: coreServices.database,
      },
      async init({
        discovery,
        auth,
        httpRouter,
        httpAuth,
        logger,
        permissions,
        permissionsRegistry,
        database,
      }) {
        permissionsRegistry.addResourceType({
          resourceRef: scorecardMetricPermissionResourceRef,
          permissions: scorecardPermissions,
          rules: Object.values(scorecardRules),
        });

        // Run database migrations
        await migrate(database);

        const knex = await database.getClient();
        const metricValuesStore = new DatabaseMetricValuesStore({
          knex,
          logger,
        });

        const catalogClient = new CatalogClient({ discoveryApi: discovery });
        const catalogMetricService = new CatalogMetricService({
          catalogApi: catalogClient,
          registry: metricProvidersRegistry,
          thresholdEvaluator: new ThresholdEvaluator(),
          auth,
          metricValuesStore,
        });
        await connectMetricProviders(
          metricProvidersRegistry.listProviders(),
          metricValuesStore,
        );

        httpRouter.use(
          await createRouter({
            metricProvidersRegistry,
            catalogMetricService,
            httpAuth,
            permissions,
          }),
        );
      },
    });
  },
});
