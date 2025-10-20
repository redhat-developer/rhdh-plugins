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

import { Client, fetchExchange, gql } from '@urql/core';

import {
  Filter,
  fromWorkflowSource,
  IntrospectionField,
  NestedFilter,
  parseWorkflowVariables,
  ProcessInstance,
  WorkflowDefinition,
  WorkflowInfo,
} from '@redhat/backstage-plugin-orchestrator-common';

import { ErrorBuilder } from '../helpers/errorBuilder';
import { buildFilterCondition } from '../helpers/filterBuilder';
import { buildGraphQlQuery } from '../helpers/queryBuilder';
import { Pagination } from '../types/pagination';
import { FETCH_PROCESS_INSTANCES_SORT_FIELD } from './constants';

export class DataIndexService {
  private readonly client: Client;
  public processDefinitionArguments: IntrospectionField[] = [];
  public processInstanceArguments: IntrospectionField[] = [];

  public constructor(
    private readonly dataIndexUrl: string,
    private readonly logger: LoggerService,
  ) {
    if (!dataIndexUrl.length) {
      throw ErrorBuilder.GET_NO_DATA_INDEX_URL_ERR();
    }

    this.client = this.getNewGraphQLClient();
  }

  private getNewGraphQLClient(): Client {
    const diURL = `${this.dataIndexUrl}/graphql`;
    return new Client({
      url: diURL,
      exchanges: [fetchExchange],
    });
  }

  public async initInputProcessDefinitionArgs(): Promise<IntrospectionField[]> {
    if (this.processDefinitionArguments.length === 0) {
      this.processDefinitionArguments =
        await this.inspectInputArgument('ProcessDefinition');
    }
    return this.processDefinitionArguments; // For testing purposes
  }

  public graphQLArgumentQuery(type: string): string {
    return `query ${type}Argument {
        __type(name: "${type}Argument") {
          kind
          name
          inputFields {
            name
            type {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                  }
                }
              }
            }
          }
        }
      }`;
  }

  public async inspectInputArgument(
    type: string,
  ): Promise<IntrospectionField[]> {
    const result = await this.client.query(this.graphQLArgumentQuery(type), {});

    this.logger.debug(`Introspection query result: ${JSON.stringify(result)}`);

    this.handleGraphqlClientError(
      'Error executing introspection query',
      result,
    );

    const pairs: IntrospectionField[] = [];
    if (result?.data?.__type?.inputFields) {
      for (const field of result.data.__type.inputFields) {
        if (
          field.name !== 'and' &&
          field.name !== 'or' &&
          field.name !== 'not'
        ) {
          pairs.push({
            name: field.name,
            type: {
              name: field.type.name,
              kind: field.type.kind,
              ofType: field.type.ofType,
            },
          });
        }
      }
    }
    return pairs;
  }

  public async fetchWorkflowInfo(
    definitionId: string,
  ): Promise<WorkflowInfo | undefined> {
    const graphQlQuery = `{ ProcessDefinitions ( where: {id: {equal: "${definitionId}" } } ) { id, name, version, type, endpoint, serviceUrl, source } }`;

    const result = await this.client.query(graphQlQuery, {});

    this.logger.debug(
      `Get workflow definition result: ${JSON.stringify(result)}`,
    );

    this.handleGraphqlClientError('Error fetching workflow definition', result);

    const processDefinitions = result.data.ProcessDefinitions as WorkflowInfo[];

    if (processDefinitions.length === 0) {
      this.logger.info(`No workflow definition found for ${definitionId}`);
      return undefined;
    }

    return processDefinitions[0];
  }

  public async fetchWorkflowServiceUrls(): Promise<Record<string, string>> {
    const graphQlQuery = `{ ProcessDefinitions { id, serviceUrl } }`;

    const result = await this.client.query(graphQlQuery, {});

    this.logger.debug(
      `Get workflow service urls result: ${JSON.stringify(result)}`,
    );

    this.handleGraphqlClientError(
      'Error fetching workflow service urls',
      result,
    );

    const processDefinitions = result.data.ProcessDefinitions as WorkflowInfo[];
    return processDefinitions
      .filter(definition => definition.serviceUrl)
      .map(definition => ({ [definition.id]: definition.serviceUrl! }))
      .reduce((acc, curr) => ({ ...acc, ...curr }), {});
  }

  private filterDeletedWorkflows(workflows: WorkflowInfo[]): WorkflowInfo[] {
    // filter deleted workflows, that were deleted via deleting SonataFlow CR, operator marks them as unavailable
    // Note this is different then the isAvailable status in WorkflowOverviewDTO, that is used to mark workflows that are not available on the service for unexpected reasons

    const availableWorkflows: WorkflowInfo[] = [];
    const unavailableWorkflows: WorkflowInfo[] = [];

    workflows.forEach(workflow => {
      const isUnavailable = workflow.metadata?.status === 'unavailable';
      if (isUnavailable) {
        unavailableWorkflows.push(workflow);
      } else {
        availableWorkflows.push(workflow);
      }
    });

    this.logger.debug(
      `filtered deleted workflows when fetching workflow infos: ${JSON.stringify(
        unavailableWorkflows.map(w => ({
          id: w.id,
          name: w.name,
          status: w.metadata?.status,
        })),
      )}`,
    );

    return availableWorkflows;
  }

  public async fetchWorkflowInfos(args: {
    definitionIds?: string[];
    pagination?: Pagination;
    filter?: Filter;
  }): Promise<WorkflowInfo[]> {
    this.logger.info(`fetchWorkflowInfos() called: ${this.dataIndexUrl}`);
    const { definitionIds, pagination, filter } = args;

    const definitionIdsCondition =
      definitionIds !== undefined && definitionIds.length > 0
        ? `id: {in: ${JSON.stringify(definitionIds)}}`
        : undefined;

    const filterCondition = filter
      ? buildFilterCondition(
          await this.initInputProcessDefinitionArgs(),
          'ProcessDefinition',
          filter,
        )
      : undefined;

    let whereClause: string | undefined;
    if (definitionIdsCondition && filterCondition) {
      whereClause = `and: [{${definitionIdsCondition}}, {${filterCondition}}]`;
    } else if (definitionIdsCondition || filterCondition) {
      whereClause = definitionIdsCondition ?? filterCondition;
    } else {
      whereClause = undefined;
    }

    const graphQlQuery = buildGraphQlQuery({
      type: 'ProcessDefinitions',
      queryBody:
        'id, name, version, type, endpoint, serviceUrl, source, metadata',
      whereClause,
      pagination,
    });
    this.logger.debug(`GraphQL query: ${graphQlQuery}`);
    const result = await this.client.query(graphQlQuery, {});
    this.logger.debug(
      `Get workflow definitions result: ${JSON.stringify(result)}`,
    );

    this.handleGraphqlClientError(
      'Error fetching data index swf results',
      result,
    );

    return this.filterDeletedWorkflows(result.data.ProcessDefinitions);
  }

  public async fetchInstances(args: {
    definitionIds?: string[];
    pagination?: Pagination;
    filter?: Filter;
  }): Promise<ProcessInstance[]> {
    const { pagination, definitionIds, filter } = args;
    if (pagination) pagination.sortField ??= FETCH_PROCESS_INSTANCES_SORT_FIELD;

    const processIdNotNullCondition = 'processId: {isNull: false}';
    const definitionIdsCondition =
      definitionIds && definitionIds.length > 0
        ? `processId: {in: ${JSON.stringify(definitionIds)}}`
        : undefined;
    const type = 'ProcessInstance';
    const filterCondition = filter
      ? buildFilterCondition(
          await this.inspectInputArgument(type),
          type,
          filter,
        )
      : '';

    let whereClause = '';
    const conditions = [];

    if (processIdNotNullCondition) {
      conditions.push(`{${processIdNotNullCondition}}`);
    }

    if (definitionIdsCondition) {
      conditions.push(`{${definitionIdsCondition}}`);
    }

    if (filter) {
      conditions.push(`{${filterCondition}}`);
    }

    if (conditions.length === 0) {
      whereClause = processIdNotNullCondition;
    } else if (conditions.length === 1) {
      whereClause = conditions[0].slice(1, -1); // Remove the outer braces
    } else if (conditions.length > 1) {
      whereClause = `and: [${conditions.join(', ')}]`;
    }

    const graphQlQuery = buildGraphQlQuery({
      type: 'ProcessInstances',
      queryBody:
        'id, processName, processId, state, start, end, nodes { id }, variables, executionSummary, parentProcessInstance {id, processName, businessKey}',
      whereClause,
      pagination,
    });

    this.logger.debug(`GraphQL query: ${graphQlQuery}`);

    const result = await this.client.query<{
      ProcessInstances: ProcessInstance[];
    }>(graphQlQuery, {});
    this.logger.debug(
      `Fetch process instances result: ${JSON.stringify(result)}`,
    );

    this.handleGraphqlClientError('Error when fetching instances', result);

    const processInstancesSrc = result.data ? result.data.ProcessInstances : [];

    const processInstances = await Promise.all(
      processInstancesSrc.map(async instance => {
        return await this.getWorkflowDefinitionFromInstance(instance);
      }),
    );
    return processInstances;
  }

  public async fetchDefinitionIdsFromInstances(args: {
    targetEntity: string;
  }): Promise<string[]> {
    const { targetEntity } = args;

    const processIdNotNullCondition = 'processId: {isNull: false}';

    const type = 'ProcessInstance';
    const targetEntityFilter: NestedFilter = {
      field: 'variables',
      nested: {
        operator: 'EQ',
        field: 'targetEntity',
        value: targetEntity,
      },
    };

    const filterCondition = buildFilterCondition(
      await this.inspectInputArgument(type),
      type,
      targetEntityFilter,
    );

    const whereClause = `and: [{${processIdNotNullCondition}}, {${filterCondition}}]`;

    // Apply a limit to prevent memory exhaustion and network timeouts when entities
    // have thousands of process instances. Entities with more instances than this limit
    // may not see all their associated workflows.
    const pagination = {
      limit: 1000,
      offset: 0,
    };

    const graphQlQuery = buildGraphQlQuery({
      type: 'ProcessInstances',
      queryBody: 'processId',
      whereClause,
      pagination,
    });

    this.logger.debug(`GraphQL query: ${graphQlQuery}`);

    const result = await this.client.query<{
      ProcessInstances: ProcessInstance[];
    }>(graphQlQuery, {});
    this.logger.debug(
      `Fetch definition ids from instances history result: ${JSON.stringify(result)}`,
    );

    this.handleGraphqlClientError(
      'Error when fetching definition ids from instances history',
      result,
    );

    const processInstancesSrc = result.data ? result.data.ProcessInstances : [];
    const distinctProcessIds = [
      ...new Set(processInstancesSrc.map(instance => instance.processId)),
    ]; // graphql doesn't support distinct so we need to use a set to get the distinct process ids
    return distinctProcessIds;
  }

  private async getWorkflowDefinitionFromInstance(instance: ProcessInstance) {
    const workflowInfo = await this.fetchWorkflowInfo(instance.processId);
    if (!workflowInfo?.source) {
      throw new Error(
        `Workflow defintion is required to fetch instance ${instance.id}`,
      );
    }
    if (workflowInfo) {
      instance.description = workflowInfo.description;
    }
    return instance;
  }

  public async fetchWorkflowSource(
    definitionId: string,
  ): Promise<string | undefined> {
    const graphQlQuery = `{ ProcessDefinitions ( where: {id: {equal: "${definitionId}" } } ) { id, source } }`;

    const result = await this.client.query(graphQlQuery, {});

    this.logger.debug(
      `Fetch workflow source result: ${JSON.stringify(result)}`,
    );

    this.handleGraphqlClientError(
      'Error when fetching workflow source',
      result,
    );

    const processDefinitions = result.data.ProcessDefinitions as WorkflowInfo[];

    if (processDefinitions.length === 0) {
      this.logger.info(`No workflow source found for ${definitionId}`);
      return undefined;
    }

    return processDefinitions[0].source;
  }

  public async fetchInstancesByDefinitionId(args: {
    definitionId: string;
    limit: number;
    offset: number;
    targetEntity?: string;
  }): Promise<ProcessInstance[]> {
    const targetEntityWhereCondition = args.targetEntity
      ? `, variables: {targetEntity: {equal: "${args.targetEntity}" } }`
      : '';

    const graphQlQuery = `{ ProcessInstances( where: {processId: {equal: "${args.definitionId}" } ${targetEntityWhereCondition} }, orderBy: {start:DESC}, pagination: {limit: ${args.limit}, offset: ${args.offset}}) { id, processName, state, start, end } }`;

    const result = await this.client.query(graphQlQuery, {});

    this.logger.debug(
      `Fetch workflow instances result: ${JSON.stringify(result)}`,
    );

    this.handleGraphqlClientError(
      'Error when fetching workflow instances',
      result,
    );

    return result.data.ProcessInstances;
  }

  public async fetchInstanceVariables(
    instanceId: string,
  ): Promise<object | undefined> {
    const graphQlQuery = `{ ProcessInstances (where: { id: {equal: "${instanceId}" } } ) { variables } }`;

    const result = await this.client.query(graphQlQuery, {});

    this.logger.debug(
      `Fetch process instance variables result: ${JSON.stringify(result)}`,
    );

    this.handleGraphqlClientError(
      'Error when fetching process instance variables',
      result,
    );

    const processInstances = result.data.ProcessInstances as ProcessInstance[];

    if (processInstances.length === 0) {
      return undefined;
    }

    return parseWorkflowVariables(processInstances[0].variables as object);
  }

  public async fetchDefinitionIdByInstanceId(
    instanceId: string,
  ): Promise<string | undefined> {
    const graphQlQuery = `{ ProcessInstances (where: { id: {equal: "${instanceId}" } } ) { processId } }`;

    const result = await this.client.query(graphQlQuery, {});

    this.logger.debug(
      `Fetch process id from instance result: ${JSON.stringify(result)}`,
    );

    this.handleGraphqlClientError(
      'Error when fetching process id from instance',
      result,
    );

    const processInstances = result.data.ProcessInstances as ProcessInstance[];

    if (processInstances.length === 0) {
      return undefined;
    }

    return processInstances[0].processId;
  }

  public async fetchInstance(
    instanceId: string,
  ): Promise<ProcessInstance | undefined> {
    const FindProcessInstanceQuery = gql`
      query FindProcessInstanceQuery($instanceId: String!) {
        ProcessInstances(where: { id: { equal: $instanceId } }) {
          id
          processName
          processId
          serviceUrl
          executionSummary
          state
          start
          end
          nodes {
            id
            nodeId
            definitionId
            type
            name
            enter
            exit
            errorMessage
          }
          variables
          parentProcessInstance {
            id
            processName
            businessKey
          }
          error {
            nodeDefinitionId
            nodeInstanceId
            message
          }
        }
      }
    `;

    const result = await this.client.query(FindProcessInstanceQuery, {
      instanceId,
    });

    this.logger.debug(
      `Fetch process instance result: ${JSON.stringify(result)}`,
    );

    this.handleGraphqlClientError(
      'Error when fetching process instances',
      result,
    );

    const processInstances = result.data.ProcessInstances as ProcessInstance[];

    if (processInstances.length === 0) {
      return undefined;
    }

    const instance = this.removeNodes(processInstances[0]);

    const workflowInfo = await this.fetchWorkflowInfo(instance.processId);
    if (!workflowInfo?.source) {
      throw new Error(
        `Workflow definition is required to fetch instance ${instance.id}`,
      );
    }
    const workflowDefinitionSrc: WorkflowDefinition = fromWorkflowSource(
      workflowInfo.source,
    );
    if (workflowInfo) {
      instance.description = workflowDefinitionSrc.description;
    }
    return instance;
  }

  private handleGraphqlClientError(scenario: string, result: any) {
    if (!result?.error) {
      return;
    }

    this.logger.error(scenario, result);

    const networkError = result.error.networkError?.cause?.message;
    if (networkError) {
      const toThrow = new Error(`${result.error.message}. ${networkError}`);
      toThrow.name = 'Network Error';
      throw toThrow;
    }

    const graphQLErrors = result.error.graphQLErrors;
    if (
      result.data &&
      Array.isArray(graphQLErrors) &&
      graphQLErrors.length > 0
    ) {
      const graphQLError = graphQLErrors[0];
      if (
        graphQLError?.extensions?.classification === 'DataFetchingException'
      ) {
        // we have data (perhaps partial) and it is a data fetch error ==> log and ignore
        return;
      }
    }

    throw result.error;
  }

  private removeNodes(instance: ProcessInstance): ProcessInstance {
    const errorNodeId = instance.error?.nodeInstanceId;
    instance.nodes = instance.nodes.filter(node => {
      return !node.errorMessage || node.id === errorNodeId;
    });
    return instance;
  }
}
