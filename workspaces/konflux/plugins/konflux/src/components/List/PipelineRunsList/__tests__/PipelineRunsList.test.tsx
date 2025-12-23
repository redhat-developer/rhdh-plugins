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

import { screen, waitFor } from '@testing-library/react';
import { PipelineRunsList } from '../PipelineRunsList';
import {
  TestApiProvider,
  renderInTestApp,
  mockApis,
} from '@backstage/test-utils';
import {
  CatalogApi,
  catalogApiRef,
  EntityProvider,
  useEntity,
} from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';
import { errorApiRef } from '@backstage/core-plugin-api';
import { translationApiRef } from '@backstage/core-plugin-api/alpha';

// Mock the hooks
jest.mock('../../../../hooks/resources/usePipelineruns');
jest.mock('../../../../hooks/useFilteredPaginatedData');
jest.mock('../usePipelineRunFilters');
jest.mock('@backstage/plugin-catalog-react', () => ({
  ...jest.requireActual('@backstage/plugin-catalog-react'),
  useEntity: jest.fn(),
}));

import { usePipelineruns } from '../../../../hooks/resources/usePipelineruns';
import { useFilteredPaginatedData } from '../../../../hooks/useFilteredPaginatedData';
import { usePipelineRunFilters } from '../usePipelineRunFilters';
import { PipelineRunResource } from '@red-hat-developer-hub/backstage-plugin-konflux-common';

const mockUsePipelineruns = usePipelineruns as jest.MockedFunction<
  typeof usePipelineruns
>;
const mockUseFilteredPaginatedData =
  useFilteredPaginatedData as jest.MockedFunction<
    typeof useFilteredPaginatedData
  >;
const mockUsePipelineRunFilters = usePipelineRunFilters as jest.MockedFunction<
  typeof usePipelineRunFilters
>;
const mockUseEntity = useEntity as jest.MockedFunction<typeof useEntity>;

const mockEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'test-entity',
    namespace: 'default',
  },
};

const mockCatalogApi: Partial<CatalogApi> = {
  getEntities: jest.fn().mockResolvedValue({ items: [] }),
  getEntityByRef: jest.fn().mockResolvedValue(mockEntity),
};

const mockErrorApi = {
  post: jest.fn(),
  error$: jest.fn(),
};

const renderPIpelineRunsList = async (hasSubcomponents = false) =>
  await renderInTestApp(
    <TestApiProvider
      apis={[
        [catalogApiRef, mockCatalogApi],
        [errorApiRef, mockErrorApi],
        [translationApiRef, mockApis.translation()],
      ]}
    >
      <EntityProvider entity={mockEntity}>
        <PipelineRunsList hasSubcomponents={hasSubcomponents} />
      </EntityProvider>
    </TestApiProvider>,
  );

describe('PipelineRunsList', () => {
  beforeEach(() => {
    mockUseEntity.mockReturnValue({
      entity: mockEntity,
    });

    mockUsePipelineruns.mockReturnValue({
      data: [],
      loaded: true,
      isFetching: false,
      error: undefined,
      clusterErrors: undefined,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    mockUseFilteredPaginatedData.mockReturnValue({
      filteredData: [],
      paginatedData: [],
      totalCount: 0,
      totalPages: 0,
    });

    mockUsePipelineRunFilters.mockReturnValue({
      uniqueSubcomponents: [],
      uniqueClusters: [],
      uniqueApplications: [],
      uniquePipelineRunStatuses: [],
      uniquePipelineRunTypes: [],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state when data is not loaded', async () => {
    mockUsePipelineruns.mockReturnValue({
      data: [],
      loaded: false,
      isFetching: false,
      error: undefined,
      clusterErrors: undefined,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    await renderPIpelineRunsList(false);

    expect(screen.getByText('Pipeline Runs')).toBeInTheDocument();
  });

  it('should render pipeline runs list when data is loaded', async () => {
    const mockPipelineRuns: PipelineRunResource[] = [
      {
        apiVersion: 'v1',
        apiGroup: 'tekton.dev',
        kind: 'PipelineRun',
        metadata: {
          name: 'plr1',
          namespace: 'ns1',
          labels: {
            'appstudio.redhat.com/pipeline_type': 'build',
          },
        },
        subcomponent: { name: 'subcomp1' },
        cluster: { name: 'cluster1' },
      },
    ];

    mockUsePipelineruns.mockReturnValue({
      data: mockPipelineRuns,
      loaded: true,
      isFetching: false,
      error: undefined,
      clusterErrors: undefined,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    mockUseFilteredPaginatedData.mockReturnValue({
      filteredData: mockPipelineRuns,
      paginatedData: mockPipelineRuns,
      totalCount: 1,
      totalPages: 1,
    });

    mockUsePipelineRunFilters.mockReturnValue({
      uniqueSubcomponents: ['subcomp1'],
      uniqueClusters: ['cluster1'],
      uniqueApplications: ['app1'],
      uniquePipelineRunStatuses: ['Succeeded'],
      uniquePipelineRunTypes: ['build'],
    });

    await renderPIpelineRunsList(false);

    await waitFor(() => {
      expect(screen.getByText('Pipeline Runs')).toBeInTheDocument();
    });
  });

  it('should render with subcomponents when hasSubcomponents is true', async () => {
    mockUsePipelineRunFilters.mockReturnValue({
      uniqueSubcomponents: ['subcomp1'],
      uniqueClusters: ['cluster1'],
      uniqueApplications: ['app1'],
      uniquePipelineRunStatuses: ['Succeeded'],
      uniquePipelineRunTypes: ['build'],
    });

    await renderPIpelineRunsList(true);

    await waitFor(() => {
      expect(screen.getByText('Pipeline Runs')).toBeInTheDocument();
    });
  });

  it('should render without subcomponents when hasSubcomponents is false', async () => {
    mockUsePipelineRunFilters.mockReturnValue({
      uniqueSubcomponents: [],
      uniqueClusters: ['cluster1'],
      uniqueApplications: ['app1'],
      uniquePipelineRunStatuses: ['Succeeded'],
      uniquePipelineRunTypes: ['build'],
    });

    await renderPIpelineRunsList(false);

    await waitFor(() => {
      expect(screen.getByText('Pipeline Runs')).toBeInTheDocument();
    });
  });

  it('should show fetching state', async () => {
    mockUsePipelineruns.mockReturnValue({
      data: [],
      loaded: true,
      isFetching: true,
      error: undefined,
      clusterErrors: undefined,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    await renderPIpelineRunsList(false);

    await waitFor(() => {
      expect(screen.getByText('Pipeline Runs')).toBeInTheDocument();
    });
  });

  it('should show error panel when general error occurs', async () => {
    mockUsePipelineruns.mockReturnValue({
      data: [],
      loaded: true,
      isFetching: false,
      error: 'Failed to fetch pipeline runs',
      clusterErrors: undefined,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    await renderPIpelineRunsList(false);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to fetch pipeline runs'),
      ).toBeInTheDocument();
    });
  });

  it('should show cluster error panel when all clusters failed', async () => {
    const mockClusterErrors = [
      {
        cluster: 'cluster1',
        namespace: 'namespace1',
        errorType: 'Forbidden',
        message: 'Access denied',
        statusCode: 403,
      },
    ];

    mockUsePipelineruns.mockReturnValue({
      data: [],
      loaded: true,
      isFetching: false,
      error: undefined,
      clusterErrors: mockClusterErrors,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    mockUseFilteredPaginatedData.mockReturnValue({
      filteredData: [],
      paginatedData: [],
      totalCount: 0,
      totalPages: 0,
    });

    await renderPIpelineRunsList(false);

    await waitFor(() => {
      expect(
        screen.getByText(
          'Warning: Failed to retrieve resources from all clusters',
        ),
      ).toBeInTheDocument();
      expect(screen.getByText('Access denied')).toBeInTheDocument();
    });
  });

  it('should show empty state when no data matches filters', async () => {
    mockUsePipelineruns.mockReturnValue({
      data: [],
      loaded: true,
      isFetching: false,
      error: undefined,
      clusterErrors: undefined,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    mockUseFilteredPaginatedData.mockReturnValue({
      filteredData: [],
      paginatedData: [],
      totalCount: 0,
      totalPages: 0,
    });

    await renderPIpelineRunsList(false);

    await waitFor(() => {
      expect(screen.getByText('No pipeline runs found')).toBeInTheDocument();
      expect(
        screen.getByText('No pipeline runs match the current filters.'),
      ).toBeInTheDocument();
    });
  });
});
