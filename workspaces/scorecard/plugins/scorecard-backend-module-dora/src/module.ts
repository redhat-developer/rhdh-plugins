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
import { DoraChangeFailureRateProvider } from './metricProviders/DoraChangeFailureRateProvider';
import { DoraDeploymentFrequencyProvider } from './metricProviders/DoraDeploymentFrequencyProvider';
import { DoraMedianLeadTimeForChangesProvider } from './metricProviders/DoraMedianLeadTimeForChangesProvider';
import { DoraMeanTimeToRestoreProvider } from './metricProviders/DoraMeanTimeToRestoreProvider';

export const scorecardModuleDora = createBackendModule({
  pluginId: 'scorecard',
  moduleId: 'dora',
  register(reg) {
    reg.registerInit({
      deps: {
        collectorsService: scorecardCollectorsServiceRef,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        metrics: scorecardMetricsExtensionPoint,
      },
      async init({ collectorsService, config, logger, metrics }) {
        metrics.addMetricProvider(
          DoraDeploymentFrequencyProvider.fromConfig(config, {
            collectorsService,
          }),
          DoraMedianLeadTimeForChangesProvider.fromConfig(config, {
            collectorsService,
            logger,
          }),
          DoraMeanTimeToRestoreProvider.fromConfig(config, {
            collectorsService,
            logger,
          }),
          DoraChangeFailureRateProvider.fromConfig(config, {
            collectorsService,
            logger,
          }),
        );
      },
    });
  },
});
