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

import { Client, OperationResult } from '@urql/core';

import {
  FieldFilter,
  FieldFilterOperatorEnum,
  fromWorkflowSource,
  LogicalFilter,
  NodeInstance,
  ProcessInstance,
  TypeKind,
  TypeName,
  WorkflowInfo,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import * as buildGrahQLFilterUtils from '../helpers/filterBuilder';
import * as buildGrahQLQueryUtils from '../helpers/queryBuilder';
import { FilterClause } from '../types/filterClause';
import { Pagination } from '../types/pagination';
import {
  mockProcessDefinitionArguments,
  mockProcessDefinitionIntrospection,
} from './__fixtures__/mockProcessDefinitionArgumentsData';
import {
  mockProcessInstanceArguments,
  mockProcessInstanceIntrospection,
} from './__fixtures__/mockProcessInstanceArgumentsData';
import { DataIndexService } from './DataIndexService';

jest.mock('../helpers/queryBuilder', () => {
  return {
    __esModule: true,
    ...jest.requireActual('../helpers/queryBuilder'),
  };
});

jest.mock('../helpers/filterBuilder', () => {
  return {
    __esModule: true,
    ...jest.requireActual('../helpers/filterBuilder'),
  };
});

jest.mock('@urql/core', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      query: jest.fn(),
    })),
    // gql is used as a tagged template literal in DataIndexService methods;
    // return the concatenated string so client.query receives a non-null value.
    gql: (strings: TemplateStringsArray, ...values: any[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
  };
});

jest.mock(
  '@red-hat-developer-hub/backstage-plugin-orchestrator-common',
  () => ({
    ...jest.requireActual(
      '@red-hat-developer-hub/backstage-plugin-orchestrator-common',
    ),
    fromWorkflowSource: jest.fn(),
  }),
);

const mockOperationResult = <T>(data: T, error?: any): OperationResult<T> => ({
  data,
  error,
  operation: {} as any,
  extensions: {},
  hasNext: false,
  stale: false,
});

const mockWfInfos: WorkflowInfo[] = [
  {
    id: '9fa2a881-c932-468d-83a9-687b9f1e62a7',
    nodes: [createNodeObject('A'), createNodeObject('B')],
  },
];

const createQueryArgs = (
  type: 'ProcessDefinitions' | 'ProcessInstances' | 'Jobs',
  queryBody: string,
  whereClause?: string,
  pagination?: Pagination,
  filterCondition?: FilterClause,
) => ({
  type,
  queryBody,
  whereClause,
  pagination,
  filterCondition,
});

describe('initInputArgs', () => {
  type MockableClient = Pick<Client, 'query'>;
  const createMockClient = (): jest.Mocked<MockableClient> => ({
    query: jest.fn(),
  });

  let loggerMock: LoggerService;
  let dataIndexService: DataIndexService;
  let mockClient: jest.Mocked<MockableClient>;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
    // Create a new mock client for each test
    mockClient = createMockClient();
    (Client as jest.MockedClass<typeof Client>).mockImplementation(
      () => mockClient as unknown as Client,
    );

    loggerMock = {
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      child: jest.fn(),
    };
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult(mockProcessDefinitionArguments),
    );
    dataIndexService = new DataIndexService('fakeUrl', loggerMock);
  });

  it('ProcessDefinition', async () => {
    const processDefinitionArguments =
      await dataIndexService.initInputProcessDefinitionArgs();

    expect(mockClient.query).toHaveBeenCalledTimes(1);
    expect(mockClient.query).toHaveBeenCalledWith(
      dataIndexService.graphQLArgumentQuery('ProcessDefinition'),
      {},
    );

    expect(processDefinitionArguments).toBeDefined();
    expect(
      processDefinitionArguments.every(
        val => !['and', 'or', 'not'].includes(val.name),
      ),
    ).toBe(true);
    expect(processDefinitionArguments).toHaveLength(3);
    expect(
      processDefinitionArguments.some(
        obj =>
          obj.name === 'id' &&
          obj.type.kind === TypeKind.InputObject &&
          obj.type.name === TypeName.String,
      ),
    ).toBe(true);
    expect(
      processDefinitionArguments.some(
        obj =>
          obj.name === 'name' &&
          obj.type.kind === TypeKind.InputObject &&
          obj.type.name === TypeName.String,
      ),
    ).toBe(true);
    expect(
      processDefinitionArguments.some(
        obj =>
          obj.name === 'version' &&
          obj.type.kind === TypeKind.InputObject &&
          obj.type.name === TypeName.String,
      ),
    ).toBe(true);
  });
});

describe('fetchWorkflowInfos', () => {
  let loggerMock: LoggerService;
  let buildFilterConditionSpy: any;
  let buildGraphQlQuerySpy: jest.Spied<
    typeof buildGrahQLQueryUtils.buildGraphQlQuery
  >;
  let dataIndexService: DataIndexService;
  let mockClient: jest.Mocked<Client>;

  const definitionIds = ['id1', 'id2'];
  const queryBody =
    'id, name, version, type, endpoint, serviceUrl, source, metadata';
  const pagination = { limit: 10, offset: 0, order: 'ASC', sortField: 'name' };

  const helloWorldFilter = {
    field: 'name',
    operator: FieldFilterOperatorEnum.Eq,
    value: 'Hello World Workflow',
  };
  const greetingFilter = {
    field: 'id',
    operator: FieldFilterOperatorEnum.Eq,
    value: 'yamlgreet',
  };

  const logicalFilter: LogicalFilter = {
    operator: 'OR',
    filters: [helloWorldFilter, greetingFilter],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockClient = {
      query: jest.fn(),
    } as any;

    (Client as jest.Mock).mockImplementation(() => mockClient);

    loggerMock = {
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      child: jest.fn(),
    };

    dataIndexService = new DataIndexService('fakeUrl', loggerMock);

    // Set up spies on the graphql utility functions
    buildGraphQlQuerySpy = jest.spyOn(
      buildGrahQLQueryUtils,
      'buildGraphQlQuery',
    );
    buildFilterConditionSpy = jest.spyOn(
      buildGrahQLFilterUtils,
      'buildFilterCondition',
    );
  });
  it('should fetch workflow infos with no parameters', async () => {
    // Given
    const mockQueryResult = {
      ProcessDefinitions: mockWfInfos,
    };
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult(mockQueryResult),
    );

    const expectedQueryArgs = createQueryArgs('ProcessDefinitions', queryBody);
    // When
    const result = await dataIndexService.fetchWorkflowInfos({});
    // Then
    expect(result).toBeDefined();
    expect(result).toStrictEqual(mockQueryResult.ProcessDefinitions);
    expect(buildFilterConditionSpy).not.toHaveBeenCalled();
    expect(buildGraphQlQuerySpy).toHaveBeenCalledTimes(1);
    expect(buildGraphQlQuerySpy).toHaveBeenCalledWith({
      type: 'ProcessDefinitions',
      queryBody,
    });
    expect(mockClient.query).toHaveBeenCalled();
    expect(mockClient.query).toHaveBeenCalledWith(
      buildGrahQLQueryUtils.buildGraphQlQuery(expectedQueryArgs),
      {
        orderByInfo: {},
        paginationInfo: {},
      },
    );
  });

  it('should fetch workflow infos with definitionIds', async () => {
    // Given
    const whereClause = `id: {in: ${JSON.stringify(definitionIds)}}`;
    const mockQueryResult = {
      ProcessDefinitions: mockWfInfos,
    };
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult(mockQueryResult),
    );

    const expectedQueryArgs = createQueryArgs(
      'ProcessDefinitions',
      queryBody,
      whereClause,
    );
    // When
    const result = await dataIndexService.fetchWorkflowInfos({
      definitionIds,
    });

    // Then
    expect(result).toBeDefined();
    expect(result).toStrictEqual(mockQueryResult.ProcessDefinitions);
    expect(buildGraphQlQuerySpy).toHaveBeenCalledTimes(1);
    expect(buildGraphQlQuerySpy).toHaveBeenCalledWith({
      type: 'ProcessDefinitions',
      queryBody,
      whereClause,
    });
    expect(buildFilterConditionSpy).not.toHaveBeenCalled();
    expect(mockClient.query).toHaveBeenCalled();
    expect(mockClient.query).toHaveBeenCalledWith(
      buildGrahQLQueryUtils.buildGraphQlQuery(expectedQueryArgs),
      {
        orderByInfo: {},
        paginationInfo: {},
      },
    );
  });

  it('should fetch workflow infos with definitionIds and pagination', async () => {
    // Given
    const mockQueryResult = {
      ProcessDefinitions: mockWfInfos,
    };
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult(mockQueryResult),
    );

    const expectedQueryArgs = createQueryArgs(
      'ProcessDefinitions',
      queryBody,
      `id: {in: ${JSON.stringify(definitionIds)}}`,
      pagination,
    );
    // When
    const result = await dataIndexService.fetchWorkflowInfos({
      definitionIds,
      pagination,
    });

    // Then
    expect(result).toBeDefined();
    expect(result).toStrictEqual(mockQueryResult.ProcessDefinitions);
    expect(buildGraphQlQuerySpy).toHaveBeenCalledTimes(1);
    expect(buildGraphQlQuerySpy).toHaveBeenCalledWith({
      type: 'ProcessDefinitions',
      queryBody,
      whereClause: `id: {in: ${JSON.stringify(definitionIds)}}`,
      pagination,
    });
    expect(mockClient.query).toHaveBeenCalledTimes(1);
    expect(mockClient.query).toHaveBeenCalledWith(
      buildGrahQLQueryUtils.buildGraphQlQuery(expectedQueryArgs),
      {
        orderByInfo: {
          name: 'ASC',
        },
        paginationInfo: {
          limit: 10,
          offset: 0,
        },
      },
    );
    expect(buildFilterConditionSpy).not.toHaveBeenCalled();
  });

  it('should fetch workflow infos with only filter', async () => {
    // Given
    const mockQueryResult = {
      ProcessDefinitions: mockWfInfos,
    };
    mockClient.query
      .mockResolvedValueOnce(
        mockOperationResult(mockProcessDefinitionArguments),
      )
      .mockResolvedValueOnce(mockOperationResult(mockQueryResult));

    // When
    const result = await dataIndexService.fetchWorkflowInfos({
      filter: logicalFilter,
    });

    // Then
    expect(result).toBeDefined();
    expect(result).toStrictEqual(mockQueryResult.ProcessDefinitions);

    expect(buildFilterConditionSpy).toHaveBeenCalledTimes(1);
    expect(buildFilterConditionSpy).toHaveBeenCalledWith(
      mockProcessDefinitionIntrospection,
      'ProcessDefinition',
      logicalFilter,
    );

    const createdFilter = buildFilterConditionSpy.mock.results[0].value;

    expect(buildGraphQlQuerySpy).toHaveBeenCalledTimes(1);
    expect(buildGraphQlQuerySpy).toHaveBeenCalledWith({
      type: 'ProcessDefinitions',
      queryBody,
      whereClause: createdFilter.clause,
      filterCondition: createdFilter,
    });

    const expectedQueryArgs = createQueryArgs(
      'ProcessDefinitions',
      queryBody,
      createdFilter.clause,
      undefined,
      createdFilter,
    );

    const params = buildGrahQLQueryUtils.buildQueryParamVariable(
      undefined,
      createdFilter,
    );

    expect(mockClient.query).toHaveBeenCalledTimes(2);
    expect(mockClient.query).toHaveBeenCalledWith(
      buildGrahQLQueryUtils.buildGraphQlQuery(expectedQueryArgs),
      params,
    );
  });

  it('should fetch workflow infos with definitionIds and filter', async () => {
    // Given
    const mockQueryResult = {
      ProcessDefinitions: mockWfInfos,
    };
    mockClient.query
      .mockResolvedValueOnce(
        mockOperationResult(mockProcessDefinitionArguments),
      )
      .mockResolvedValueOnce(mockOperationResult(mockQueryResult));

    // When
    const result = await dataIndexService.fetchWorkflowInfos({
      definitionIds,
      filter: logicalFilter,
    });

    // Then
    expect(buildFilterConditionSpy).toHaveBeenCalledTimes(1);
    expect(buildFilterConditionSpy).toHaveBeenCalledWith(
      mockProcessDefinitionIntrospection,
      'ProcessDefinition',
      logicalFilter,
    );

    const createdFilter = buildFilterConditionSpy.mock.results[0].value;

    const whereClause = `and: [{id: {in: ${JSON.stringify(
      definitionIds,
    )}}}, {${createdFilter.clause}}]`;

    const expectedQueryArgs = createQueryArgs(
      'ProcessDefinitions',
      queryBody,
      whereClause,
      undefined,
      createdFilter,
    );

    expect(buildGraphQlQuerySpy).toHaveBeenCalledTimes(1);
    expect(buildGraphQlQuerySpy).toHaveBeenCalledWith({
      type: 'ProcessDefinitions',
      queryBody:
        'id, name, version, type, endpoint, serviceUrl, source, metadata',
      whereClause,
      filterCondition: createdFilter,
    });

    const params = buildGrahQLQueryUtils.buildQueryParamVariable(
      undefined,
      createdFilter,
    );

    expect(mockClient.query).toHaveBeenCalledTimes(2);
    expect(mockClient.query).toHaveBeenCalledWith(
      buildGrahQLQueryUtils.buildGraphQlQuery(expectedQueryArgs),
      params,
    );
    expect(result).toBeDefined();
    expect(result).toStrictEqual(mockQueryResult.ProcessDefinitions);
  });

  it('should fetch workflow infos with definitionIds, pagination, and filter', async () => {
    // Given

    // Given
    const mockQueryResult = {
      ProcessDefinitions: mockWfInfos,
    };
    mockClient.query
      .mockResolvedValueOnce(
        mockOperationResult(mockProcessDefinitionArguments),
      )
      .mockResolvedValueOnce(mockOperationResult(mockQueryResult));

    // When
    const result = await dataIndexService.fetchWorkflowInfos({
      definitionIds,
      pagination,
      filter: logicalFilter,
    });

    // Then
    expect(buildFilterConditionSpy).toHaveBeenCalledTimes(1);
    expect(buildFilterConditionSpy).toHaveBeenCalledWith(
      mockProcessDefinitionIntrospection,
      'ProcessDefinition',
      logicalFilter,
    );

    const createdFilter = buildFilterConditionSpy.mock.results[0].value;

    const whereClause = `and: [{id: {in: ${JSON.stringify(
      definitionIds,
    )}}}, {${createdFilter.clause}}]`;

    const expectedQueryArgs = createQueryArgs(
      'ProcessDefinitions',
      queryBody,
      whereClause,
      pagination,
      createdFilter,
    );

    const params = buildGrahQLQueryUtils.buildQueryParamVariable(
      pagination,
      createdFilter,
    );

    expect(mockClient.query).toHaveBeenCalledTimes(2);
    expect(mockClient.query).toHaveBeenCalledWith(
      buildGrahQLQueryUtils.buildGraphQlQuery(expectedQueryArgs),
      params,
    );
    expect(buildGraphQlQuerySpy).toHaveBeenCalledTimes(2);
    expect(buildGraphQlQuerySpy).toHaveBeenCalledWith({
      type: 'ProcessDefinitions',
      queryBody,
      whereClause,
      pagination,
      filterCondition: createdFilter,
    });

    expect(result).toBeDefined();
    expect(result).toStrictEqual(mockQueryResult.ProcessDefinitions);
  });
});
describe('fetchInstances', () => {
  let loggerMock: LoggerService;
  let buildFilterConditionSpy: any;
  let buildGraphQlQuerySpy: any;
  let mockClient: jest.Mocked<Client>;

  let dataIndexService: DataIndexService;

  const definitionIds = ['id', 'name'];
  const pagination = { limit: 10, offset: 0, order: 'ASC', sortField: 'name' };

  const processIdNotNullCondition = 'processId: {isNull: false}';
  const processIdDefinitions = `processId: {in: ${JSON.stringify(
    definitionIds,
  )}`;
  const queryBody =
    'id, version, processName, processId, state, start, end, nodes { id }, variables, executionSummary, parentProcessInstance {id, processName, businessKey}';

  const mockProcessInstances: ProcessInstance[] = [
    {
      id: 'id',
      processId: 'processId1',
      endpoint: 'endpoint1',
      nodes: [createNodeObject('A'), createNodeObject('B')],
    },
    {
      id: 'name',
      processId: 'processId2',
      endpoint: 'endpoint2',
      nodes: [createNodeObject('C'), createNodeObject('D')],
    },
  ];

  const procName1Filter: FieldFilter = {
    field: 'processName',
    operator: FieldFilterOperatorEnum.Like,
    value: 'processName%',
  };
  const procId1Filter: FieldFilter = {
    field: 'processId',
    operator: FieldFilterOperatorEnum.Eq,
    value: 'processId1',
  };

  const logicalFilter: LogicalFilter = {
    operator: 'OR',
    filters: [procId1Filter, procName1Filter],
  };
  const mockQueryResult = { ProcessInstances: mockProcessInstances };

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
    } as any;

    (Client as jest.Mock).mockImplementation(() => mockClient);

    const wfInfo: WorkflowInfo = {
      id: 'wfinfo1',
      source: 'workflow info source',
    };

    loggerMock = {
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      child: jest.fn(),
    };
    dataIndexService = new DataIndexService('fakeUrl', loggerMock);
    // Create a spy for method1
    jest.spyOn(dataIndexService, 'fetchWorkflowInfo').mockResolvedValue(wfInfo);
    // Set up spies on the graphql utility functions
    buildGraphQlQuerySpy = jest.spyOn(
      buildGrahQLQueryUtils,
      'buildGraphQlQuery',
    );
    buildFilterConditionSpy = jest.spyOn(
      buildGrahQLFilterUtils,
      'buildFilterCondition',
    );

    // Clear mocks before each test
    jest.clearAllMocks();
  });
  it('should fetch instances with no parameters', async () => {
    // Given
    const whereClause = processIdNotNullCondition;
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult(mockQueryResult),
    );

    const expectedQueryArgs = createQueryArgs(
      'ProcessInstances',
      queryBody,
      whereClause,
    );

    // When
    const result = await dataIndexService.fetchInstances({});

    // Then
    expect(result).toBeDefined();
    expect(result).toStrictEqual(mockQueryResult.ProcessInstances);

    expect(buildGraphQlQuerySpy).toHaveBeenCalledTimes(1);
    expect(buildGraphQlQuerySpy).toHaveBeenCalledWith({
      type: 'ProcessInstances',
      queryBody,
      whereClause,
    });
    expect(buildFilterConditionSpy).not.toHaveBeenCalled();
    expect(mockClient.query).toHaveBeenCalled();
    expect(mockClient.query).toHaveBeenCalledWith(
      buildGrahQLQueryUtils.buildGraphQlQuery(expectedQueryArgs),
      {
        orderByInfo: {},
        paginationInfo: {},
      },
    );
  });

  it('should fetch instances with definitionIds', async () => {
    // Given
    const whereClause = `and: [{${processIdNotNullCondition}}, {${processIdDefinitions}}}]`;

    mockClient.query.mockResolvedValueOnce(
      mockOperationResult(mockQueryResult),
    );

    const expectedQueryArgs = createQueryArgs(
      'ProcessInstances',
      queryBody,
      whereClause,
    );
    // When
    const result = await dataIndexService.fetchInstances({
      definitionIds,
    });

    // Then
    expect(buildGraphQlQuerySpy).toHaveBeenCalledTimes(1);
    expect(buildGraphQlQuerySpy).toHaveBeenCalledWith({
      type: 'ProcessInstances',
      queryBody,
      whereClause,
      pagination: undefined,
    });
    expect(buildFilterConditionSpy).not.toHaveBeenCalled();
    expect(mockClient.query).toHaveBeenCalled();
    expect(mockClient.query).toHaveBeenCalledWith(
      buildGrahQLQueryUtils.buildGraphQlQuery(expectedQueryArgs),
      {
        orderByInfo: {},
        paginationInfo: {},
      },
    );
    expect(result).toBeDefined();
    expect(result).toStrictEqual(mockQueryResult.ProcessInstances);
  });

  it('should fetch instances with definitionIds and pagination', async () => {
    // Given
    const whereClause = `and: [{${processIdNotNullCondition}}, {${processIdDefinitions}}}]`;
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult(mockQueryResult),
    );

    const expectedQueryArgs = createQueryArgs(
      'ProcessInstances',
      queryBody,
      whereClause,
      pagination,
    );
    // When
    const result = await dataIndexService.fetchInstances({
      definitionIds,

      pagination,
    });

    // Then
    expect(result).toBeDefined();
    expect(result).toStrictEqual(mockQueryResult.ProcessInstances);

    expect(buildGraphQlQuerySpy).toHaveBeenCalledTimes(1);
    expect(buildGraphQlQuerySpy).toHaveBeenCalledWith({
      type: 'ProcessInstances',
      queryBody,
      whereClause,
      pagination,
    });
    expect(buildFilterConditionSpy).not.toHaveBeenCalled();
    expect(mockClient.query).toHaveBeenCalledTimes(1);
    expect(mockClient.query).toHaveBeenCalledWith(
      buildGrahQLQueryUtils.buildGraphQlQuery(expectedQueryArgs),
      {
        orderByInfo: {
          name: 'ASC',
        },
        paginationInfo: {
          limit: 10,
          offset: 0,
        },
      },
    );
  });

  it('should fetch instances with only filter', async () => {
    // Given

    mockClient.query
      .mockResolvedValueOnce(mockOperationResult(mockProcessInstanceArguments))
      .mockResolvedValueOnce(mockOperationResult(mockQueryResult));

    // When
    const result = await dataIndexService.fetchInstances({
      filter: logicalFilter,
    });

    expect(buildFilterConditionSpy).toHaveBeenCalledTimes(1);
    expect(buildFilterConditionSpy).toHaveBeenCalledWith(
      mockProcessInstanceIntrospection,
      'ProcessInstance',
      logicalFilter,
    );

    const createdFilter = buildFilterConditionSpy.mock.results[0].value;

    const whereClause = `and: [{${processIdNotNullCondition}}, {${createdFilter.clause}}]`;

    const expectedQueryArgs = createQueryArgs(
      'ProcessInstances',
      queryBody,
      whereClause,
      undefined,
      createdFilter,
    );

    // Then
    expect(result).toBeDefined();
    expect(result).toStrictEqual(mockQueryResult.ProcessInstances);
    expect(buildGraphQlQuerySpy).toHaveBeenCalledTimes(1);
    expect(buildGraphQlQuerySpy).toHaveBeenCalledWith({
      type: 'ProcessInstances',
      queryBody,
      whereClause,
      filterCondition: createdFilter,
    });

    const params = buildGrahQLQueryUtils.buildQueryParamVariable(
      undefined,
      createdFilter,
    );

    expect(mockClient.query).toHaveBeenCalledTimes(2);
    expect(mockClient.query).toHaveBeenCalledWith(
      buildGrahQLQueryUtils.buildGraphQlQuery(expectedQueryArgs),
      params,
    );
  });

  it('should fetch instances with definitionIds and filter', async () => {
    // Given
    mockClient.query
      .mockResolvedValueOnce(mockOperationResult(mockProcessInstanceArguments))
      .mockResolvedValueOnce(mockOperationResult(mockQueryResult));
    // When
    const result = await dataIndexService.fetchInstances({
      definitionIds,
      filter: logicalFilter,
    });

    // Then
    expect(buildFilterConditionSpy).toHaveBeenCalledTimes(1);
    expect(buildFilterConditionSpy).toHaveBeenCalledWith(
      mockProcessInstanceIntrospection,
      'ProcessInstance',
      logicalFilter,
    );

    const createdFilter = buildFilterConditionSpy.mock.results[0].value;

    const whereClause = `and: [{${processIdNotNullCondition}}, {${processIdDefinitions}}}, {${createdFilter.clause}}]`;

    const expectedQueryArgs = createQueryArgs(
      'ProcessInstances',
      queryBody,
      whereClause,
      undefined,
      createdFilter,
    );

    expect(buildGraphQlQuerySpy).toHaveBeenCalledTimes(1);
    expect(buildGraphQlQuerySpy).toHaveBeenCalledWith({
      type: 'ProcessInstances',
      queryBody,
      whereClause,
      filterCondition: createdFilter,
    });

    const params = buildGrahQLQueryUtils.buildQueryParamVariable(
      undefined,
      createdFilter,
    );

    expect(mockClient.query).toHaveBeenCalledTimes(2);
    expect(mockClient.query).toHaveBeenCalledWith(
      buildGrahQLQueryUtils.buildGraphQlQuery(expectedQueryArgs),
      params,
    );
    expect(result).toBeDefined();
    expect(result).toStrictEqual(mockQueryResult.ProcessInstances);
  });

  it('should fetch instances with definitionIds, pagination, and filter', async () => {
    // Given
    mockClient.query
      .mockResolvedValueOnce(mockOperationResult(mockProcessInstanceArguments))
      .mockResolvedValueOnce(mockOperationResult(mockQueryResult));

    // When
    const result = await dataIndexService.fetchInstances({
      definitionIds,
      pagination,
      filter: logicalFilter,
    });

    // Then
    expect(buildFilterConditionSpy).toHaveBeenCalledTimes(1);
    expect(buildFilterConditionSpy).toHaveBeenCalledWith(
      mockProcessInstanceIntrospection,
      'ProcessInstance',
      logicalFilter,
    );

    const createdFilter = buildFilterConditionSpy.mock.results[0].value;

    const whereClause = `and: [{${processIdNotNullCondition}}, {${processIdDefinitions}}}, {${createdFilter.clause}}]`;

    const expectedQueryArgs = createQueryArgs(
      'ProcessInstances',
      queryBody,
      whereClause,
      pagination,
      createdFilter,
    );

    expect(buildGraphQlQuerySpy).toHaveBeenCalledTimes(1);
    expect(buildGraphQlQuerySpy).toHaveBeenCalledWith({
      type: 'ProcessInstances',
      queryBody,
      whereClause,
      pagination,
      filterCondition: createdFilter,
    });

    const params = buildGrahQLQueryUtils.buildQueryParamVariable(
      pagination,
      createdFilter,
    );

    expect(mockClient.query).toHaveBeenCalledTimes(2);
    expect(mockClient.query).toHaveBeenCalledWith(
      buildGrahQLQueryUtils.buildGraphQlQuery(expectedQueryArgs),
      params,
    );
    expect(result).toBeDefined();
    expect(result).toStrictEqual(mockQueryResult.ProcessInstances);
  });
});

function createNodeObject(suffix: string): NodeInstance {
  return {
    id: `node${suffix}`,
    name: `node${suffix}`,
    enter: new Date('2024-08-01T14:30:00').toISOString(),
    type: 'NodeType',
    definitionId: `definitionId${suffix}`,
    nodeId: `nodeId${suffix}`,
    errorMessage: '',
    retrigger: false,
  };
}

// ---------------------------------------------------------------------------
// Helpers shared across new describe blocks
// ---------------------------------------------------------------------------

function createMockSetup() {
  const loggerMock: LoggerService = {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    child: jest.fn(),
  };
  const mockClient: jest.Mocked<Pick<Client, 'query'>> = { query: jest.fn() };
  (Client as jest.Mock).mockImplementation(() => mockClient);
  const dataIndexService = new DataIndexService('fakeUrl', loggerMock);
  return { loggerMock, mockClient, dataIndexService };
}

// ---------------------------------------------------------------------------
// fetchWorkflowInfo
// ---------------------------------------------------------------------------

describe('fetchWorkflowInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the first matching workflow info', async () => {
    const { mockClient, dataIndexService } = createMockSetup();
    const wfInfo: WorkflowInfo = { id: 'wf1', name: 'Workflow One' };
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult({ ProcessDefinitions: [wfInfo] }),
    );

    const result = await dataIndexService.fetchWorkflowInfo('wf1');

    expect(result).toEqual(wfInfo);
    expect(mockClient.query).toHaveBeenCalledTimes(1);
  });

  it('returns undefined when no definition is found', async () => {
    const { mockClient, dataIndexService } = createMockSetup();
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult({ ProcessDefinitions: [] }),
    );

    const result = await dataIndexService.fetchWorkflowInfo('unknown');

    expect(result).toBeUndefined();
  });

  it('throws when the client returns an error', async () => {
    const { mockClient, dataIndexService } = createMockSetup();
    const error = new Error('GraphQL error');
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult({} as any, error),
    );

    await expect(dataIndexService.fetchWorkflowInfo('wf1')).rejects.toThrow(
      'GraphQL error',
    );
  });
});

// ---------------------------------------------------------------------------
// fetchWorkflowServiceUrls
// ---------------------------------------------------------------------------

describe('fetchWorkflowServiceUrls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a record mapping definition ids to service urls, filtering missing urls', async () => {
    const { mockClient, dataIndexService } = createMockSetup();
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult({
        ProcessDefinitions: [
          { id: 'wf1', serviceUrl: 'http://svc1' },
          { id: 'wf2', serviceUrl: 'http://svc2' },
          { id: 'wf3' }, // no serviceUrl → filtered out
        ],
      }),
    );

    const result = await dataIndexService.fetchWorkflowServiceUrls();

    expect(result).toEqual({ wf1: 'http://svc1', wf2: 'http://svc2' });
  });

  it('returns an empty record when no definitions have a service url', async () => {
    const { mockClient, dataIndexService } = createMockSetup();
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult({ ProcessDefinitions: [] }),
    );

    const result = await dataIndexService.fetchWorkflowServiceUrls();

    expect(result).toEqual({});
  });

  it('throws when the client returns an error', async () => {
    const { mockClient, dataIndexService } = createMockSetup();
    const error = new Error('Network error');
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult({} as any, error),
    );

    await expect(dataIndexService.fetchWorkflowServiceUrls()).rejects.toThrow(
      'Network error',
    );
  });
});

// ---------------------------------------------------------------------------
// fetchWorkflowSource
// ---------------------------------------------------------------------------

describe('fetchWorkflowSource', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the source string for the given definition id', async () => {
    const { mockClient, dataIndexService } = createMockSetup();
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult({
        ProcessDefinitions: [{ id: 'wf1', source: 'yaml content here' }],
      }),
    );

    const result = await dataIndexService.fetchWorkflowSource('wf1');

    expect(result).toBe('yaml content here');
  });

  it('returns undefined when no definition is found', async () => {
    const { mockClient, dataIndexService } = createMockSetup();
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult({ ProcessDefinitions: [] }),
    );

    const result = await dataIndexService.fetchWorkflowSource('unknown');

    expect(result).toBeUndefined();
  });

  it('throws when the client returns an error', async () => {
    const { mockClient, dataIndexService } = createMockSetup();
    const error = new Error('GraphQL error');
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult({} as any, error),
    );

    await expect(dataIndexService.fetchWorkflowSource('wf1')).rejects.toThrow(
      'GraphQL error',
    );
  });
});

// ---------------------------------------------------------------------------
// fetchInstanceVariables
// ---------------------------------------------------------------------------

describe('fetchInstanceVariables', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the parsed variables for the given instance id', async () => {
    const { mockClient, dataIndexService } = createMockSetup();
    const variables = { greeting: 'hello', count: 3 };
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult({
        ProcessInstances: [{ variables }],
      }),
    );

    const result = await dataIndexService.fetchInstanceVariables('inst1');

    expect(result).toEqual(variables);
  });

  it('returns undefined when no instance is found', async () => {
    const { mockClient, dataIndexService } = createMockSetup();
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult({ ProcessInstances: [] }),
    );

    const result = await dataIndexService.fetchInstanceVariables('missing');

    expect(result).toBeUndefined();
  });

  it('throws when the client returns an error', async () => {
    const { mockClient, dataIndexService } = createMockSetup();
    const error = new Error('Query failed');
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult({} as any, error),
    );

    await expect(
      dataIndexService.fetchInstanceVariables('inst1'),
    ).rejects.toThrow('Query failed');
  });
});

// ---------------------------------------------------------------------------
// fetchDefinitionIdByInstanceId
// ---------------------------------------------------------------------------

describe('fetchDefinitionIdByInstanceId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the processId for the given instance id', async () => {
    const { mockClient, dataIndexService } = createMockSetup();
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult({
        ProcessInstances: [{ processId: 'wf1' }],
      }),
    );

    const result = await dataIndexService.fetchDefinitionIdByInstanceId('i1');

    expect(result).toBe('wf1');
  });

  it('returns undefined when no instance is found', async () => {
    const { mockClient, dataIndexService } = createMockSetup();
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult({ ProcessInstances: [] }),
    );

    const result =
      await dataIndexService.fetchDefinitionIdByInstanceId('missing');

    expect(result).toBeUndefined();
  });

  it('throws when the client returns an error', async () => {
    const { mockClient, dataIndexService } = createMockSetup();
    const error = new Error('Query error');
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult({} as any, error),
    );

    await expect(
      dataIndexService.fetchDefinitionIdByInstanceId('i1'),
    ).rejects.toThrow('Query error');
  });
});

// ---------------------------------------------------------------------------
// fetchDefinitionIdsFromInstances
// ---------------------------------------------------------------------------

describe('fetchDefinitionIdsFromInstances', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns distinct processIds from matching instances', async () => {
    const { mockClient, dataIndexService } = createMockSetup();

    // First call: introspection for ProcessInstance argument types
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult(mockProcessInstanceArguments),
    );
    // Second call: actual data query
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult({
        ProcessInstances: [
          { processId: 'wf1' },
          { processId: 'wf1' }, // duplicate — should appear once
          { processId: 'wf2' },
        ],
      }),
    );

    const result = await dataIndexService.fetchDefinitionIdsFromInstances({
      targetEntity: 'component:default/my-service',
    });

    expect(result).toEqual(['wf1', 'wf2']);
  });

  it('returns an empty array when no instances match', async () => {
    const { mockClient, dataIndexService } = createMockSetup();
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult(mockProcessInstanceArguments),
    );
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult({ ProcessInstances: [] }),
    );

    const result = await dataIndexService.fetchDefinitionIdsFromInstances({
      targetEntity: 'component:default/unknown',
    });

    expect(result).toEqual([]);
  });

  it('throws when the client returns an error on the data query', async () => {
    const { mockClient, dataIndexService } = createMockSetup();
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult(mockProcessInstanceArguments),
    );
    const error = new Error('Data fetch error');
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult({} as any, error),
    );

    await expect(
      dataIndexService.fetchDefinitionIdsFromInstances({
        targetEntity: 'component:default/my-service',
      }),
    ).rejects.toThrow('Data fetch error');
  });
});

// ---------------------------------------------------------------------------
// fetchInstancesByDefinitionId
// ---------------------------------------------------------------------------

describe('fetchInstancesByDefinitionId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns process instances for the given definition id', async () => {
    const { mockClient, dataIndexService } = createMockSetup();
    const instances: ProcessInstance[] = [
      {
        id: 'inst1',
        processId: 'wf1',
        nodes: [],
        state: 'COMPLETED' as any,
        start: '2024-01-01T00:00:00.000Z',
      },
    ];
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult({ ProcessInstances: instances }),
    );

    const result = await dataIndexService.fetchInstancesByDefinitionId({
      definitionId: 'wf1',
      limit: 10,
      offset: 0,
    });

    expect(result).toEqual(instances);
    expect(mockClient.query).toHaveBeenCalledTimes(1);
  });

  it('passes targetEntity variable when provided', async () => {
    const { mockClient, dataIndexService } = createMockSetup();
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult({ ProcessInstances: [] }),
    );

    await dataIndexService.fetchInstancesByDefinitionId({
      definitionId: 'wf1',
      limit: 5,
      offset: 0,
      targetEntity: 'component:default/my-svc',
    });

    const [, variables] = mockClient.query.mock.calls[0];
    expect(variables).toMatchObject({
      definitionId: 'wf1',
      targetEntity: 'component:default/my-svc',
    });
  });

  it('throws when the client returns an error', async () => {
    const { mockClient, dataIndexService } = createMockSetup();
    const error = new Error('Query error');
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult({} as any, error),
    );

    await expect(
      dataIndexService.fetchInstancesByDefinitionId({
        definitionId: 'wf1',
        limit: 10,
        offset: 0,
      }),
    ).rejects.toThrow('Query error');
  });
});

// ---------------------------------------------------------------------------
// fetchInstance
// ---------------------------------------------------------------------------

describe('fetchInstance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(fromWorkflowSource)
      .mockReturnValue({ id: 'wf1', description: 'Mocked description' } as any);
  });

  it('returns the process instance enriched with workflow description', async () => {
    const { mockClient, dataIndexService } = createMockSetup();
    const instance: ProcessInstance = {
      id: 'inst1',
      processId: 'wf1',
      nodes: [createNodeObject('A')],
    };
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult({ ProcessInstances: [instance] }),
    );
    jest
      .spyOn(dataIndexService, 'fetchWorkflowInfo')
      .mockResolvedValue({ id: 'wf1', source: 'id: wf1' });

    const result = await dataIndexService.fetchInstance('inst1');

    expect(result).toBeDefined();
    expect(result!.id).toBe('inst1');
    expect(result!.description).toBe('Mocked description');
  });

  it('returns undefined when no instance is found', async () => {
    const { mockClient, dataIndexService } = createMockSetup();
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult({ ProcessInstances: [] }),
    );

    const result = await dataIndexService.fetchInstance('missing');

    expect(result).toBeUndefined();
  });

  it('throws when the workflow source is missing', async () => {
    const { mockClient, dataIndexService } = createMockSetup();
    const instance: ProcessInstance = {
      id: 'inst1',
      processId: 'wf1',
      nodes: [],
    };
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult({ ProcessInstances: [instance] }),
    );
    jest
      .spyOn(dataIndexService, 'fetchWorkflowInfo')
      .mockResolvedValue(undefined);

    await expect(dataIndexService.fetchInstance('inst1')).rejects.toThrow(
      'Workflow definition is required to fetch instance inst1',
    );
  });

  it('throws when the client returns an error', async () => {
    const { mockClient, dataIndexService } = createMockSetup();
    const error = new Error('Client error');
    mockClient.query.mockResolvedValueOnce(
      mockOperationResult({} as any, error),
    );

    await expect(dataIndexService.fetchInstance('inst1')).rejects.toThrow(
      'Client error',
    );
  });
});
