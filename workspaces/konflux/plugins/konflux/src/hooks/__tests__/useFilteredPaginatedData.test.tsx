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

import { renderHook } from '@testing-library/react';
import { useFilteredPaginatedData } from '../useFilteredPaginatedData';
import {
  K8sResourceCommonWithClusterInfo,
  runStatus,
  PipelineRunLabel,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import * as konfluxCommon from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import * as pipelineRunsUtils from '../../utils/pipeline-runs';

jest.mock('@red-hat-developer-hub/backstage-plugin-konflux-common', () => ({
  ...jest.requireActual(
    '@red-hat-developer-hub/backstage-plugin-konflux-common',
  ),
  getApplicationFromResource: jest.fn(),
}));

jest.mock('../../utils/pipeline-runs', () => ({
  ...jest.requireActual('../../utils/pipeline-runs'),
  pipelineRunStatus: jest.fn(),
}));

const mockGetApplicationFromResource =
  konfluxCommon.getApplicationFromResource as jest.MockedFunction<
    typeof konfluxCommon.getApplicationFromResource
  >;
const mockPipelineRunStatus =
  pipelineRunsUtils.pipelineRunStatus as jest.MockedFunction<
    typeof pipelineRunsUtils.pipelineRunStatus
  >;

type MockResource = K8sResourceCommonWithClusterInfo & {
  metadata: {
    name: string;
    namespace?: string;
    labels?: Record<string, string>;
  };
  cluster: { name: string };
  subcomponent?: { name: string };
  pipelineRuns?: any[];
};

const createMockResource = (
  name: string,
  cluster: string = 'cluster1',
  subcomponent?: string,
): MockResource => ({
  apiVersion: 'v1',
  apiGroup: 'test',
  kind: 'Resource',
  metadata: {
    name,
    namespace: 'namespace1',
  },
  cluster: { name: cluster },
  subcomponent: { name: subcomponent ?? '' },
});

describe('useFilteredPaginatedData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApplicationFromResource.mockReturnValue(undefined);
    mockPipelineRunStatus.mockReturnValue(runStatus.Succeeded);
  });

  it('should return empty arrays when data is undefined', () => {
    const { result } = renderHook(() =>
      useFilteredPaginatedData(undefined, {}, { page: 0, rowsPerPage: 10 }),
    );

    expect(result.current.filteredData).toEqual([]);
    expect(result.current.paginatedData).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.totalPages).toBe(0);
  });

  it('should return all data when no filters are applied', () => {
    const data = [
      createMockResource('item1'),
      createMockResource('item2'),
      createMockResource('item3'),
    ];

    const { result } = renderHook(() =>
      useFilteredPaginatedData(data, {}, { page: 0, rowsPerPage: 10 }),
    );

    expect(result.current.filteredData).toEqual(data);
    expect(result.current.paginatedData).toEqual(data);
    expect(result.current.totalCount).toBe(3);
    expect(result.current.totalPages).toBe(1);
  });

  it('should filter by nameSearch', () => {
    const data = [
      createMockResource('amazing-app1'),
      createMockResource('maybe-something-else'),
      createMockResource('app2'),
    ];

    const { result } = renderHook(() =>
      useFilteredPaginatedData(
        data,
        { nameSearch: 'ap' },
        { page: 0, rowsPerPage: 10 },
      ),
    );

    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredData[0].metadata.name).toBe('amazing-app1');
    expect(result.current.filteredData[1].metadata.name).toBe('app2');
  });

  it('should filter by nameSearch case-insensitively', () => {
    const data = [
      createMockResource('amazing-app1'),
      createMockResource('maybe-something-else'),
      createMockResource('app2'),
    ];

    const { result } = renderHook(() =>
      useFilteredPaginatedData(
        data,
        { nameSearch: 'APP' },
        { page: 0, rowsPerPage: 10 },
      ),
    );

    expect(result.current.filteredData).toHaveLength(2);
  });

  it('should filter by cluster', () => {
    const data = [
      createMockResource('item1', 'cluster1'),
      createMockResource('item2', 'cluster2'),
      createMockResource('item3', 'cluster1'),
    ];

    const { result } = renderHook(() =>
      useFilteredPaginatedData(
        data,
        { cluster: 'cluster1' },
        { page: 0, rowsPerPage: 10 },
      ),
    );

    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredData[0].cluster.name).toBe('cluster1');
    expect(result.current.filteredData[1].cluster.name).toBe('cluster1');
  });

  it('should filter by subcomponent', () => {
    const data = [
      createMockResource('item1', 'cluster1', 'sub1'),
      createMockResource('item2', 'cluster1', 'sub2'),
      createMockResource('item3', 'cluster1', 'sub1'),
    ];

    const { result } = renderHook(() =>
      useFilteredPaginatedData(
        data,
        { subcomponent: 'sub1' },
        { page: 0, rowsPerPage: 10 },
      ),
    );

    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredData[0].subcomponent?.name).toBe('sub1');
    expect(result.current.filteredData[1].subcomponent?.name).toBe('sub1');
  });

  it('should filter by application', () => {
    const data = [
      createMockResource('item1'),
      createMockResource('item2'),
      createMockResource('item3'),
    ];

    mockGetApplicationFromResource
      .mockReturnValueOnce('app1')
      .mockReturnValueOnce('app2')
      .mockReturnValueOnce('app1');

    const { result } = renderHook(() =>
      useFilteredPaginatedData(
        data,
        { application: 'app1' },
        { page: 0, rowsPerPage: 10 },
      ),
    );

    expect(result.current.filteredData).toHaveLength(2);
  });

  it('should filter by pipelineRunStatus', () => {
    const data = [
      createMockResource('item1'),
      createMockResource('item2'),
      createMockResource('item3'),
    ];

    mockPipelineRunStatus
      .mockReturnValueOnce(runStatus.Succeeded)
      .mockReturnValueOnce(runStatus.Failed)
      .mockReturnValueOnce(runStatus.Succeeded);

    const { result } = renderHook(() =>
      useFilteredPaginatedData(
        data,
        { pipelineRunStatus: runStatus.Succeeded },
        { page: 0, rowsPerPage: 10 },
      ),
    );

    expect(result.current.filteredData).toHaveLength(2);
  });

  it('should filter by pipelineRunType', () => {
    const data = [
      {
        ...createMockResource('item1'),
        metadata: {
          name: 'item1',
          labels: { [PipelineRunLabel.PIPELINE_TYPE]: 'build' },
        },
      },
      {
        ...createMockResource('item2'),
        metadata: {
          name: 'item2',
          labels: { [PipelineRunLabel.PIPELINE_TYPE]: 'test' },
        },
      },
      {
        ...createMockResource('item3'),
        metadata: {
          name: 'item3',
          labels: { [PipelineRunLabel.PIPELINE_TYPE]: 'build' },
        },
      },
    ];

    const { result } = renderHook(() =>
      useFilteredPaginatedData(
        data,
        { pipelineRunType: 'build' },
        { page: 0, rowsPerPage: 10 },
      ),
    );

    expect(result.current.filteredData).toHaveLength(2);
  });

  it('should filter by commitStatus', () => {
    const data = [
      {
        ...createMockResource('item1'),
        pipelineRuns: [{ id: 'plr1' }],
      },
      {
        ...createMockResource('item2'),
        pipelineRuns: [{ id: 'plr2' }],
      },
      {
        ...createMockResource('item3'),
        pipelineRuns: [{ id: 'plr3' }],
      },
    ];

    mockPipelineRunStatus
      .mockReturnValueOnce(runStatus.Succeeded)
      .mockReturnValueOnce(runStatus.Failed)
      .mockReturnValueOnce(runStatus.Succeeded);

    const { result } = renderHook(() =>
      useFilteredPaginatedData(
        data,
        { commitStatus: runStatus.Succeeded },
        { page: 0, rowsPerPage: 10 },
      ),
    );

    expect(result.current.filteredData).toHaveLength(2);
  });

  it('should apply multiple filters', () => {
    const data = [
      createMockResource('app1', 'cluster1', 'sub1'),
      createMockResource('app2', 'cluster1', 'sub2'),
      createMockResource('app3', 'cluster2', 'sub1'),
    ];

    mockGetApplicationFromResource.mockReturnValue('app1');

    const { result } = renderHook(() =>
      useFilteredPaginatedData(
        data,
        { nameSearch: 'ap', cluster: 'cluster1', subcomponent: 'sub1' },
        { page: 0, rowsPerPage: 10 },
      ),
    );

    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].metadata.name).toBe('app1');
  });

  it('should paginate data correctly', () => {
    const data = Array.from({ length: 25 }, (_, i) =>
      createMockResource(`item${i + 1}`),
    );

    const { result } = renderHook(() =>
      useFilteredPaginatedData(data, {}, { page: 0, rowsPerPage: 10 }),
    );

    expect(result.current.paginatedData).toHaveLength(10);
    expect(result.current.totalCount).toBe(25);
    expect(result.current.totalPages).toBe(3);
  });

  it('should return correct page of data', () => {
    const data = Array.from({ length: 25 }, (_, i) =>
      createMockResource(`item${i + 1}`),
    );

    const { result } = renderHook(() =>
      useFilteredPaginatedData(data, {}, { page: 1, rowsPerPage: 10 }),
    );

    expect(result.current.paginatedData).toHaveLength(10);
    expect(result.current.paginatedData[0].metadata.name).toBe('item11');
  });

  it('should return last page correctly', () => {
    const data = Array.from({ length: 25 }, (_, i) =>
      createMockResource(`item${i + 1}`),
    );

    const { result } = renderHook(() =>
      useFilteredPaginatedData(data, {}, { page: 2, rowsPerPage: 10 }),
    );

    expect(result.current.paginatedData).toHaveLength(5);
    expect(result.current.totalPages).toBe(3);
  });

  it('should handle empty filtered results', () => {
    const data = [
      createMockResource('item1', 'cluster1'),
      createMockResource('item2', 'cluster2'),
    ];

    const { result } = renderHook(() =>
      useFilteredPaginatedData(
        data,
        { cluster: 'cluster3' },
        { page: 0, rowsPerPage: 10 },
      ),
    );

    expect(result.current.filteredData).toEqual([]);
    expect(result.current.paginatedData).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.totalPages).toBe(0);
  });

  it('should handle items without metadata name', () => {
    const data = [
      { ...createMockResource('item1'), metadata: {} as any },
      createMockResource('item2'),
    ];

    const { result } = renderHook(() =>
      useFilteredPaginatedData(
        data,
        { nameSearch: 'item' },
        { page: 0, rowsPerPage: 10 },
      ),
    );

    expect(result.current.filteredData).toHaveLength(1);
  });

  it('should handle items without cluster', () => {
    const data = [
      { ...createMockResource('item1'), cluster: undefined as any },
      createMockResource('item2', 'cluster1'),
    ];

    const { result } = renderHook(() =>
      useFilteredPaginatedData(
        data,
        { cluster: 'cluster1' },
        { page: 0, rowsPerPage: 10 },
      ),
    );

    expect(result.current.filteredData).toHaveLength(1);
  });

  it('should handle items without subcomponent', () => {
    const data = [
      createMockResource('item1'),
      createMockResource('item2', 'cluster1', 'sub1'),
    ];

    const { result } = renderHook(() =>
      useFilteredPaginatedData(
        data,
        { subcomponent: 'sub1' },
        { page: 0, rowsPerPage: 10 },
      ),
    );

    expect(result.current.filteredData).toHaveLength(1);
  });

  it('should handle items without pipelineRuns for commitStatus filter', () => {
    const data = [
      createMockResource('item1'),
      {
        ...createMockResource('item2'),
        pipelineRuns: [{ id: 'plr1' }],
      },
    ];

    mockPipelineRunStatus
      .mockReturnValueOnce(runStatus.Pending)
      .mockReturnValueOnce(runStatus.Succeeded);

    const { result } = renderHook(() =>
      useFilteredPaginatedData(
        data,
        { commitStatus: runStatus.Succeeded },
        { page: 0, rowsPerPage: 10 },
      ),
    );

    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].metadata.name).toBe('item2');
  });
});
