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

import { LoggerService } from '@backstage/backend-plugin-api';

import {
  AuthToken,
  extractWorkflowFormat,
  Filter,
  fromWorkflowSource,
  getWorkflowCategory,
  ProcessInstanceStateValues,
  ProcessInstanceVariables,
  WorkflowDefinition,
  WorkflowExecutionResponse,
  WorkflowInfo,
  WorkflowOverview,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { Pagination } from '../types/pagination';
import { DataIndexService } from './DataIndexService';

export class SonataFlowService {
  constructor(
    private readonly dataIndexService: DataIndexService,
    private readonly logger: LoggerService,
  ) {}

  public async fetchWorkflowInfoOnService(args: {
    definitionId: string;
    serviceUrl: string;
  }): Promise<WorkflowInfo | undefined> {
    const urlToFetch = `${args.serviceUrl}/management/processes/${args.definitionId}`;
    const response = await fetch(urlToFetch);
    const jsonResponse = await response.json();
    if (response.ok) {
      this.logger.debug(
        `Fetch workflow info result: ${JSON.stringify(jsonResponse)}`,
      );
      return jsonResponse;
    }
    this.logger.error(
      `Fetch workflow info failed with: ${JSON.stringify(jsonResponse)}`,
    );
    throw new Error(
      await this.createPrefixFetchErrorMessage(
        urlToFetch,
        response,
        jsonResponse,
      ),
    );
  }

  public async fetchWorkflowDefinition(
    definitionId: string,
  ): Promise<WorkflowDefinition | undefined> {
    const source =
      await this.dataIndexService.fetchWorkflowSource(definitionId);
    if (source) {
      return fromWorkflowSource(source);
    }
    return undefined;
  }

  public async fetchWorkflowOverviews(args: {
    definitionIds?: string[];
    pagination?: Pagination;
    filter?: Filter;
  }): Promise<WorkflowOverview[] | undefined> {
    const { definitionIds, pagination, filter } = args;
    const workflowInfos = await this.dataIndexService.fetchWorkflowInfos({
      definitionIds,
      pagination,
      filter,
    });
    if (!workflowInfos?.length) {
      return [];
    }
    const items = await Promise.all(
      workflowInfos
        .filter(info => info.source)
        .map(info => this.fetchWorkflowOverviewBySource(info.source!)),
    );
    return items.filter((item): item is WorkflowOverview => !!item);
  }

  public async executeWorkflow(args: {
    definitionId: string;
    serviceUrl: string;
    inputData?: ProcessInstanceVariables;
    authTokens?: Array<AuthToken>;
    businessKey?: string;
  }): Promise<WorkflowExecutionResponse | undefined> {
    const urlToFetch = args.businessKey
      ? `${args.serviceUrl}/${args.definitionId}?businessKey=${args.businessKey}`
      : `${args.serviceUrl}/${args.definitionId}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add X-Authentication headers from authTokens
    if (args.authTokens && Array.isArray(args.authTokens)) {
      args.authTokens.forEach(tokenObj => {
        if (tokenObj.provider && tokenObj.token) {
          const headerKey = `X-Authentication-${tokenObj.provider}`;
          headers[headerKey] = String(tokenObj.token); // Ensure token is a string
        }
      });
    } else {
      this.logger.debug(
        'No authTokens provided or authTokens is not an array.',
      );
    }

    const response = await fetch(urlToFetch, {
      method: 'POST',
      body: JSON.stringify(args.inputData || {}),
      headers,
    });

    const json = await response.json();
    if (json.id) {
      this.logger.debug(
        `Execute workflow successful. Response: ${JSON.stringify(json)}`,
      );
      return json;
    } else if (!response.ok) {
      const errorMessage = await this.createPrefixFetchErrorMessage(
        urlToFetch,
        response,
        json,
        'POST',
      );
      this.logger.error(
        `Execute workflow failed. Response: ${JSON.stringify(json)}`,
      );
      throw new Error(errorMessage);
    } else {
      this.logger.error(
        `Execute workflow did not return a workflow instance ID. Response: ${JSON.stringify(
          json,
        )}`,
      );
      throw new Error('Execute workflow did not return a workflow instance ID');
    }
  }

  public async retriggerInstance(args: {
    definitionId: string;
    instanceId: string;
    serviceUrl: string;
  }): Promise<boolean> {
    const urlToFetch = `${args.serviceUrl}/management/processes/${args.definitionId}/instances/${args.instanceId}/retrigger`;

    const response = await fetch(urlToFetch, {
      method: 'POST',
    });

    if (!response.ok) {
      const json = await response.json();
      this.logger.error(`Retrigger failed with: ${JSON.stringify(json)}`);
      throw new Error(
        `${await this.createPrefixFetchErrorMessage(
          urlToFetch,
          response,
          json,
          'POST',
        )}`,
      );
    }

    return true;
  }

  public async abortInstance(args: {
    definitionId: string;
    instanceId: string;
    serviceUrl: string;
  }): Promise<void> {
    const urlToFetch = `${args.serviceUrl}/management/processes/${args.definitionId}/instances/${args.instanceId}`;

    const response = await fetch(urlToFetch, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const json = await response.json();
      this.logger.error(`Abort failed with: ${JSON.stringify(json)}`);
      throw new Error(
        `${await this.createPrefixFetchErrorMessage(
          urlToFetch,
          response,
          json,
          'DELETE',
        )}`,
      );
    }
  }

  public async fetchWorkflowOverview(
    definitionId: string,
  ): Promise<WorkflowOverview | undefined> {
    const source =
      await this.dataIndexService.fetchWorkflowSource(definitionId);
    if (!source) {
      this.logger.debug(`Workflow source not found: ${definitionId}`);
      return undefined;
    }
    return await this.fetchWorkflowOverviewBySource(source);
  }

  private async fetchWorkflowOverviewBySource(
    source: string,
  ): Promise<WorkflowOverview | undefined> {
    let lastTriggered: Date = new Date(0);
    let lastRunStatus: ProcessInstanceStateValues | undefined;
    let lastRunId: string | undefined;
    const definition = fromWorkflowSource(source);

    const processInstances =
      await this.dataIndexService.fetchInstancesByDefinitionId({
        definitionId: definition.id,
        limit: 1,
        offset: 0,
      });

    const pInstance = processInstances[0];

    if (pInstance?.start) {
      lastRunId = pInstance.id;
      lastTriggered = new Date(pInstance.start);
      lastRunStatus = pInstance.state;
    }

    return {
      workflowId: definition.id,
      name: definition.name,
      format: extractWorkflowFormat(source),
      lastRunId,
      lastTriggeredMs: lastTriggered.getTime(),
      lastRunStatus,
      category: getWorkflowCategory(definition),
      description: definition.description,
    };
  }

  public async pingWorkflowService(args: {
    definitionId: string;
    serviceUrl: string;
  }): Promise<boolean> {
    const urlToFetch = `${args.serviceUrl}/management/processes/${args.definitionId}`;
    const response = await fetch(urlToFetch);
    return response.ok;
  }

  public async createPrefixFetchErrorMessage(
    urlToFetch: string,
    response: Response,
    jsonResponse: any,
    httpMethod = 'GET',
  ): Promise<string> {
    const errorInfo = [];
    let errorMsg = `Request ${httpMethod} ${urlToFetch} failed with: StatusCode: ${response.status}`;

    if (response.statusText) {
      errorInfo.push(`StatusText: ${response.statusText}`);
    }
    if (jsonResponse?.details) {
      errorInfo.push(`Details: ${jsonResponse?.details}`);
    }
    if (jsonResponse?.stack) {
      errorInfo.push(`Stack: ${jsonResponse?.stack}`);
    }
    if (jsonResponse?.message) {
      errorInfo.push(`Message: ${jsonResponse?.message}`);
    }
    if (jsonResponse?.failedNodeId) {
      errorInfo.push(`Failed Node Id: ${jsonResponse?.failedNodeId}`);
    }
    if (errorInfo.length > 0) {
      errorMsg += ` ${errorInfo.join(', ')}`;
    } else {
      errorMsg += ' Unexpected error';
    }

    return errorMsg;
  }
}
