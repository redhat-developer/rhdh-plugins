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
import { KonfluxCIPageComponent } from '../KonfluxCIPage';
import { translationApiRef } from '@backstage/core-plugin-api/alpha';
import { errorApiRef } from '@backstage/core-plugin-api';
import { usePipelineruns } from '../../../hooks/resources/usePipelineruns';
import { useComponents } from '../../../hooks/resources/useComponents';
import { useFilteredPaginatedData } from '../../../hooks/useFilteredPaginatedData';
import { usePipelineRunFilters } from '../../List/PipelineRunsList/usePipelineRunFilters';
import { useCommitFilters } from '../../List/CommitsList/useCommitFilters';
import { getCommitsFromPLRs } from '../../../utils/commits';

jest.mock('../../../hooks/useEntitySubcomponents');
jest.mock('../../../hooks/resources/usePipelineruns');
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
const mockUsePipelineRunFilters = usePipelineRunFilters as jest.MockedFunction<
  typeof usePipelineRunFilters
>;
const mockUseCommitFilters = useCommitFilters as jest.MockedFunction<
  typeof useCommitFilters
>;
const mockGetCommitsFromPLRs = getCommitsFromPLRs as jest.MockedFunction<
  typeof getCommitsFromPLRs
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

const renderKonfluxCIPage = async () =>
  renderInTestApp(
    <TestApiProvider
      apis={[
        [catalogApiRef, mockCatalogApi],
        [errorApiRef, mockErrorApi],
        [translationApiRef, mockApis.translation()],
      ]}
    >
      <EntityProvider entity={mockEntity}>
        <KonfluxCIPageComponent />
      </EntityProvider>
    </TestApiProvider>,
  );

describe('KonfluxCIPage', () => {
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

    mockUseCommitFilters.mockReturnValue({
      uniqueSubcomponents: [],
      uniqueClusters: [],
      uniquePipelineRunStatuses: [],
    });

    mockGetCommitsFromPLRs.mockReturnValue([]);
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

    await renderKonfluxCIPage();

    await waitFor(() => {
      expect(screen.getByTestId('konflux-ci-page-progress')).toBeVisible();
    });
  });

  it('should render pipelineruns and commits lists when data is loaded', async () => {
    mockUseEntitySubcomponents.mockReturnValue({
      subcomponentNames: ['test-entity'],
      subcomponentEntities: [mockEntity],
      loading: false,
      error: undefined,
    });

    await renderKonfluxCIPage();

    await waitFor(() => {
      expect(screen.getByText('Pipeline Runs')).toBeInTheDocument();
      expect(screen.getByText('Commits')).toBeInTheDocument();
    });
  });
});
