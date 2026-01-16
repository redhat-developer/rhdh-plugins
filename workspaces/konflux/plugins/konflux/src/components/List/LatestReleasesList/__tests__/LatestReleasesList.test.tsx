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
import { useReleases } from '../../../../hooks/resources/useReleases';
import { useEntitySubcomponents } from '../../../../hooks/useEntitySubcomponents';
import { useKonfluxConfig } from '../../../../hooks/useKonfluxConfig';
import { LatestReleasesList } from '../LatestReleasesList';
import {
  PipelineRunLabel,
  ReleaseResource,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';

// Mock the hooks
jest.mock('../../../../hooks/resources/useReleases');
jest.mock('../../../../hooks/useEntitySubcomponents');
jest.mock('../../../../hooks/useKonfluxConfig');
jest.mock('@backstage/plugin-catalog-react', () => ({
  ...jest.requireActual('@backstage/plugin-catalog-react'),
  useEntity: jest.fn(),
  useRelatedEntities: jest.fn().mockReturnValue({
    entities: [],
    loading: false,
    error: undefined,
  }),
}));

const mockUseReleases = useReleases as jest.MockedFunction<typeof useReleases>;
const mockUseEntitySubcomponents =
  useEntitySubcomponents as jest.MockedFunction<typeof useEntitySubcomponents>;
const mockUseKonfluxConfig = useKonfluxConfig as jest.MockedFunction<
  typeof useKonfluxConfig
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

const renderLatestReleasesList = async () =>
  renderInTestApp(
    <TestApiProvider
      apis={[
        [catalogApiRef, mockCatalogApi],
        [errorApiRef, mockErrorApi],
        [translationApiRef, mockApis.translation()],
      ]}
    >
      <EntityProvider entity={mockEntity}>
        <LatestReleasesList />
      </EntityProvider>
    </TestApiProvider>,
  );

describe('LatestReleasesList', () => {
  beforeEach(() => {
    mockUseEntity.mockReturnValue({
      entity: mockEntity,
    });

    mockUseEntitySubcomponents.mockReturnValue({
      subcomponentNames: ['test-entity'],
      subcomponentEntities: [mockEntity],
      loading: false,
      error: undefined,
    });

    mockUseKonfluxConfig.mockReturnValue({
      clusters: {
        cluster1: {
          uiUrl: 'https://example.com',
        },
      },
      subcomponentConfigs: [
        {
          subcomponent: 'test-entity',
          cluster: 'cluster1',
          namespace: 'default',
          applications: ['app1'],
        },
      ],
      authProvider: 'serviceAccount',
    });

    mockUseReleases.mockReturnValue({
      data: [],
      loaded: true,
      isFetching: false,
      error: undefined,
      clusterErrors: undefined,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state when data is not loaded', async () => {
    mockUseReleases.mockReturnValue({
      data: [],
      loaded: false,
      isFetching: false,
      error: undefined,
      clusterErrors: undefined,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    await renderLatestReleasesList();

    await waitFor(() => {
      expect(screen.getByText('Konflux Latest Releases')).toBeInTheDocument();
    });
  });

  it('should render releases list when data is loaded', async () => {
    const mockReleases: ReleaseResource[] = [
      {
        kind: 'Release',
        apiVersion: 'v1',
        application: 'app1',
        subcomponent: { name: 'test-entity' },
        cluster: { name: 'cluster1', konfluxUI: 'https://example.com' },
        metadata: {
          name: 'my-release',
          uid: 'id1',
          namespace: 'default',
          creationTimestamp: '2024-01-01T00:00:00Z',
          labels: {
            [PipelineRunLabel.APPLICATION]: 'app1',
          },
        },
      },
    ];

    mockUseReleases.mockReturnValue({
      data: mockReleases,
      loaded: true,
      isFetching: false,
      error: undefined,
      clusterErrors: undefined,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    await renderLatestReleasesList();

    await waitFor(() => {
      expect(screen.getByText('Konflux Latest Releases')).toBeInTheDocument();
      expect(screen.getByText('app1')).toBeInTheDocument();
    });
  });

  it('should show fetching state', async () => {
    mockUseReleases.mockReturnValue({
      data: [],
      loaded: false,
      isFetching: true,
      error: undefined,
      clusterErrors: undefined,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    mockUseEntitySubcomponents.mockReturnValue({
      subcomponentNames: ['test-entity'],
      subcomponentEntities: [mockEntity],
      loading: true,
      error: undefined,
    });

    await renderLatestReleasesList();

    await waitFor(() => {
      expect(screen.getByText('Konflux Latest Releases')).toBeInTheDocument();
      expect(screen.getByTestId('progress')).toBeInTheDocument();
    });
  });

  it('should show error panel when general error occurs', async () => {
    mockUseReleases.mockReturnValue({
      data: [],
      loaded: true,
      isFetching: false,
      error: 'Failed to fetch releases',
      clusterErrors: undefined,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    mockUseEntitySubcomponents.mockReturnValue({
      subcomponentNames: ['test-entity'],
      subcomponentEntities: [mockEntity],
      loading: false,
      error: undefined,
    });

    await renderLatestReleasesList();

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch releases')).toBeInTheDocument();
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

    mockUseReleases.mockReturnValue({
      data: [],
      loaded: true,
      isFetching: false,
      error: undefined,
      clusterErrors: mockClusterErrors,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    mockUseEntitySubcomponents.mockReturnValue({
      subcomponentNames: ['test-entity'],
      subcomponentEntities: [mockEntity],
      loading: false,
      error: undefined,
    });

    await renderLatestReleasesList();

    await waitFor(() => {
      expect(
        screen.getByText(
          'Warning: Failed to retrieve resources from all clusters',
        ),
      ).toBeInTheDocument();
      expect(screen.getByText('Access denied')).toBeInTheDocument();
    });
  });

  it('should show cluster error panel when there are partial errors (some clusters succeeded)', async () => {
    const mockClusterErrors = [
      {
        cluster: 'cluster1',
        namespace: 'namespace1',
        errorType: 'Forbidden',
        message: 'Access denied',
        statusCode: 403,
        resourceType: 'releases',
      },
    ];

    const mockReleases: ReleaseResource[] = [
      {
        kind: 'Release',
        apiVersion: 'v1',
        application: 'app1',
        subcomponent: { name: 'test-entity' },
        cluster: { name: 'cluster1', konfluxUI: 'https://example.com' },
        metadata: {
          name: 'my-release',
          uid: 'id1',
          namespace: 'default',
          creationTimestamp: '2024-01-01T00:00:00Z',
          labels: {
            [PipelineRunLabel.APPLICATION]: 'app1',
          },
        },
      },
    ];

    mockUseReleases.mockReturnValue({
      data: mockReleases,
      loaded: true,
      isFetching: false,
      error: undefined,
      clusterErrors: mockClusterErrors,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    mockUseEntitySubcomponents.mockReturnValue({
      subcomponentNames: ['test-entity'],
      subcomponentEntities: [mockEntity],
      loading: false,
      error: undefined,
    });

    await renderLatestReleasesList();

    await waitFor(() => {
      // should show the table with data (release from cluster1/default succeeded)
      expect(screen.getByText('app1')).toBeInTheDocument();
      // should also show error panel for partial failures (cluster1/namespace1 failed)
      expect(
        screen.getByText('Warning: Failed to retrieve resources'),
      ).toBeInTheDocument();
      expect(screen.getByText('Access denied')).toBeInTheDocument();
    });
  });

  it('should show empty state when no data matches filters', async () => {
    mockUseReleases.mockReturnValue({
      data: [],
      loaded: true,
      isFetching: false,
      error: undefined,
      clusterErrors: undefined,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    mockUseEntitySubcomponents.mockReturnValue({
      subcomponentNames: ['test-entity'],
      subcomponentEntities: [mockEntity],
      loading: false,
      error: undefined,
    });

    await renderLatestReleasesList();

    await waitFor(() => {
      expect(screen.getByText('No releases found')).toBeInTheDocument();
      expect(
        screen.getByText('No releases match the current configuration.'),
      ).toBeInTheDocument();
    });
  });
});
