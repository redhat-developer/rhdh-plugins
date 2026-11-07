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
import { GitlabIssuesProvider } from './metricProviders/GitlabIssuesProvider';
import { GitlabMergeRequestsProvider } from './metricProviders/GitlabMergeRequestsProvider';
import { GitlabPipelinesProvider } from './metricProviders/GitlabPipelinesProvider';
import { GitlabJobsProvider } from './metricProviders/GitlabJobsProvider';

export const scorecardModuleGitlab = createBackendModule({
  pluginId: 'scorecard',
  moduleId: 'gitlab',
  register(reg) {
    reg.registerInit({
      deps: {
        config: coreServices.rootConfig,
        metrics: scorecardMetricsExtensionPoint,
      },
      async init({ config, metrics }) {
        metrics.addMetricProvider(
          GitlabIssuesProvider.fromConfig(config),
          GitlabMergeRequestsProvider.fromConfig(config),
          GitlabPipelinesProvider.fromConfig(config),
          GitlabJobsProvider.fromConfig(config),
        );
      },
    });
  },
});
