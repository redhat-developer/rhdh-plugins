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
import { ComponentsList } from '../../ComponentsList/ComponentsList';
import {
  TestApiProvider,
  renderInTestApp,
  mockApis,
} from '@backstage/test-utils';
import {
  catalogApiRef,
  EntityProvider,
  CatalogApi,
} from '@backstage/plugin-catalog-react';
import { errorApiRef } from '@backstage/core-plugin-api';
import { translationApiRef } from '@backstage/core-plugin-api/alpha';
import { Entity } from '@backstage/catalog-model';
import { useComponents } from '../../../../hooks/resources/useComponents';
import { useFilteredPaginatedData } from '../../../../hooks/useFilteredPaginatedData';
import { useComponentFilters } from '../../ComponentsList/useComponentFilters';
import { ComponentResource } from '@red-hat-developer-hub/backstage-plugin-konflux-common';

// Mock the hooks
jest.mock('../../../../hooks/resources/useComponents');
jest.mock('../../../../hooks/useFilteredPaginatedData');
jest.mock('../useComponentFilters');
jest.mock('@backstage/plugin-catalog-react', () => ({
  ...jest.requireActual('@backstage/plugin-catalog-react'),
  useRelatedEntities: jest.fn().mockReturnValue({
    entities: [],
    loading: false,
    error: undefined,
  }),
}));

const mockUseComponents = useComponents as jest.MockedFunction<
  typeof useComponents
>;
const mockUseFilteredPaginatedData =
  useFilteredPaginatedData as jest.MockedFunction<
    typeof useFilteredPaginatedData
  >;
const mockUseComponentFilters = useComponentFilters as jest.MockedFunction<
  typeof useComponentFilters
>;

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

const renderComponentsList = async () =>
  await renderInTestApp(
    <TestApiProvider
      apis={[
        [catalogApiRef, mockCatalogApi],
        [errorApiRef, mockErrorApi],
        [translationApiRef, mockApis.translation()],
      ]}
    >
      <EntityProvider entity={mockEntity}>
        <ComponentsList hasSubcomponents />
      </EntityProvider>
    </TestApiProvider>,
  );

describe('ComponentsList', () => {
  beforeEach(() => {
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

    mockUseFilteredPaginatedData.mockReturnValue({
      filteredData: [],
      paginatedData: [],
      totalCount: 0,
      totalPages: 0,
    });

    mockUseComponentFilters.mockReturnValue({
      uniqueSubcomponents: [],
      uniqueClusters: [],
      uniqueApplications: [],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state when data is not loaded', async () => {
    mockUseComponents.mockReturnValue({
      data: [],
      loaded: false,
      isFetching: false,
      error: undefined,
      clusterErrors: undefined,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    await renderComponentsList();

    await waitFor(() => {
      expect(screen.getByText('Components')).toBeInTheDocument();
    });
  });

  it('should render components list when data is loaded', async () => {
    const mockComponents: ComponentResource[] = [
      {
        apiVersion: 'v1',
        apiGroup: 'appstudio.redhat.com',
        kind: 'Component',
        metadata: {
          name: 'comp1',
          namespace: 'ns1',
        },
        spec: { application: 'app1' },
        subcomponent: { name: 'subcomp1' },
        cluster: { name: 'cluster1' },
      },
    ];

    mockUseComponents.mockReturnValue({
      data: mockComponents,
      loaded: true,
      isFetching: false,
      error: undefined,
      clusterErrors: undefined,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    mockUseFilteredPaginatedData.mockReturnValue({
      filteredData: mockComponents,
      paginatedData: mockComponents,
      totalCount: 1,
      totalPages: 1,
    });

    mockUseComponentFilters.mockReturnValue({
      uniqueSubcomponents: ['subcomp1'],
      uniqueClusters: ['cluster1'],
      uniqueApplications: ['app1'],
    });

    await renderComponentsList();

    await waitFor(() => {
      expect(screen.getByText('Components')).toBeInTheDocument();
    });
  });

  it('should show fetching state', async () => {
    mockUseComponents.mockReturnValue({
      data: [],
      loaded: true,
      isFetching: true,
      error: undefined,
      clusterErrors: undefined,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    await renderComponentsList();

    await waitFor(() => {
      expect(screen.getByText('Components')).toBeInTheDocument();
    });
  });

  it('should show error panel when general error occurs', async () => {
    mockUseComponents.mockReturnValue({
      data: [],
      loaded: true,
      isFetching: false,
      error: 'Failed to fetch components',
      clusterErrors: undefined,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    await renderComponentsList();

    await waitFor(() => {
      expect(
        screen.getByText('Failed to fetch components'),
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

    mockUseComponents.mockReturnValue({
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

    await renderComponentsList();

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

    mockUseFilteredPaginatedData.mockReturnValue({
      filteredData: [],
      paginatedData: [],
      totalCount: 0,
      totalPages: 0,
    });

    await renderComponentsList();

    await waitFor(() => {
      expect(screen.getByText('No components found')).toBeInTheDocument();
      expect(
        screen.getByText('No components match the current filters.'),
      ).toBeInTheDocument();
    });
  });
});
