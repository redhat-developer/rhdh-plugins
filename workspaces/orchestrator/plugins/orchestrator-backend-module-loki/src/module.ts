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
import { workflowLogsExtensionEndpoint } from '@red-hat-developer-hub/backstage-plugin-orchestrator-node';
import { LokiProvider } from './workflowLogsProviders/LokiProvider';

export const orchestratorModuleLoki = createBackendModule({
  pluginId: 'orchestrator',
  moduleId: 'loki',
  register(reg) {
    reg.registerInit({
      deps: {
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        workflowLogs: workflowLogsExtensionEndpoint,
      },
      async init({ config, logger, workflowLogs }) {
        logger.info('Initialize the Loki orchestrator backend module');
        workflowLogs.addWorkflowLogProvider(LokiProvider.fromConfig(config));
      },
    });
  },
});
