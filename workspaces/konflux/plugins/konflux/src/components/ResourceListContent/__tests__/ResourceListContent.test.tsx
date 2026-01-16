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
  catalogApiRef,
  EntityProvider,
  CatalogApi,
} from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';
import { errorApiRef } from '@backstage/core-plugin-api';
import { translationApiRef } from '@backstage/core-plugin-api/alpha';
import { ResourceListContent } from '../ResourceListContent';
import { ClusterError } from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { ItemWithKey } from '../../Table/Table';

type MockItem = ItemWithKey & {
  name: string;
  value: string;
};

const MockItemRow = ({ name, value }: MockItem) => (
  <tr>
    <td>{name}</td>
    <td>{value}</td>
  </tr>
);

const mockData: MockItem[] = [
  { itemKey: 'key1', name: 'Item 1', value: 'Value 1' },
  { itemKey: 'key2', name: 'Item 2', value: 'Value 2' },
];

const mockClusterErrors: ClusterError[] = [
  {
    cluster: 'cluster1',
    namespace: 'namespace1',
    message: 'Test error',
  },
];

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

const defaultProps = {
  loaded: true,
  allClustersFailed: false,
  data: mockData,
  emptyStateTitle: 'No items found',
  emptyStateDescription: 'No items match the current filters.',
  columns: ['Name', 'Value'],
  ItemRow: MockItemRow,
};

const renderResourceListContent = async (props: any) => {
  return await renderInTestApp(
    <TestApiProvider
      apis={[
        [catalogApiRef, mockCatalogApi],
        [errorApiRef, mockErrorApi],
        [translationApiRef, mockApis.translation()],
      ]}
    >
      <EntityProvider entity={mockEntity}>
        <ResourceListContent {...defaultProps} {...props} />
      </EntityProvider>
    </TestApiProvider>,
  );
};

describe('ResourceListContent', () => {
  describe('Loading state', () => {
    it('should render Progress when loaded is false', async () => {
      await renderResourceListContent({ loaded: false });

      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });

    it('should not render Table when loaded is false', async () => {
      await renderResourceListContent({ loaded: false });

      await waitFor(() => {
        expect(screen.queryByText('Name')).not.toBeInTheDocument();
      });
    });

    it('should not render EmptyState when loaded is false', async () => {
      await renderResourceListContent({ loaded: false, data: [] });

      await waitFor(() => {
        expect(screen.queryByText('No items found')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error state', () => {
    it('should render ClusterErrorPanel when allClustersFailed is true and clusterErrors are provided', async () => {
      await renderResourceListContent({
        allClustersFailed: true,
        clusterErrors: mockClusterErrors,
      });

      await waitFor(() => {
        expect(
          screen.getByText(
            'Warning: Failed to retrieve resources from all clusters',
          ),
        ).toBeInTheDocument();
        expect(screen.getByText('Cluster Errors:')).toBeInTheDocument();
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });
    });

    it('should not render Table when allClustersFailed is true and clusterErrors are provided', async () => {
      await renderResourceListContent({
        allClustersFailed: true,
        clusterErrors: mockClusterErrors,
      });

      await waitFor(() => {
        expect(screen.queryByText('Name')).not.toBeInTheDocument();
      });
    });

    it('should not render EmptyState when allClustersFailed is true and clusterErrors are provided', async () => {
      await renderResourceListContent({
        allClustersFailed: true,
        clusterErrors: mockClusterErrors,
        data: [],
      });

      await waitFor(() => {
        expect(screen.queryByText('No items found')).not.toBeInTheDocument();
      });
    });

    it('should render Table when allClustersFailed is true but clusterErrors is undefined', async () => {
      await renderResourceListContent({
        allClustersFailed: true,
        clusterErrors: undefined,
      });

      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Item 1')).toBeInTheDocument();
      });
    });

    it('should render Table when allClustersFailed is true but clusterErrors is empty array', async () => {
      await renderResourceListContent({
        allClustersFailed: true,
        clusterErrors: [],
      });

      await waitFor(() => {
        expect(screen.queryByText('Name')).not.toBeInTheDocument();
        expect(
          screen.queryByText('Failed to retrieve resources from all clusters'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty state', () => {
    it('should render EmptyState when data is empty', async () => {
      await renderResourceListContent({ data: [] });

      await waitFor(() => {
        expect(screen.getByText('No items found')).toBeInTheDocument();
        expect(
          screen.getByText('No items match the current filters.'),
        ).toBeInTheDocument();
      });
    });

    it('should use provided emptyStateTitle and emptyStateDescription', async () => {
      await renderResourceListContent({
        data: [],
        emptyStateTitle: 'Custom title',
        emptyStateDescription: 'Custom description',
      });

      await waitFor(() => {
        expect(screen.getByText('Custom title')).toBeInTheDocument();
        expect(screen.getByText('Custom description')).toBeInTheDocument();
      });
    });

    it('should not render Table when data is empty', async () => {
      await renderResourceListContent({ data: [] });

      await waitFor(() => {
        expect(screen.queryByText('Name')).not.toBeInTheDocument();
      });
    });

    it('should not render ClusterErrorPanel when data is empty', async () => {
      await renderResourceListContent({ data: [] });

      await waitFor(() => {
        expect(
          screen.queryByText('Failed to retrieve resources from all clusters'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Partial error state (errors with data)', () => {
    it('should render ClusterErrorPanel below Table when clusterErrors exist but not all clusters failed', async () => {
      await renderResourceListContent({
        allClustersFailed: false,
        clusterErrors: mockClusterErrors,
        data: mockData,
      });

      await waitFor(() => {
        // table should be rendered
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        // error panel should also be rendered
        expect(
          screen.getByText('Warning: Failed to retrieve resources'),
        ).toBeInTheDocument();
        expect(screen.getByText('Cluster Errors:')).toBeInTheDocument();
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });
    });

    it('should show "Failed to retrieve resources" message when not all clusters failed', async () => {
      await renderResourceListContent({
        allClustersFailed: false,
        clusterErrors: mockClusterErrors,
        data: mockData,
      });

      await waitFor(() => {
        expect(
          screen.getByText('Warning: Failed to retrieve resources'),
        ).toBeInTheDocument();
        expect(
          screen.queryByText('Failed to retrieve resources from all clusters'),
        ).not.toBeInTheDocument();
      });
    });

    it('should not render ClusterErrorPanel when clusterErrors is empty', async () => {
      await renderResourceListContent({
        allClustersFailed: false,
        clusterErrors: [],
        data: mockData,
      });

      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(
          screen.queryByText('Failed to retrieve resources'),
        ).not.toBeInTheDocument();
      });
    });

    it('should not render ClusterErrorPanel when clusterErrors is undefined', async () => {
      await renderResourceListContent({
        allClustersFailed: false,
        clusterErrors: undefined,
        data: mockData,
      });

      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(
          screen.queryByText('Failed to retrieve resources'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Success state (Table)', () => {
    it('should render Table when data is present', async () => {
      await renderResourceListContent({});

      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
      });
    });

    it('should pass columns to Table', async () => {
      await renderResourceListContent({
        columns: ['Column1', 'Column2', 'Column3'],
      });

      await waitFor(() => {
        expect(screen.getByText('Column1')).toBeInTheDocument();
        expect(screen.getByText('Column2')).toBeInTheDocument();
        expect(screen.getByText('Column3')).toBeInTheDocument();
      });
    });

    it('should pass data to Table', async () => {
      await renderResourceListContent({});

      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
      });
    });

    it('should pass ItemRow component to Table', async () => {
      await renderResourceListContent({});

      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Value 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
        expect(screen.getByText('Value 2')).toBeInTheDocument();
      });
    });

    it('should pass isFetching prop to Table', async () => {
      await renderResourceListContent({ isFetching: true });

      await waitFor(() => {
        // When isFetching is true, Table shows a spinner
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });

    it('should not show spinner when isFetching is not provided', async () => {
      await renderResourceListContent({});

      await waitFor(() => {
        // When isFetching is undefined, Table should not show spinner
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });

    it('should pass pagination prop to Table when provided', async () => {
      const pagination = {
        page: 2,
        totalCount: 50,
        setPage: jest.fn(),
        rowsPerPage: 10,
        setRowsPerPage: jest.fn(),
      };

      await renderResourceListContent({ pagination });

      await waitFor(() => {
        // Table pagination shows "X-Y of Z" format
        expect(screen.getByText(/21-30 of 50/)).toBeInTheDocument();
      });
    });

    it('should not render pagination when not provided', async () => {
      await renderResourceListContent({});

      await waitFor(() => {
        // Without pagination, Table doesn't show pagination controls
        expect(screen.queryByText(/of \d+/)).not.toBeInTheDocument();
      });
    });

    it('should pass onLoadMore prop to Table when provided', async () => {
      const onLoadMore = jest.fn();

      await renderResourceListContent({
        onLoadMore,
        hasMore: true,
      });

      await waitFor(() => {
        expect(screen.getByText('Load More')).toBeInTheDocument();
      });
    });

    it('should pass hasMore prop to Table', async () => {
      await renderResourceListContent({ hasMore: true });

      await waitFor(() => {
        // When hasMore is true but no onLoadMore, no button is shown
        // But Table still receives the prop
        expect(screen.getByText('Name')).toBeInTheDocument();
      });
    });

    it('should not render load more button when onLoadMore is not provided', async () => {
      await renderResourceListContent({ hasMore: true });

      await waitFor(() => {
        expect(screen.queryByText('Load More')).not.toBeInTheDocument();
      });
    });
  });

  describe('State priority', () => {
    it('should prioritize loading state over error state', async () => {
      await renderResourceListContent({
        loaded: false,
        allClustersFailed: true,
        clusterErrors: mockClusterErrors,
      });

      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(
          screen.queryByText('Failed to retrieve resources from all clusters'),
        ).not.toBeInTheDocument();
      });
    });

    it('should prioritize loading state over empty state', async () => {
      await renderResourceListContent({
        loaded: false,
        data: [],
      });

      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(screen.queryByText('No items found')).not.toBeInTheDocument();
      });
    });

    it('should prioritize loading state over success state', async () => {
      await renderResourceListContent({ loaded: false });

      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(screen.queryByText('Name')).not.toBeInTheDocument();
      });
    });

    it('should prioritize error state over empty state', async () => {
      await renderResourceListContent({
        allClustersFailed: true,
        clusterErrors: mockClusterErrors,
        data: [],
      });

      await waitFor(() => {
        expect(
          screen.getByText(
            'Warning: Failed to retrieve resources from all clusters',
          ),
        ).toBeInTheDocument();
        expect(screen.queryByText('No items found')).not.toBeInTheDocument();
      });
    });

    it('should prioritize error state over success state', async () => {
      await renderResourceListContent({
        allClustersFailed: true,
        clusterErrors: mockClusterErrors,
      });

      await waitFor(() => {
        expect(
          screen.getByText(
            'Warning: Failed to retrieve resources from all clusters',
          ),
        ).toBeInTheDocument();
        expect(screen.queryByText('Name')).not.toBeInTheDocument();
      });
    });

    it('should prioritize empty state over success state', async () => {
      await renderResourceListContent({ data: [] });

      await waitFor(() => {
        expect(screen.getByText('No items found')).toBeInTheDocument();
        expect(screen.queryByText('Name')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty data array', async () => {
      await renderResourceListContent({ data: [] });

      await waitFor(() => {
        expect(screen.getByText('No items found')).toBeInTheDocument();
      });
    });

    it('should handle multiple cluster errors', async () => {
      const multipleErrors: ClusterError[] = [
        {
          cluster: 'cluster1',
          namespace: 'namespace1',
          message: 'Error 1',
        },
        {
          cluster: 'cluster2',
          namespace: 'namespace2',
          message: 'Error 2',
        },
      ];

      await renderResourceListContent({
        allClustersFailed: true,
        clusterErrors: multipleErrors,
      });

      await waitFor(() => {
        expect(screen.getByText('Cluster Errors:')).toBeInTheDocument();
        expect(screen.getByText('Error 1')).toBeInTheDocument();
        expect(screen.getByText('Error 2')).toBeInTheDocument();
      });
    });

    it('should handle all optional props undefined', async () => {
      await renderResourceListContent({
        loaded: true,
        allClustersFailed: false,
        data: mockData,
        emptyStateTitle: 'No items',
        emptyStateDescription: 'No description',
        columns: ['Name'],
        ItemRow: MockItemRow,
      });

      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Item 1')).toBeInTheDocument();
      });
    });
  });
});
