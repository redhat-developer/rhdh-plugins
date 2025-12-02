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
import { ThresholdEvaluator } from './threshold/ThresholdEvaluator';
import { scorecardPermissions } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  scorecardMetricPermissionResourceRef,
  rules as scorecardRules,
} from './permissions/rules';
import { migrate } from './database/migration';
import { DatabaseMetricValues } from './database/DatabaseMetricValues';
import { Scheduler } from './scheduler';

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
        auth: coreServices.auth,
        catalog: catalogServiceRef,
        config: coreServices.rootConfig,
        database: coreServices.database,
        httpRouter: coreServices.httpRouter,
        httpAuth: coreServices.httpAuth,
        logger: coreServices.logger,
        permissions: coreServices.permissions,
        permissionsRegistry: coreServices.permissionsRegistry,
        scheduler: coreServices.scheduler,
      },
      async init({
        auth,
        catalog,
        config,
        database,
        httpRouter,
        httpAuth,
        logger,
        permissions,
        permissionsRegistry,
        scheduler,
      }) {
        permissionsRegistry.addResourceType({
          resourceRef: scorecardMetricPermissionResourceRef,
          getResources: async (resourceRefs: string[]) => {
            return metricProvidersRegistry.listMetrics(resourceRefs);
          },
          permissions: scorecardPermissions,
          rules: Object.values(scorecardRules),
        });

        // Run database migrations
        await migrate(database);

        const client = await database.getClient();
        const dbMetricValues = new DatabaseMetricValues(client);

        const catalogMetricService = new CatalogMetricService({
          catalog,
          auth,
          registry: metricProvidersRegistry,
          database: dbMetricValues,
        });

        Scheduler.create({
          auth,
          catalog,
          config,
          logger,
          scheduler,
          database: dbMetricValues,
          metricProvidersRegistry,
          thresholdEvaluator: new ThresholdEvaluator(),
        }).start();

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
