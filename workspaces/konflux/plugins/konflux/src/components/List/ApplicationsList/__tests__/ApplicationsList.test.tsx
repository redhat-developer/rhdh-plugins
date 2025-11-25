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
import { ApplicationsList } from '../ApplicationsList';
import {
  TestApiProvider,
  renderInTestApp,
  mockApis,
} from '@backstage/test-utils';
import {
  catalogApiRef,
  EntityProvider,
  CatalogApi,
  useEntity,
} from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';
import { errorApiRef } from '@backstage/core-plugin-api';
import { translationApiRef } from '@backstage/core-plugin-api/alpha';
import { useApplications } from '../../../../hooks/resources/useApplications';
import { useFilteredPaginatedData } from '../../../../hooks/useFilteredPaginatedData';
import { useApplicationFilters } from '../useApplicationFilters';

// Mock the hooks
jest.mock('../../../../hooks/resources/useApplications');
jest.mock('../../../../hooks/useFilteredPaginatedData');
jest.mock('../useApplicationFilters');
jest.mock('@backstage/plugin-catalog-react', () => ({
  ...jest.requireActual('@backstage/plugin-catalog-react'),
  useEntity: jest.fn(),
  useRelatedEntities: jest.fn().mockReturnValue({
    entities: [],
    loading: false,
    error: undefined,
  }),
}));

const mockUseApplications = useApplications as jest.MockedFunction<
  typeof useApplications
>;
const mockUseFilteredPaginatedData =
  useFilteredPaginatedData as jest.MockedFunction<
    typeof useFilteredPaginatedData
  >;
const mockUseApplicationFilters = useApplicationFilters as jest.MockedFunction<
  typeof useApplicationFilters
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

const renderApplicationsList = async (hasSubcomponents?: boolean) =>
  await renderInTestApp(
    <TestApiProvider
      apis={[
        [catalogApiRef, mockCatalogApi],
        [errorApiRef, mockErrorApi],
        [translationApiRef, mockApis.translation()],
      ]}
    >
      <EntityProvider entity={mockEntity}>
        <ApplicationsList hasSubcomponents={hasSubcomponents} />
      </EntityProvider>
    </TestApiProvider>,
  );

describe('ApplicationsList', () => {
  beforeEach(() => {
    mockUseEntity.mockReturnValue({
      entity: mockEntity,
    });

    mockUseApplications.mockReturnValue({
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

    mockUseApplicationFilters.mockReturnValue({
      uniqueSubcomponents: [],
      uniqueClusters: [],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state when data is not loaded', async () => {
    mockUseApplications.mockReturnValue({
      data: [],
      loaded: false,
      isFetching: false,
      error: undefined,
      clusterErrors: undefined,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    await renderApplicationsList();

    // Progress component should be rendered
    expect(screen.queryByText('Applications')).toBeInTheDocument();
  });

  it('should render applications list when data is loaded', async () => {
    const mockApplications = [
      {
        apiVersion: 'v1',
        apiGroup: 'appstudio.redhat.com',
        kind: 'Application' as const,
        metadata: {
          name: 'app1',
          namespace: 'ns1',
        },
        subcomponent: { name: 'subcomp1' },
        cluster: { name: 'cluster1' },
      },
    ];

    mockUseApplications.mockReturnValue({
      data: mockApplications,
      loaded: true,
      isFetching: false,
      error: undefined,
      clusterErrors: undefined,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    mockUseFilteredPaginatedData.mockReturnValue({
      filteredData: mockApplications,
      paginatedData: mockApplications,
      totalCount: 1,
      totalPages: 1,
    });

    mockUseApplicationFilters.mockReturnValue({
      uniqueSubcomponents: ['subcomp1'],
      uniqueClusters: ['cluster1'],
    });

    await renderApplicationsList();

    await waitFor(() => {
      expect(screen.getByText('Applications')).toBeInTheDocument();
    });
  });

  it('should render with subcomponents when hasSubcomponents is true', async () => {
    mockUseApplicationFilters.mockReturnValue({
      uniqueSubcomponents: ['subcomp1'],
      uniqueClusters: ['cluster1'],
    });

    await renderApplicationsList(true);

    await waitFor(() => {
      expect(screen.getByText('Applications')).toBeInTheDocument();
    });
  });

  it('should render without subcomponents when hasSubcomponents is false', async () => {
    mockUseApplicationFilters.mockReturnValue({
      uniqueSubcomponents: [],
      uniqueClusters: ['cluster1'],
    });

    await renderApplicationsList(false);

    await waitFor(() => {
      expect(screen.getByText('Applications')).toBeInTheDocument();
    });
  });

  it('should show fetching state', async () => {
    mockUseApplications.mockReturnValue({
      data: [],
      loaded: true,
      isFetching: true,
      error: undefined,
      clusterErrors: undefined,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    await renderApplicationsList();

    await waitFor(() => {
      expect(screen.getByText('Applications')).toBeInTheDocument();
    });
  });

  it('should show error panel when general error occurs', async () => {
    mockUseApplications.mockReturnValue({
      data: [],
      loaded: true,
      isFetching: false,
      error: 'Failed to fetch applications',
      clusterErrors: undefined,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    await renderApplicationsList();

    await waitFor(() => {
      expect(
        screen.getByText('Failed to fetch applications'),
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

    mockUseApplications.mockReturnValue({
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

    await renderApplicationsList();

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
    mockUseApplications.mockReturnValue({
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

    await renderApplicationsList();

    await waitFor(() => {
      expect(screen.getByText('No applications found')).toBeInTheDocument();
      expect(
        screen.getByText('No applications match the current filters.'),
      ).toBeInTheDocument();
    });
  });
});
