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
  ProcessInstanceVariables,
  WorkflowDefinition,
  WorkflowExecutionResponse,
  WorkflowInfo,
  WorkflowOverview,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { Pagination } from '../types/pagination';
import { DataIndexService } from './DataIndexService';
import { SonataFlowService } from './SonataFlowService';
import { CacheHandler, WorkflowCacheService } from './WorkflowCacheService';

export class OrchestratorService {
  constructor(
    private readonly sonataFlowService: SonataFlowService,
    private readonly dataIndexService: DataIndexService,
    private readonly workflowCacheService: WorkflowCacheService,
  ) {}

  // Data Index Service Wrapper
  public getWorkflowIds(): string[] {
    return this.workflowCacheService.definitionIds;
  }

  public async abortWorkflowInstance(args: {
    definitionId: string;
    instanceId: string;
    serviceUrl: string;
    cacheHandler?: CacheHandler;
  }): Promise<void> {
    const { definitionId, cacheHandler } = args;
    const isWorkflowAvailable = this.workflowCacheService.isAvailable(
      definitionId,
      cacheHandler,
    );
    return isWorkflowAvailable
      ? await this.sonataFlowService.abortInstance(args)
      : undefined;
  }

  public async fetchWorkflowInfo(args: {
    definitionId: string;
    cacheHandler?: CacheHandler;
  }): Promise<WorkflowInfo | undefined> {
    const { definitionId, cacheHandler } = args;
    const isWorkflowAvailable = this.workflowCacheService.isAvailable(
      definitionId,
      cacheHandler,
    );
    return isWorkflowAvailable
      ? await this.dataIndexService.fetchWorkflowInfo(definitionId)
      : undefined;
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

  public async fetchWorkflowSource(args: {
    definitionId: string;
    cacheHandler?: CacheHandler;
  }): Promise<string | undefined> {
    const { definitionId, cacheHandler } = args;
    const isWorkflowAvailable = this.workflowCacheService.isAvailable(
      definitionId,
      cacheHandler,
    );
    return isWorkflowAvailable
      ? await this.dataIndexService.fetchWorkflowSource(definitionId)
      : undefined;
  }

  public async fetchInstanceVariables(args: {
    instanceId: string;
    cacheHandler?: CacheHandler;
  }): Promise<object | undefined> {
    const { instanceId, cacheHandler } = args;
    const definitionId =
      await this.dataIndexService.fetchDefinitionIdByInstanceId(instanceId);
    const isWorkflowAvailable = this.workflowCacheService.isAvailable(
      definitionId,
      cacheHandler,
    );
    return isWorkflowAvailable
      ? await this.dataIndexService.fetchInstanceVariables(instanceId)
      : undefined;
  }

  public async fetchInstance(args: {
    instanceId: string;
    cacheHandler?: CacheHandler;
  }): Promise<ProcessInstance | undefined> {
    const { instanceId } = args;
    const instance = await this.dataIndexService.fetchInstance(instanceId);
    return instance;
  }

  // SonataFlow Service Wrapper

  public async fetchWorkflowInfoOnService(args: {
    definitionId: string;
    serviceUrl: string;
    cacheHandler?: CacheHandler;
  }): Promise<WorkflowInfo | undefined> {
    const { definitionId, cacheHandler } = args;
    const isWorkflowAvailable = this.workflowCacheService.isAvailable(
      definitionId,
      cacheHandler,
    );
    return isWorkflowAvailable
      ? await this.sonataFlowService.fetchWorkflowInfoOnService(args)
      : undefined;
  }

  public async fetchWorkflowDefinition(args: {
    definitionId: string;
    cacheHandler?: CacheHandler;
  }): Promise<WorkflowDefinition | undefined> {
    const { definitionId, cacheHandler } = args;
    const isWorkflowAvailable = this.workflowCacheService.isAvailable(
      definitionId,
      cacheHandler,
    );
    return isWorkflowAvailable
      ? await this.sonataFlowService.fetchWorkflowDefinition(definitionId)
      : undefined;
  }

  public async fetchWorkflowOverviews(args: {
    pagination?: Pagination;
    filter?: Filter;
  }): Promise<WorkflowOverview[] | undefined> {
    const overviews = await this.sonataFlowService.fetchWorkflowOverviews({
      definitionIds: this.workflowCacheService.definitionIds?.concat(
        this.workflowCacheService.unavailableDefinitionIds,
      ),
      pagination: args.pagination,
      filter: args.filter,
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
    businessKey?: string;
    cacheHandler?: CacheHandler;
  }): Promise<WorkflowExecutionResponse | undefined> {
    const { definitionId, cacheHandler } = args;
    const isWorkflowAvailable = this.workflowCacheService.isAvailable(
      definitionId,
      cacheHandler,
    );
    return isWorkflowAvailable
      ? await this.sonataFlowService.executeWorkflow(args)
      : undefined;
  }

  public async retriggerWorkflow(args: {
    definitionId: string;
    instanceId: string;
    serviceUrl: string;
    cacheHandler?: CacheHandler;
  }): Promise<boolean | undefined> {
    const { definitionId, cacheHandler } = args;
    const isWorkflowAvailable = this.workflowCacheService.isAvailable(
      definitionId,
      cacheHandler,
    );
    return isWorkflowAvailable
      ? await this.sonataFlowService.retriggerInstance(args)
      : undefined;
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
}
