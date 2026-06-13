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

import { CloudEvent, Kafka as KafkaCE } from 'cloudevents';
import { Kafka } from 'kafkajs';
import capitalize from 'lodash/capitalize';

import {
  AuthToken,
  extractWorkflowFormat,
  Filter,
  fromWorkflowSource,
  ProcessInstance,
  ProcessInstanceState,
  ProcessInstanceStateValues,
  ProcessInstanceVariables,
  WorkflowDefinition,
  WorkflowExecutionResponse,
  WorkflowInfo,
  WorkflowOverview,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { randomUUID } from 'node:crypto';

import { OrchestratorKafkaServiceOptions } from '../types/kafka';
import { Pagination } from '../types/pagination';
import { DataIndexService } from './DataIndexService';

export class SonataFlowService {
  private readonly orchestratorKafkaImpl?: Kafka;
  private readonly orchestratorKafkaMessageKey?: string;
  constructor(
    private readonly dataIndexService: DataIndexService,
    private readonly logger: LoggerService,
    private readonly kafkaServiceOptions?: OrchestratorKafkaServiceOptions,
  ) {
    // If there are kafkaServiceOptions, then do the implemntation
    if (this.kafkaServiceOptions) {
      this.orchestratorKafkaMessageKey =
        this.kafkaServiceOptions.messageKey ?? '';
      this.logger.debug(
        `creating orchestrator kafka implementation with options: clientId: ${this.kafkaServiceOptions.clientId} and brokers: ${JSON.stringify(this.kafkaServiceOptions.brokers)}`,
      );
      // It looks like that the community plugin just passes the whole options from the app-config to the kafkajs constructor
      this.orchestratorKafkaImpl = new Kafka(this.kafkaServiceOptions);
    }
  }

  getOrchestratorKafkaImpl() {
    return this.orchestratorKafkaImpl;
  }

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

    // Can reuse the instances to get the stats
    const instances = await this.dataIndexService.fetchInstances({
      definitionIds,
      pagination,
      filter,
    });

    // This will have all the workflows, so we need to group by workflow id
    // and then we can get the success ratio for each workflow
    // And also find the amount of runs for the 30 day window

    // First we ned to group the data by processId and version
    // Result will look something like this:
    /**
     * {
     *  'workflowId-version': [processInstance1, processInstance2, ...],
     *  'workflowId-version': [processInstance1, processInstance2, ...],
     *  ...
     * }
     */
    const groupedData = instances.reduce<Record<string, ProcessInstance[]>>(
      (acc, item) => {
        acc[`${item.processId}-${item.version}`] ??= [];
        acc[`${item.processId}-${item.version}`].push(item);
        return acc;
      },
      {},
    );

    // Then we need to calculate the success rate for each processId and get the amount of runs for the last 30 days
    // Result will look something like this:
    /**
      [
        {
          processIdVersion: 'quarkus-backend-1.0',
          successRatio: 1,
          runsLastMonth: 1
        },
        {
          processIdVersion: 'random-success-or-error-1.0',
          successRatio: 0.5833333333333334,
          runsLastMonth: 12
        }
      ]
     */
    const worflowInstanceStats = Object.entries(groupedData).map(
      ([processIdVersion, items]) => {
        const successCount = items.filter(
          item => item.state === ProcessInstanceState.Completed,
        ).length;
        const runsLastMonth = items.filter(
          item =>
            item.start &&
            new Date(item.start) >
              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        );
        return {
          processIdVersion,
          successRatio: successCount / items.length,
          runsLastMonth: runsLastMonth.length,
        };
      },
    );

    const items = await Promise.all(
      workflowInfos
        .filter(info => info.source)
        .map(info =>
          this.fetchWorkflowOverviewBySource(info.source!, targetEntity),
        ),
    );

    return items
      .filter((item): item is WorkflowOverview => !!item)
      .map(overview => {
        const stats = worflowInstanceStats.find(
          stat =>
            stat.processIdVersion ===
            `${overview.workflowId}-${overview.version}`,
        );
        if (stats) {
          overview.successRatio = stats.successRatio;
          overview.runsLastMonth = stats.runsLastMonth;
        }
        return overview;
      });
  }

  public async executeWorkflowAsCloudEvent(args: {
    definitionId: string;
    workflowSource: string;
    workflowEventType: string;
    contextAttribute: string;
    inputData?: ProcessInstanceVariables;
    authTokens?: Array<AuthToken>;
    backstageToken?: string;
  }): Promise<WorkflowExecutionResponse | undefined> {
    if (!this.orchestratorKafkaImpl) {
      this.logger.error('No Orchestrator kafka implementation added');
      throw new Error('No Orchestrator kafka implementation added');
    }
    const contextAttributeId = randomUUID();
    // The data that needs to be part of the clouevent data is in the workflowdata key.
    // We need to spread the workflowdata payload into the clouevent data,
    // which is slighty different than a regular workflow execution.
    // We also need to remove the isEvent value from the workflowdata payload.
    const rawWorkflowdata = args.inputData?.workflowdata;
    let workflowdataPayload: Record<string, unknown> = {};
    if (
      typeof rawWorkflowdata === 'object' &&
      rawWorkflowdata !== null &&
      !Array.isArray(rawWorkflowdata)
    ) {
      workflowdataPayload = {
        ...(rawWorkflowdata as Record<string, unknown>),
      };
      if (workflowdataPayload.isEvent) {
        delete workflowdataPayload.isEvent;
      }
    }
    const triggeringCloudEvent = new CloudEvent({
      datacontenttype: 'application/json',
      type: args.workflowEventType,
      source: args.workflowSource,
      [args.contextAttribute]: contextAttributeId,
      data: {
        ...workflowdataPayload,
        [args.contextAttribute]: contextAttributeId, // Need this to be able to correlate the workflow run somehow
      },
    });

    // Put the CE in the format needed to send as a Kafka message
    const lockEventBinding = KafkaCE.binary(triggeringCloudEvent);
    // Create the message event that will be sent to the kafka topic
    const messageEvent = {
      key: this.orchestratorKafkaMessageKey,
      value: JSON.stringify(KafkaCE.toEvent(lockEventBinding)),
    };

    const kfk = this.orchestratorKafkaImpl;
    const producer = kfk.producer();
    try {
      // Connect the producer
      await producer.connect();

      // Send the message
      await producer.send({
        topic: args.workflowEventType,
        messages: [messageEvent],
      });
    } catch (error) {
      this.logger.error(
        `Error with Kafka client connection. Options: clientId: ${this.kafkaServiceOptions?.clientId} and broker: ${JSON.stringify(this.kafkaServiceOptions?.brokers)}`,
      );
      throw new Error(
        `Error with Kafka client with connection Options: clientId: ${this.kafkaServiceOptions?.clientId} and broker: ${JSON.stringify(this.kafkaServiceOptions?.brokers)}`,
      );
    } finally {
      // Disconnect the producer
      await producer.disconnect();
    }

    // Since sending to kafka doesn't return anything, send back the contextAttributeId here
    // Then we will query the workflow instances to see if it showed up yet
    return {
      id: contextAttributeId,
    };
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
      version: definition.version,
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
