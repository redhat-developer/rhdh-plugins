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
  createBackendModule,
} from '@backstage/backend-plugin-api';
import {
  scorecardCollectorsServiceRef,
  scorecardMetricsExtensionPoint,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { migrate } from './database/migration';
import { DatabaseDoraDeployments } from './database/DatabaseDoraDeployments';
import { DatabaseDoraIncidents } from './database/DatabaseDoraIncidents';
import { DatabaseDoraLastSync } from './database/DatabaseDoraLastSync';
import { DatabaseDoraPullRequests } from './database/DatabaseDoraPullRequests';
import { DoraChangeFailureRateProvider } from './metricProviders/DoraChangeFailureRateProvider';
import { DoraDeploymentFrequencyProvider } from './metricProviders/DoraDeploymentFrequencyProvider';
import { DoraMedianLeadTimeForChangesProvider } from './metricProviders/DoraMedianLeadTimeForChangesProvider';
import { DoraMeanTimeToRestoreProvider } from './metricProviders/DoraMeanTimeToRestoreProvider';
import { DefaultDoraDataService } from './service/DoraDataService';
import { DefaultDoraSyncService } from './service/DoraSyncService';
import { CleanupExpiredDataTask } from './scheduler/CleanupExpiredDataTask';
import {
  parseDoraDataRetentionDays,
  parseDoraSyncConfig,
} from './metricProviders/DoraConfig';

export const scorecardModuleDora = createBackendModule({
  pluginId: 'scorecard',
  moduleId: 'dora',
  register(reg) {
    reg.registerInit({
      deps: {
        collectorsService: scorecardCollectorsServiceRef,
        config: coreServices.rootConfig,
        database: coreServices.database,
        logger: coreServices.logger,
        metrics: scorecardMetricsExtensionPoint,
        scheduler: coreServices.scheduler,
      },
      async init({
        collectorsService,
        config,
        database,
        logger,
        metrics,
        scheduler,
      }) {
        await migrate(database);

        const dbClient = await database.getClient();
        const deploymentsDb = new DatabaseDoraDeployments(dbClient);
        const incidentsDb = new DatabaseDoraIncidents(dbClient);
        const pullRequestsDb = new DatabaseDoraPullRequests(dbClient);
        const lastSyncDb = new DatabaseDoraLastSync(dbClient);

        const doraSyncService = new DefaultDoraSyncService(
          collectorsService,
          deploymentsDb,
          incidentsDb,
          pullRequestsDb,
          lastSyncDb,
          logger,
          parseDoraSyncConfig(config),
        );
        const doraDataService = new DefaultDoraDataService(
          deploymentsDb,
          incidentsDb,
          pullRequestsDb,
        );

        metrics.addMetricProvider(
          DoraDeploymentFrequencyProvider.fromConfig(config, {
            doraSyncService,
            doraDataService,
          }),
          DoraMedianLeadTimeForChangesProvider.fromConfig(config, {
            doraSyncService,
            doraDataService,
            logger,
          }),
          DoraMeanTimeToRestoreProvider.fromConfig(config, {
            doraSyncService,
            doraDataService,
            logger,
          }),
          DoraChangeFailureRateProvider.fromConfig(config, {
            doraSyncService,
            doraDataService,
            logger,
          }),
        );

        await new CleanupExpiredDataTask({
          scheduler,
          logger,
          dataRetentionDays: parseDoraDataRetentionDays(config),
          deployments: deploymentsDb,
          incidents: incidentsDb,
          pullRequests: pullRequestsDb,
          lastSync: lastSyncDb,
        }).start();
      },
    });
  },
});
