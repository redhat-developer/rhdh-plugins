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
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { ErrorBuilder } from '../helpers/errorBuilder';
import {
  buildFilterCondition,
  groupNestedFilters,
} from '../helpers/filterBuilder';
import {
  buildGraphQlQuery,
  buildQueryParamVariable,
} from '../helpers/queryBuilder';
import { Pagination } from '../types/pagination';
import { FETCH_PROCESS_INSTANCES_SORT_FIELD } from './constants';
import type { WorkflowRunStatsInstance } from './Helper';

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
    const graphQlQuery = gql`
      query FindProcessInstanceQuery($definitionId: String!) {
        ProcessDefinitions(where: { id: { equal: $definitionId } }) {
          id
          name
          version
          type
          endpoint
          serviceUrl
          source
        }
      }
    `;

    const result = await this.client.query(graphQlQuery, {
      definitionId,
    });

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
      whereClause = `and: [{${definitionIdsCondition}}, {${filterCondition?.clause}}]`;
    } else if (definitionIdsCondition || filterCondition) {
      whereClause = definitionIdsCondition ?? filterCondition?.clause;
    } else {
      whereClause = undefined;
    }

    const graphQlQuery = buildGraphQlQuery({
      type: 'ProcessDefinitions',
      queryBody:
        'id, name, version, type, endpoint, serviceUrl, source, metadata',
      whereClause,
      pagination,
      filterCondition: filterCondition,
    });
    this.logger.debug(`GraphQL query: ${graphQlQuery}`);

    const paramVariables = buildQueryParamVariable(pagination, filterCondition);

    this.logger.debug(`GraphQL query params:`, paramVariables);

    const result = await this.client.query(graphQlQuery, paramVariables);
    this.logger.debug(
      `Get workflow definitions result: ${JSON.stringify(result)}`,
    );

    this.handleGraphqlClientError(
      'Error fetching data index swf results',
      result,
    );

    return this.filterDeletedWorkflows(result.data.ProcessDefinitions);
  }

  private async buildProcessInstancesWhereClause(args: {
    definitionIds?: string[];
    filter?: Filter;
  }) {
    const { definitionIds, filter } = args;
    const processIdNotNullCondition = 'processId: {isNull: false}';
    const definitionIdsCondition =
      definitionIds && definitionIds.length > 0
        ? `processId: {in: ${JSON.stringify(definitionIds)}}`
        : undefined;
    const type = 'ProcessInstance';

    // Group nested filters by field to combine repeated fields correctly.
    const processedFilters = filter ? groupNestedFilters(filter) : undefined;
    const filterCondition = processedFilters
      ? buildFilterCondition(
          await this.inspectInputArgument(type),
          type,
          processedFilters,
        )
      : undefined;

    const conditions = [`{${processIdNotNullCondition}}`];

    if (definitionIdsCondition) {
      conditions.push(`{${definitionIdsCondition}}`);
    }

    if (filterCondition) {
      conditions.push(`{${filterCondition.clause}}`);
    }

    let whereClause: string;
    if (conditions.length === 1) {
      whereClause = conditions[0].slice(1, -1);
    } else {
      whereClause = `and: [${conditions.join(', ')}]`;
    }

    return { whereClause, filterCondition };
  }

  public async fetchInstances(args: {
    definitionIds?: string[];
    pagination?: Pagination;
    filter?: Filter;
  }): Promise<ProcessInstance[]> {
    const { pagination } = args;
    if (pagination) pagination.sortField ??= FETCH_PROCESS_INSTANCES_SORT_FIELD;

    const { whereClause, filterCondition } =
      await this.buildProcessInstancesWhereClause(args);

    const graphQlQuery = buildGraphQlQuery({
      type: 'ProcessInstances',
      queryBody:
        'id, version, processName, processId, state, start, end, nodes { id }, variables, executionSummary',
      whereClause,
      pagination,
      filterCondition,
    });
    this.logger.debug(`GraphQL query: ${graphQlQuery}`);

    const paramVariables = buildQueryParamVariable(pagination, filterCondition);

    this.logger.debug(`GraphQL query params:`, paramVariables);

    const result = await this.client.query<{
      ProcessInstances: ProcessInstance[];
    }>(graphQlQuery, paramVariables);
    this.logger.debug(
      `Fetch process instances result: ${JSON.stringify(result)}`,
    );

    this.handleGraphqlClientError('Error when fetching instances', result);

    const processInstancesSrc = result.data ? result.data.ProcessInstances : [];

    // Resolve metadata once per distinct process ID in this batch and reuse it
    // for matching rows, preserving description enrichment and source validation.
    const workflowInfoByProcessId = new Map<string, WorkflowInfo | undefined>();
    await Promise.all(
      [...new Set(processInstancesSrc.map(instance => instance.processId))].map(
        async processId => {
          workflowInfoByProcessId.set(
            processId,
            await this.fetchWorkflowInfo(processId),
          );
        },
      ),
    );

    return processInstancesSrc.map(instance =>
      this.getWorkflowDefinitionFromInstance(
        instance,
        workflowInfoByProcessId.get(instance.processId),
      ),
    );
  }

  public async fetchInstanceInitiators(args: {
    definitionIds?: string[];
    pagination?: Pagination;
    filter?: Filter;
  }): Promise<string[]> {
    const { whereClause, filterCondition } =
      await this.buildProcessInstancesWhereClause(args);

    const graphQlQuery = buildGraphQlQuery({
      type: 'ProcessInstances',
      queryBody: 'variables',
      whereClause,
      pagination: args.pagination,
      filterCondition,
    });
    this.logger.debug(`GraphQL instance initiator query: ${graphQlQuery}`);

    const paramVariables = buildQueryParamVariable(
      args.pagination,
      filterCondition,
    );
    this.logger.debug(
      'GraphQL instance initiator query params:',
      paramVariables,
    );

    const result = await this.client.query<{
      ProcessInstances: Array<{ variables?: ProcessInstance['variables'] }>;
    }>(graphQlQuery, paramVariables);

    this.handleGraphqlClientError(
      'Error when fetching instance initiators',
      result,
    );

    const initiators = new Set<string>();
    (result.data?.ProcessInstances ?? []).forEach(instance => {
      const variables = parseWorkflowVariables(instance.variables as object) as
        { initiatorEntity?: unknown } | undefined;
      if (
        typeof variables?.initiatorEntity === 'string' &&
        variables.initiatorEntity
      ) {
        initiators.add(variables.initiatorEntity);
      }
    });

    return [...initiators];
  }

  public async fetchStatsInstances(args: {
    definitionIds?: string[];
    filter?: Filter;
  }): Promise<WorkflowRunStatsInstance[]> {
    const { whereClause, filterCondition } =
      await this.buildProcessInstancesWhereClause(args);

    const graphQlQuery = buildGraphQlQuery({
      type: 'ProcessInstances',
      queryBody: 'processId, version, state, start, end',
      whereClause,
      filterCondition,
    });
    this.logger.debug(`GraphQL workflow run stats query: ${graphQlQuery}`);

    const paramVariables = buildQueryParamVariable(undefined, filterCondition);
    this.logger.debug(
      'GraphQL workflow run stats query params:',
      paramVariables,
    );

    const result = await this.client.query<{
      ProcessInstances: WorkflowRunStatsInstance[];
    }>(graphQlQuery, paramVariables);

    this.handleGraphqlClientError(
      'Error when fetching workflow run stats instances',
      result,
    );

    return result.data?.ProcessInstances ?? [];
  }

  public async countInstances(args: {
    definitionIds?: string[];
    filter?: Filter;
  }): Promise<number> {
    const { whereClause, filterCondition } =
      await this.buildProcessInstancesWhereClause(args);
    const filterVariables = filterCondition?.clauseVariable ?? [];
    const variableDefinitions = filterVariables
      .map(
        variable =>
          `$${variable.clauseVariableName}: ${variable.clauseVariableType}`,
      )
      .join(', ');
    const queryHeader = variableDefinitions
      ? `query (${variableDefinitions})`
      : 'query';
    const graphQlQuery = `${queryHeader} { CountProcessInstances(where: {${whereClause}}) }`;
    const paramVariables: Record<string, string | boolean | string[]> = {};
    filterVariables.forEach(variable => {
      paramVariables[variable.clauseVariableName] = variable.formattedValue;
    });

    this.logger.debug(`GraphQL count query: ${graphQlQuery}`);
    this.logger.debug(`GraphQL count query params:`, paramVariables);

    const result = await this.client.query<{
      CountProcessInstances: number;
    }>(graphQlQuery, paramVariables);
    this.logger.debug(
      `Count process instances result: ${JSON.stringify(result)}`,
    );

    this.handleGraphqlClientError('Error when counting instances', result);

    return result.data?.CountProcessInstances ?? 0;
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

    const whereClause = `and: [{${processIdNotNullCondition}}, {${filterCondition.clause}}]`;

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
      filterCondition,
    });

    this.logger.debug(`GraphQL query: ${graphQlQuery}`);

    const paramVariables = buildQueryParamVariable(pagination, filterCondition);

    this.logger.debug(`GraphQL query params:`, paramVariables);

    const result = await this.client.query<{
      ProcessInstances: ProcessInstance[];
    }>(graphQlQuery, paramVariables);
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

  private getWorkflowDefinitionFromInstance(
    instance: ProcessInstance,
    workflowInfo: WorkflowInfo | undefined,
  ): ProcessInstance {
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
    const graphQlQuery = gql`
      query FindProcessInstanceQuery($definitionId: String!) {
        ProcessDefinitions(where: { id: { equal: $definitionId } }) {
          id
          source
        }
      }
    `;

    const result = await this.client.query(graphQlQuery, {
      definitionId,
    });

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
      ? `, variables: {targetEntity: {equal: $targetEntity } }`
      : '';

    const graphQlQuery = gql`
      query FindProcessInstanceQuery($definitionId: String!, $limit: Int!, $offset: Int! ${args.targetEntity ? `, $targetEntity: String` : ''}) {
        ProcessInstances(
          where: {processId: {equal: $definitionId } ${targetEntityWhereCondition} },
          orderBy: {start:DESC},
          pagination: {limit: $limit, offset: $offset}
        ) { id, version, processName, state, start, end }
      }
     `;

    const result = await this.client.query(
      graphQlQuery,
      args.targetEntity
        ? {
            definitionId: args.definitionId,
            limit: args.limit,
            offset: args.offset,
            targetEntity: args.targetEntity,
          }
        : {
            definitionId: args.definitionId,
            limit: args.limit,
            offset: args.offset,
          },
    );
    this.logger.debug(
      `Fetch workflow instances result: ${JSON.stringify(result)}`,
    );

    this.handleGraphqlClientError(
      'Error when fetching workflow instances',
      result,
    );

    return result.data.ProcessInstances;
  }

  public async fetchLatestInstancesByDefinitionIds(args: {
    definitionIds: string[];
    targetEntity?: string;
  }): Promise<Map<string, ProcessInstance | undefined>> {
    const definitionIds = [...new Set(args.definitionIds)];
    const latestInstances = new Map<string, ProcessInstance | undefined>(
      definitionIds.map(definitionId => [definitionId, undefined]),
    );

    if (definitionIds.length === 0) {
      return latestInstances;
    }

    const definitionIdVariables = definitionIds.map(
      (_definitionId, index) => `$definitionId${index}: String!`,
    );
    const variableDefinitions = args.targetEntity
      ? [...definitionIdVariables, '$targetEntity: String']
      : definitionIdVariables;
    const targetEntityCondition = args.targetEntity
      ? ', variables: {targetEntity: {equal: $targetEntity}}'
      : '';
    // Keep the limit scoped to each workflow; a shared limited list could be
    // filled by one workflow's history and omit another workflow's latest run.
    const latestInstanceSelections = definitionIds
      .map(
        (_definitionId, index) => `
          latest${index}: ProcessInstances(
            where: {processId: {equal: $definitionId${index}}${targetEntityCondition}},
            orderBy: {start: DESC},
            pagination: {limit: 1, offset: 0}
          ) { id version processName processId state start end }
        `,
      )
      .join('\n');
    const graphQlQuery = `query FetchLatestWorkflowInstances(${variableDefinitions.join(', ')}) {
      ${latestInstanceSelections}
    }`;
    const paramVariables: Record<string, string> = {};
    definitionIds.forEach((definitionId, index) => {
      paramVariables[`definitionId${index}`] = definitionId;
    });
    if (args.targetEntity) {
      paramVariables.targetEntity = args.targetEntity;
    }

    this.logger.debug(
      `GraphQL latest workflow instances query: ${graphQlQuery}`,
    );
    this.logger.debug(
      'GraphQL latest workflow instances query params:',
      paramVariables,
    );

    const result = await this.client.query<Record<string, ProcessInstance[]>>(
      graphQlQuery,
      paramVariables,
    );
    this.handleGraphqlClientError(
      'Error when fetching latest workflow instances',
      result,
    );

    definitionIds.forEach((definitionId, index) => {
      latestInstances.set(definitionId, result.data?.[`latest${index}`]?.[0]);
    });

    return latestInstances;
  }

  public async fetchInstanceVariables(
    instanceId: string,
  ): Promise<object | undefined> {
    const graphQlQuery = gql`
      query FindProcessInstanceQuery($instanceId: String!) {
        ProcessInstances(where: { id: { equal: $instanceId } }) {
          variables
        }
      }
    `;

    const result = await this.client.query(graphQlQuery, {
      instanceId,
    });

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
    const graphQlQuery = gql`
      query FindProcessInstanceQuery($instanceId: String!) {
        ProcessInstances(where: { id: { equal: $instanceId } }) {
          processId
        }
      }
    `;

    const result = await this.client.query(graphQlQuery, {
      instanceId,
    });

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
          version
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
