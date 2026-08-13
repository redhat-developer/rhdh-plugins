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
  scorecardCollectorsExtensionPoint,
  scorecardMetricsExtensionPoint,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { JiraIncidentsCollector } from './collectors/JiraIncidentsCollector';
import { JiraOpenIssuesProvider } from './metricProviders/JiraOpenIssuesProvider';
import { JiraClientFactory } from './clients/JiraClientFactory';

export const scorecardModuleJira = createBackendModule({
  pluginId: 'scorecard',
  moduleId: 'jira',
  register(reg) {
    reg.registerInit({
      deps: {
        auth: coreServices.auth,
        collectors: scorecardCollectorsExtensionPoint,
        config: coreServices.rootConfig,
        discovery: coreServices.discovery,
        logger: coreServices.logger,
        metrics: scorecardMetricsExtensionPoint,
      },
      async init({ auth, collectors, config, discovery, logger, metrics }) {
        const jiraClient = JiraClientFactory.fromConfig(config, {
          auth,
          discovery,
          logger,
        });
        collectors.addCollector(new JiraIncidentsCollector(jiraClient));
        metrics.addMetricProvider(
          JiraOpenIssuesProvider.fromConfig(config, { jiraClient }),
        );
      },
    });
  },
});
