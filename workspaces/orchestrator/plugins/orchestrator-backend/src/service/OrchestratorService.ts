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
  AuthToken,
  Filter,
  ProcessInstance,
  ProcessInstanceDTO,
  ProcessInstanceVariables,
  WorkflowDefinition,
  WorkflowExecutionResponse,
  WorkflowInfo,
  WorkflowLogsResponse,
  WorkflowOverview,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';
import { WorkflowLogProvider } from '@red-hat-developer-hub/backstage-plugin-orchestrator-node';

import { Pagination } from '../types/pagination';
import { DataIndexService } from './DataIndexService';
import { SonataFlowService } from './SonataFlowService';
import { WorkflowCacheService } from './WorkflowCacheService';

export class OrchestratorService {
  constructor(
    private readonly sonataFlowService: SonataFlowService,
    private readonly dataIndexService: DataIndexService,
    private readonly workflowCacheService: WorkflowCacheService,
    private readonly workflowLogProvider?: WorkflowLogProvider,
  ) {}

  // Data Index Service Wrapper
  public getWorkflowIds(): string[] {
    return this.workflowCacheService.definitionIds;
  }

  public async abortWorkflowInstance(args: {
    definitionId: string;
    instanceId: string;
    serviceUrl: string;
  }): Promise<void> {
    return await this.sonataFlowService.abortInstance(args);
  }

  public async fetchWorkflowInfo(args: {
    definitionId: string;
  }): Promise<WorkflowInfo | undefined> {
    const { definitionId } = args;
    return await this.dataIndexService.fetchWorkflowInfo(definitionId);
  }

  public async fetchInstances(args: {
    pagination?: Pagination;
    filter?: Filter;
    workflowIds?: string[];
  }): Promise<ProcessInstance[]> {
    const definitionIds = args.workflowIds
      ? args.workflowIds
      : this.workflowCacheService.definitionIds;
    return await this.dataIndexService.fetchInstances({
      definitionIds: definitionIds,
      pagination: args.pagination,
      filter: args.filter,
    });
  }

  public async fetchDefinitionIdsFromInstances(args: {
    targetEntity: string;
  }): Promise<string[]> {
    return await this.dataIndexService.fetchDefinitionIdsFromInstances(args);
  }

  public async fetchWorkflowSource(args: {
    definitionId: string;
  }): Promise<string | undefined> {
    const { definitionId } = args;
    return await this.dataIndexService.fetchWorkflowSource(definitionId);
  }

  public async fetchInstanceVariables(args: {
    instanceId: string;
  }): Promise<object | undefined> {
    const { instanceId } = args;
    return await this.dataIndexService.fetchInstanceVariables(instanceId);
  }

  public async fetchInstance(args: {
    instanceId: string;
  }): Promise<ProcessInstance | undefined> {
    const { instanceId } = args;
    const instance = await this.dataIndexService.fetchInstance(instanceId);
    return instance;
  }

  // SonataFlow Service Wrapper

  public async fetchWorkflowInfoOnService(args: {
    definitionId: string;
    serviceUrl: string;
  }): Promise<WorkflowInfo | undefined> {
    return await this.sonataFlowService.fetchWorkflowInfoOnService(args);
  }

  public async fetchWorkflowDefinition(args: {
    definitionId: string;
  }): Promise<WorkflowDefinition | undefined> {
    const { definitionId } = args;
    return await this.sonataFlowService.fetchWorkflowDefinition(definitionId);
  }

  public async fetchWorkflowOverviews(args: {
    pagination?: Pagination;
    filter?: Filter;
    targetEntity?: string;
  }): Promise<WorkflowOverview[] | undefined> {
    const overviews = await this.sonataFlowService.fetchWorkflowOverviews({
      definitionIds: this.workflowCacheService.definitionIds?.concat(
        this.workflowCacheService.unavailableDefinitionIds,
      ),
      pagination: args.pagination,
      filter: args.filter,
      targetEntity: args.targetEntity,
    });

    return overviews?.map(overview => {
      const updatedOverview = overview;
      updatedOverview.isAvailable = this.workflowCacheService.isAvailable(
        updatedOverview.workflowId,
      );
      return updatedOverview;
    });
  }

  public async executeWorkflow(args: {
    definitionId: string;
    serviceUrl: string;
    inputData?: ProcessInstanceVariables;
    authTokens?: Array<AuthToken>;
    backstageToken?: string | undefined;
  }): Promise<WorkflowExecutionResponse | undefined> {
    return await this.sonataFlowService.executeWorkflow(args);
  }

  public async retriggerWorkflow(args: {
    definitionId: string;
    instanceId: string;
    serviceUrl: string;
    authTokens?: Array<AuthToken>;
    backstageToken?: string | undefined;
  }): Promise<boolean | undefined> {
    return this.sonataFlowService.retriggerInstance(args);
  }

  public async fetchWorkflowOverview(args: {
    definitionId: string;
  }): Promise<WorkflowOverview | undefined> {
    const { definitionId } = args;
    const isWorkflowAvailable =
      this.workflowCacheService.isAvailable(definitionId);
    const overview =
      await this.sonataFlowService.fetchWorkflowOverview(definitionId);
    if (overview) overview.isAvailable = isWorkflowAvailable; // workflow overview is avaiable but the workflow itself is not
    return overview;
  }

  public async fetchWorkflowLogsByInstance(args: {
    instance: ProcessInstanceDTO;
  }): Promise<WorkflowLogsResponse> {
    return this.workflowLogProvider?.fetchWorkflowLogsByInstance(
      args.instance,
    ) as WorkflowLogsResponse;
  }

  public hasLogProvider(): boolean {
    if (this.workflowLogProvider) {
      return true;
    }
    return false;
  }

  public async pingWorkflowService(args: {
    definitionId: string;
    serviceUrl: string;
  }): Promise<boolean | undefined> {
    const { definitionId, serviceUrl } = args;
    const isServiceUp = await this.sonataFlowService.pingWorkflowService({
      definitionId,
      serviceUrl,
    });
    return isServiceUp;
  }
}
