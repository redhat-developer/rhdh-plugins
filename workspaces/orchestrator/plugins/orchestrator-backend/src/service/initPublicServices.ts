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

import type {
  LoggerService,
  SchedulerService,
} from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';

import { WorkflowLogsProvidersRegistry } from '../providers/WorkflowLogsProvidersRegistry';
import { OrchestratorKafkaServiceOptions } from '../types/kafka';
import { DataIndexService } from './DataIndexService';
import { DataInputSchemaService } from './DataInputSchemaService';
import { OrchestratorService } from './OrchestratorService';
import { SonataFlowService } from './SonataFlowService';
import { WorkflowCacheService } from './WorkflowCacheService';

export interface PublicServices {
  dataInputSchemaService: DataInputSchemaService;
  orchestratorService: OrchestratorService;
}

export function initPublicServices(
  logger: LoggerService,
  config: Config,
  scheduler: SchedulerService,
  workflowLogsProvidersRegistry: WorkflowLogsProvidersRegistry,
): PublicServices {
  const dataIndexUrl = config.getString('orchestrator.dataIndexService.url');
  const orchestratorKafka: OrchestratorKafkaServiceOptions | undefined =
    config.getOptional('orchestrator.kafka');
  const dataIndexService = new DataIndexService(dataIndexUrl, logger);
  const sonataFlowService = new SonataFlowService(
    dataIndexService,
    logger,
    orchestratorKafka,
  );

  const workflowCacheService = new WorkflowCacheService(
    logger,
    dataIndexService,
    sonataFlowService,
  );
  workflowCacheService.schedule({ scheduler: scheduler });

  const isWorkflowLogProviderAdded = config.getOptional(
    'orchestrator.workflowLogProvider',
  );
  let workflowLogProvider;
  if (isWorkflowLogProviderAdded) {
    workflowLogProvider = workflowLogsProvidersRegistry.getProvider('loki');
  }

  const orchestratorService = new OrchestratorService(
    sonataFlowService,
    dataIndexService,
    workflowCacheService,
    workflowLogProvider,
  );

  const dataInputSchemaService = new DataInputSchemaService();

  return {
    orchestratorService,
    dataInputSchemaService,
  };
}
