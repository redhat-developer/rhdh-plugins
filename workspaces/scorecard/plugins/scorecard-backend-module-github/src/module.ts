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
import { scorecardMetricsExtensionPoint } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { GithubOpenPRsProvider } from './metricProviders/GithubOpenPRsProvider';
import { GithubOpenIssuesProvider } from './metricProviders/GithubOpenIssuesProvider';
import { GithubOpenedIssuesProvider } from './metricProviders/GithubOpenedIssuesProvider';
import { GithubOpenedPRsProvider } from './metricProviders/GithubOpenedPRsProvider';
import { GithubClosedIssuesProvider } from './metricProviders/GithubClosedIssuesProvider';
import { GithubClosedPRsProvider } from './metricProviders/GithubClosedPRsProvider';
import { GithubPRLifecycleProvider } from './metricProviders/GithubPRLifecycleProvider';
import { GithubActionsCountProvider } from './metricProviders/GithubActionsCountProvider';
import { GithubActionsRatioProvider } from './metricProviders/GithubActionsRatioProvider';
import { GithubPRPassRateProvider } from './metricProviders/GithubPRPassRateProvider';

export const scorecardModuleGithub = createBackendModule({
  pluginId: 'scorecard',
  moduleId: 'github',
  register(reg) {
    reg.registerInit({
      deps: {
        config: coreServices.rootConfig,
        metrics: scorecardMetricsExtensionPoint,
      },
      async init({ config, metrics }) {
        metrics.addMetricProvider(GithubOpenPRsProvider.fromConfig(config));
        metrics.addMetricProvider(GithubOpenIssuesProvider.fromConfig(config));
        metrics.addMetricProvider(
          GithubOpenedIssuesProvider.fromConfig(config),
        );
        metrics.addMetricProvider(GithubOpenedPRsProvider.fromConfig(config));
        metrics.addMetricProvider(
          GithubClosedIssuesProvider.fromConfig(config),
        );
        metrics.addMetricProvider(GithubClosedPRsProvider.fromConfig(config));
        metrics.addMetricProvider(GithubPRLifecycleProvider.fromConfig(config));
        metrics.addMetricProvider(
          GithubActionsCountProvider.fromConfig(config),
        );
        metrics.addMetricProvider(
          GithubActionsRatioProvider.fromConfig(config),
        );
        metrics.addMetricProvider(GithubPRPassRateProvider.fromConfig(config));
      },
    });
  },
});
