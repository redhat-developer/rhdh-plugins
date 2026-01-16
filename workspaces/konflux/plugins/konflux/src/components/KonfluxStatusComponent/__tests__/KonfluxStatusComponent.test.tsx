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
import { KonfluxStatusComponent } from '../KonfluxStatusComponent';
import { usePipelineruns } from '../../../hooks/resources/usePipelineruns';
import { useReleases } from '../../../hooks/resources/useReleases';
import { useEntitySubcomponents } from '../../../hooks/useEntitySubcomponents';
import { getLatestPLRs } from '../utils';

jest.mock('../../../hooks/resources/usePipelineruns');
jest.mock('../../../hooks/resources/useReleases');
jest.mock('../../../hooks/useEntitySubcomponents');
jest.mock('../utils');
jest.mock('@backstage/plugin-catalog-react', () => ({
  ...jest.requireActual('@backstage/plugin-catalog-react'),
  useEntity: jest.fn(),
  useRelatedEntities: jest.fn().mockReturnValue({
    entities: [],
    loading: false,
    error: undefined,
  }),
}));

const mockUsePipelineruns = usePipelineruns as jest.MockedFunction<
  typeof usePipelineruns
>;
const mockUseReleases = useReleases as jest.MockedFunction<typeof useReleases>;
const mockUseEntitySubcomponents =
  useEntitySubcomponents as jest.MockedFunction<typeof useEntitySubcomponents>;
const mockGetLatestPLRs = getLatestPLRs as jest.MockedFunction<
  typeof getLatestPLRs
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

const renderKonfluxStatusComponent = async () =>
  renderInTestApp(
    <TestApiProvider
      apis={[
        [catalogApiRef, mockCatalogApi],
        [errorApiRef, mockErrorApi],
        [translationApiRef, mockApis.translation()],
      ]}
    >
      <EntityProvider entity={mockEntity}>
        <KonfluxStatusComponent />
      </EntityProvider>
    </TestApiProvider>,
  );

describe('KonfluxStatusComponent', () => {
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

    mockGetLatestPLRs.mockReturnValue({
      build: null,
      test: null,
      release: null,
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

    await renderKonfluxStatusComponent();

    await waitFor(() => {
      expect(screen.getByTestId('progress')).toBeInTheDocument();
    });
  });

  it('should render loading state when releases are not loaded', async () => {
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

    await renderKonfluxStatusComponent();

    await waitFor(() => {
      expect(screen.getByTestId('progress')).toBeInTheDocument();
    });
  });

  it('should render loading state when entity subcomponents are loading', async () => {
    mockUseEntitySubcomponents.mockReturnValue({
      subcomponentNames: ['test-entity'],
      subcomponentEntities: [mockEntity],
      loading: true,
      error: undefined,
    });

    await renderKonfluxStatusComponent();

    await waitFor(() => {
      expect(screen.getByTestId('progress')).toBeInTheDocument();
    });
  });

  it('should render Konflux Status title', async () => {
    await renderKonfluxStatusComponent();

    await waitFor(() => {
      expect(screen.getByText('Konflux Status')).toBeInTheDocument();
    });
  });

  it('should call getLatestPLRs for each subcomponent', async () => {
    mockUseEntitySubcomponents.mockReturnValue({
      subcomponentNames: ['subcomp1', 'subcomp2'],
      subcomponentEntities: [mockEntity, mockEntity],
      loading: false,
      error: undefined,
    });

    await renderKonfluxStatusComponent();

    await waitFor(() => {
      expect(mockGetLatestPLRs).toHaveBeenCalledTimes(2);
      expect(mockGetLatestPLRs).toHaveBeenCalledWith('subcomp1', [], []);
      expect(mockGetLatestPLRs).toHaveBeenCalledWith('subcomp2', [], []);
    });
  });

  it('should pass correct props to SubcomponentsLatestPipelineRunByTypeComponent', async () => {
    await renderKonfluxStatusComponent();

    await waitFor(() => {
      expect(screen.getByText('Konflux Status')).toBeInTheDocument();
    });

    // Verify getLatestPLRs was called with correct parameters
    expect(mockGetLatestPLRs).toHaveBeenCalledWith('test-entity', [], []);
  });

  it('should show cluster error panel when there are errors from pipelineruns', async () => {
    const mockClusterErrors = [
      {
        cluster: 'cluster1',
        namespace: 'namespace1',
        errorType: 'Forbidden',
        message: 'Access denied',
        statusCode: 403,
        resourceType: 'pipelineruns',
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

    await renderKonfluxStatusComponent();

    await waitFor(() => {
      expect(
        screen.getByText('Warning: Failed to retrieve resources'),
      ).toBeInTheDocument();
      expect(screen.getByText('Access denied')).toBeInTheDocument();
    });
  });

  it('should show cluster error panel when there are errors from releases', async () => {
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

    await renderKonfluxStatusComponent();

    await waitFor(() => {
      expect(
        screen.getByText('Warning: Failed to retrieve resources'),
      ).toBeInTheDocument();
      expect(screen.getByText('Access denied')).toBeInTheDocument();
    });
  });

  it('should combine errors from both pipelineruns and releases', async () => {
    const mockPLRErrors = [
      {
        cluster: 'cluster1',
        namespace: 'namespace1',
        errorType: 'Forbidden',
        message: 'PLR access denied',
        statusCode: 403,
        resourceType: 'pipelineruns',
      },
    ];

    const mockReleaseErrors = [
      {
        cluster: 'cluster2',
        namespace: 'namespace2',
        errorType: 'NotFound',
        message: 'Release not found',
        statusCode: 404,
        resourceType: 'releases',
      },
    ];

    mockUsePipelineruns.mockReturnValue({
      data: [],
      loaded: true,
      isFetching: false,
      error: undefined,
      clusterErrors: mockPLRErrors,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    mockUseReleases.mockReturnValue({
      data: [],
      loaded: true,
      isFetching: false,
      error: undefined,
      clusterErrors: mockReleaseErrors,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
    });

    await renderKonfluxStatusComponent();

    await waitFor(() => {
      // when both sources have no data and errors, all clusters failed
      expect(
        screen.getByText(
          'Warning: Failed to retrieve resources from all clusters',
        ),
      ).toBeInTheDocument();
      // verify both errors are shown
      expect(screen.getByText('PLR access denied')).toBeInTheDocument();
      expect(screen.getByText('Release not found')).toBeInTheDocument();
    });
  });

  it('should not show error panel when there are no errors', async () => {
    await renderKonfluxStatusComponent();

    await waitFor(() => {
      expect(screen.getByText('Konflux Status')).toBeInTheDocument();
      expect(
        screen.queryByText('Failed to retrieve resources'),
      ).not.toBeInTheDocument();
    });
  });
});
