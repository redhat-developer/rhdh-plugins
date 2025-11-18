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
import { CommitsList } from '../CommitsList';
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
import { usePipelineruns } from '../../../../hooks/resources/usePipelineruns';
import { useComponents } from '../../../../hooks/resources/useComponents';
import { useFilteredPaginatedData } from '../../../../hooks/useFilteredPaginatedData';
import { getCommitsFromPLRs } from '../../../../utils/commits';
import { useCommitFilters } from '../useCommitFilters';
import { Commit } from '../../../../utils/pipeline-runs';

// Mock the hooks
jest.mock('../../../../hooks/resources/usePipelineruns');
jest.mock('../../../../hooks/resources/useComponents');
jest.mock('../../../../hooks/useFilteredPaginatedData');
jest.mock('../../../../utils/commits');
jest.mock('../useCommitFilters');
jest.mock('@backstage/plugin-catalog-react', () => ({
  ...jest.requireActual('@backstage/plugin-catalog-react'),
  useEntity: jest.fn(),
}));

const mockUsePipelineruns = usePipelineruns as jest.MockedFunction<
  typeof usePipelineruns
>;
const mockUseComponents = useComponents as jest.MockedFunction<
  typeof useComponents
>;
const mockUseFilteredPaginatedData =
  useFilteredPaginatedData as jest.MockedFunction<
    typeof useFilteredPaginatedData
  >;
const mockGetCommitsFromPLRs = getCommitsFromPLRs as jest.MockedFunction<
  typeof getCommitsFromPLRs
>;
const mockUseCommitFilters = useCommitFilters as jest.MockedFunction<
  typeof useCommitFilters
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

const renderCommitsList = async () =>
  renderInTestApp(
    <TestApiProvider
      apis={[
        [catalogApiRef, mockCatalogApi],
        [errorApiRef, mockErrorApi],
        [translationApiRef, mockApis.translation()],
      ]}
    >
      <EntityProvider entity={mockEntity}>
        <CommitsList hasSubcomponents />
      </EntityProvider>
    </TestApiProvider>,
  );

describe('CommitsList', () => {
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

    mockUseComponents.mockReturnValue({
      data: [],
      loaded: true,
      isFetching: false,
      error: undefined,
      clusterErrors: undefined,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    mockGetCommitsFromPLRs.mockReturnValue([]);

    mockUseFilteredPaginatedData.mockReturnValue({
      filteredData: [],
      paginatedData: [],
      totalCount: 0,
      totalPages: 0,
    });

    mockUseCommitFilters.mockReturnValue({
      uniqueSubcomponents: [],
      uniqueClusters: [],
      uniquePipelineRunStatuses: [],
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

    await renderCommitsList();

    await waitFor(() => {
      expect(screen.getByText('Commits')).toBeInTheDocument();
    });
  });

  it('should render commits list when data is loaded', async () => {
    const mockCommits: Commit[] = [
      {
        kind: 'PipelineRun',
        apiVersion: 'v1',
        sha: 'abc123',
        shaTitle: 'Test commit',
        application: 'app1',
        subcomponent: { name: 'subcomp1' },
        cluster: { name: 'cluster1' },
        pipelineRuns: [],
        metadata: {
          name: 'commit1',
          uid: 'id1',
          annotations: {},
        },
        shaURL: '',
        components: [],
        branch: '',
        isPullRequest: false,
      },
    ];

    mockGetCommitsFromPLRs.mockReturnValue(mockCommits as any);

    mockUseFilteredPaginatedData.mockReturnValue({
      filteredData: mockCommits,
      paginatedData: mockCommits,
      totalCount: 1,
      totalPages: 1,
    });

    mockUseCommitFilters.mockReturnValue({
      uniqueSubcomponents: ['subcomp1'],
      uniqueClusters: ['cluster1'],
      uniquePipelineRunStatuses: ['Succeeded'],
    });

    await renderCommitsList();

    await waitFor(() => {
      expect(screen.getByText('Commits')).toBeInTheDocument();
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

    await renderCommitsList();

    await waitFor(() => {
      expect(screen.getByText('Commits')).toBeInTheDocument();
    });
  });

  it('should show error panel when general error occurs', async () => {
    mockUsePipelineruns.mockReturnValue({
      data: [],
      loaded: true,
      isFetching: false,
      error: 'Failed to fetch commits',
      clusterErrors: undefined,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    mockUseComponents.mockReturnValue({
      data: [],
      loaded: true,
      isFetching: false,
      error: undefined,
      clusterErrors: undefined,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    await renderCommitsList();

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch commits')).toBeInTheDocument();
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

    mockUseComponents.mockReturnValue({
      data: [],
      loaded: true,
      isFetching: false,
      error: undefined,
      clusterErrors: undefined,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    mockGetCommitsFromPLRs.mockReturnValue([]);

    mockUseFilteredPaginatedData.mockReturnValue({
      filteredData: [],
      paginatedData: [],
      totalCount: 0,
      totalPages: 0,
    });

    await renderCommitsList();

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

    mockUseComponents.mockReturnValue({
      data: [],
      loaded: true,
      isFetching: false,
      error: undefined,
      clusterErrors: undefined,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    mockGetCommitsFromPLRs.mockReturnValue([]);

    mockUseFilteredPaginatedData.mockReturnValue({
      filteredData: [],
      paginatedData: [],
      totalCount: 0,
      totalPages: 0,
    });

    await renderCommitsList();

    await waitFor(() => {
      expect(screen.getByText('No commits found')).toBeInTheDocument();
      expect(
        screen.getByText('No commits match the current filters.'),
      ).toBeInTheDocument();
    });
  });
});
