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
  CatalogApi,
  catalogApiRef,
  EntityProvider,
  useEntity,
} from '@backstage/plugin-catalog-react';
import { useEntitySubcomponents } from '../../../hooks/useEntitySubcomponents';
import { Entity } from '@backstage/catalog-model';
import {
  mockApis,
  renderInTestApp,
  TestApiProvider,
} from '@backstage/test-utils';
import { KonfluxPageComponent } from '../KonfluxPage';
import { translationApiRef } from '@backstage/core-plugin-api/alpha';
import { errorApiRef } from '@backstage/core-plugin-api';
import { useApplications } from '../../../hooks/resources/useApplications';
import { useComponents } from '../../../hooks/resources/useComponents';
import { useFilteredPaginatedData } from '../../../hooks/useFilteredPaginatedData';

jest.mock('../../../hooks/useEntitySubcomponents');
jest.mock('../../../hooks/resources/useApplications');
jest.mock('../../../hooks/resources/useComponents');
jest.mock('../../../hooks/useFilteredPaginatedData');
jest.mock('../../List/PipelineRunsList/usePipelineRunFilters');
jest.mock('../../List/CommitsList/useCommitFilters');
jest.mock('../../../utils/commits');
jest.mock('@backstage/plugin-catalog-react', () => ({
  ...jest.requireActual('@backstage/plugin-catalog-react'),
  useEntity: jest.fn(),
  useRelatedEntities: jest.fn().mockReturnValue({
    entities: [],
    loading: false,
    error: undefined,
  }),
}));

const mockUseEntitySubcomponents =
  useEntitySubcomponents as jest.MockedFunction<typeof useEntitySubcomponents>;
const mockUseApplications = useApplications as jest.MockedFunction<
  typeof useApplications
>;
const mockUseComponents = useComponents as jest.MockedFunction<
  typeof useComponents
>;
const mockUseFilteredPaginatedData =
  useFilteredPaginatedData as jest.MockedFunction<
    typeof useFilteredPaginatedData
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

const renderKonfluxPage = async () =>
  renderInTestApp(
    <TestApiProvider
      apis={[
        [catalogApiRef, mockCatalogApi],
        [errorApiRef, mockErrorApi],
        [translationApiRef, mockApis.translation()],
      ]}
    >
      <EntityProvider entity={mockEntity}>
        <KonfluxPageComponent />
      </EntityProvider>
    </TestApiProvider>,
  );

describe('KonfluxPage', () => {
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state when data is not loaded', async () => {
    mockUseEntitySubcomponents.mockReturnValue({
      subcomponentNames: ['test-entity'],
      subcomponentEntities: [mockEntity],
      loading: true,
      error: undefined,
    });

    await renderKonfluxPage();

    await waitFor(() => {
      expect(screen.getByTestId('konflux-page-progress')).toBeVisible();
    });
  });

  it('should render applications and components lists when data is loaded', async () => {
    mockUseEntitySubcomponents.mockReturnValue({
      subcomponentNames: ['test-entity'],
      subcomponentEntities: [mockEntity],
      loading: false,
      error: undefined,
    });

    await renderKonfluxPage();

    await waitFor(() => {
      expect(screen.getByText('Applications')).toBeInTheDocument();
      expect(screen.getByText('Components')).toBeInTheDocument();
    });
  });
});
