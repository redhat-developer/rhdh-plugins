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

import capitalize from 'lodash/capitalize';

import {
  AuthToken,
  extractWorkflowFormat,
  Filter,
  fromWorkflowSource,
  ProcessInstanceStateValues,
  ProcessInstanceVariables,
  WorkflowDefinition,
  WorkflowExecutionResponse,
  WorkflowInfo,
  WorkflowOverview,
} from '@redhat/backstage-plugin-orchestrator-common';

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
    let response: Response | undefined;
    try {
      response = await fetch(urlToFetch);
    } catch (error) {
      this.logger.error(
        `Failed to fetch from ${urlToFetch}: ${(error as Error).message}`,
      );
    }

    const jsonResponse = await this.handleWorkflowServiceResponse(
      'Get workflow info',
      args.definitionId,
      urlToFetch,
      response,
      'GET',
    );
    this.logger.debug(
      `Fetch workflow info result: ${JSON.stringify(jsonResponse)}`,
    );
    return jsonResponse;
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
    targetEntity?: string;
  }): Promise<WorkflowOverview[] | undefined> {
    const { definitionIds, pagination, filter, targetEntity } = args;
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
        .map(info =>
          this.fetchWorkflowOverviewBySource(info.source!, targetEntity),
        ),
    );
    return items.filter((item): item is WorkflowOverview => !!item);
  }

  public async executeWorkflow(args: {
    definitionId: string;
    serviceUrl: string;
    inputData?: ProcessInstanceVariables;
    authTokens?: Array<AuthToken>;
    backstageToken?: string | undefined;
  }): Promise<WorkflowExecutionResponse | undefined> {
    const urlToFetch = `${args.serviceUrl}/${args.definitionId}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    this.addAuthHeaders(headers, args.authTokens, args.backstageToken);
    const headerKeys = Object.keys(headers);
    this.logger.info(
      `Executing workflow ${args.definitionId} with headers: ${headerKeys.join(', ')}`,
    );

    let response: Response | undefined;
    try {
      response = await fetch(urlToFetch, {
        method: 'POST',
        body: JSON.stringify(args.inputData || {}),
        headers,
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch from ${urlToFetch}: ${(error as Error).message}`,
      );
    }

    const json = await this.handleWorkflowServiceResponse(
      'Execute',
      args.definitionId,
      urlToFetch,
      response,
      'POST',
    );
    if (json.id) {
      this.logger.debug(
        `Execute workflow successful. Response: ${JSON.stringify(json)}`,
      );
      return json;
    }
    this.logger.error(
      `Execute workflow did not return a workflow instance ID. Response: ${JSON.stringify(
        json,
      )}`,
    );
    throw new Error('Execute workflow did not return a workflow instance ID');
  }

  private addAuthHeaders(
    headers: Record<string, string>,
    authTokens?: Array<AuthToken>,
    backstageToken?: string | undefined,
  ) {
    // Add X-Authentication headers from authTokens
    if (authTokens && Array.isArray(authTokens)) {
      authTokens.forEach(tokenObj => {
        if (tokenObj.provider && tokenObj.token) {
          const headerKey = `X-Authorization-${capitalize(tokenObj.provider)}`;
          headers[headerKey] = String(tokenObj.token); // Ensure token is a string
        }
      });
    } else {
      this.logger.debug(
        'No authTokens provided or authTokens is not an array.',
      );
    }

    if (backstageToken) {
      const headerKey = 'X-Authorization-Backstage';
      headers[headerKey] = backstageToken;
    }
  }

  public async retriggerInstance(args: {
    definitionId: string;
    instanceId: string;
    serviceUrl: string;
    authTokens?: Array<AuthToken>;
    backstageToken?: string | undefined;
  }): Promise<boolean> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    this.addAuthHeaders(headers, args.authTokens, args.backstageToken);
    const headerKeys = Object.keys(headers);
    this.logger.info(
      `Retriggering workflow ${args.definitionId} with headers: ${headerKeys.join(', ')}`,
    );

    const urlToFetch = `${args.serviceUrl}/management/processes/${args.definitionId}/instances/${args.instanceId}/retrigger`;

    let response: Response | undefined;
    try {
      response = await fetch(urlToFetch, {
        method: 'POST',
        headers,
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch from ${urlToFetch}: ${(error as Error).message}`,
      );
    }

    await this.handleWorkflowServiceResponse(
      'Retrigger',
      args.definitionId,
      urlToFetch,
      response,
      'POST',
    );

    return true;
  }

  public async abortInstance(args: {
    definitionId: string;
    instanceId: string;
    serviceUrl: string;
  }): Promise<void> {
    const urlToFetch = `${args.serviceUrl}/management/processes/${args.definitionId}/instances/${args.instanceId}`;

    let response: Response | undefined;
    try {
      response = await fetch(urlToFetch, {
        method: 'DELETE',
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch from ${urlToFetch}: ${(error as Error).message}`,
      );
    }

    await this.handleWorkflowServiceResponse(
      'Abort',
      args.definitionId,
      urlToFetch,
      response,
      'DELETE',
    );
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
    targetEntity?: string,
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
        targetEntity: targetEntity,
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
      description: definition.description,
    };
  }

  public async pingWorkflowService(args: {
    definitionId: string;
    serviceUrl: string;
  }): Promise<boolean> {
    const urlToFetch = `${args.serviceUrl}/management/processes/${args.definitionId}`;
    let response: Response | undefined;
    try {
      response = await fetch(urlToFetch);
    } catch (error) {
      this.logger.error(
        `Failed to fetch from ${urlToFetch}: ${(error as Error).message}`,
      );
      return false;
    }
    return response.ok;
  }

  private async handleWorkflowServiceResponse(
    operation: 'Abort' | 'Execute' | 'Retrigger' | 'Get workflow info',
    workflowId: string,
    urlToFetch: string,
    response: Response | undefined,
    httpMethod: Request['method'],
  ): Promise<any> {
    const logErrorPrefix = `Error during operation '${operation}' on workflow ${workflowId} with service URL ${urlToFetch}`;
    if (!response) {
      throw new Error(`${logErrorPrefix} : fetch failed`);
    }
    const errorLines: string[] = [];
    errorLines.push(`HTTP ${httpMethod} request to ${urlToFetch} failed.`);
    errorLines.push(`Status Code: ${response.status}`);
    if (response.statusText) {
      errorLines.push(`Status Text: ${response.statusText}`);
    }
    try {
      const jsonResponse = await response.json();
      if ((jsonResponse.id && operation === 'Execute') || response.ok) {
        // Treat as successful from the UI perspective.
        // This allows navigation to the instance page even if the workflow execution
        // fails immediately after initiation. The presence of an instance id or a successful
        // 'ok' status indicates the initiation was successful.
        return jsonResponse;
      }
      if (jsonResponse?.message) {
        errorLines.push(`Message: ${jsonResponse.message}`);
      }
      if (jsonResponse?.details) {
        errorLines.push(`Details: ${jsonResponse.details}`);
      }
      if (jsonResponse?.stack) {
        errorLines.push(`Stack Trace: ${jsonResponse.stack}`);
      }
      if (jsonResponse?.failedNodeId) {
        errorLines.push(`Failed Node ID: ${jsonResponse.failedNodeId}`);
      }
      this.logger.error(`${logErrorPrefix}: ${JSON.stringify(jsonResponse)}`);
    } catch (jsonParseError) {
      this.logger.error(
        `${logErrorPrefix}. The details of this error cannot be provided because the response body was not in a parsable format.`,
      );
    }
    throw new Error(errorLines.join('\n'));
  }
}
