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

import { render, screen, waitFor } from '@testing-library/react';
import { TestApiProvider } from '@backstage/test-utils';
import { errorApiRef } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { EmptyCatalogGate } from './EmptyCatalogGate';

jest.mock('../components/empty-state/EmptyState', () => ({
  EmptyState: (props: any) => (
    <div data-testid="empty-state">
      <span>{props.title}</span>
      <span>{props.description}</span>
      {props.action}
    </div>
  ),
}));

const mockErrorApi = { post: jest.fn(), error$: jest.fn() };

function Wrapper({
  mockCatalogApi,
  children,
}: {
  mockCatalogApi: any;
  children: React.ReactNode;
}) {
  return (
    <TestApiProvider
      apis={[
        [catalogApiRef, mockCatalogApi],
        [errorApiRef, mockErrorApi],
      ]}
    >
      {children}
    </TestApiProvider>
  );
}

const testEmptyState = {
  title: 'Empty title',
  description: 'Empty description',
  action: <button type="button">Go somewhere</button>,
};

describe('EmptyCatalogGate', () => {
  it('shows loading spinner initially', () => {
    const mockApi = {
      getEntityFacets: jest.fn(() => new Promise(() => {})),
    };

    render(
      <Wrapper mockCatalogApi={mockApi}>
        <EmptyCatalogGate emptyState={testEmptyState}>
          Original page content
        </EmptyCatalogGate>
      </Wrapper>,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows empty state with custom props when no entities exist', async () => {
    const mockApi = {
      getEntityFacets: jest.fn().mockResolvedValue({
        facets: { kind: [{ value: 'Component', count: 0 }] },
      }),
    };

    render(
      <Wrapper mockCatalogApi={mockApi}>
        <EmptyCatalogGate emptyState={testEmptyState}>
          Original page content
        </EmptyCatalogGate>
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('Empty title')).toBeInTheDocument();
      expect(screen.getByText('Empty description')).toBeInTheDocument();
      expect(screen.getByText('Go somewhere')).toBeInTheDocument();
    });
    expect(screen.queryByText('Original page content')).not.toBeInTheDocument();
  });

  it('renders children when entities exist', async () => {
    const mockApi = {
      getEntityFacets: jest.fn().mockResolvedValue({
        facets: { kind: [{ value: 'Component', count: 5 }] },
      }),
    };

    render(
      <Wrapper mockCatalogApi={mockApi}>
        <EmptyCatalogGate emptyState={testEmptyState}>
          Original page content
        </EmptyCatalogGate>
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Original page content')).toBeInTheDocument();
    });
  });

  it('passes filter to the catalog API', async () => {
    const mockApi = {
      getEntityFacets: jest.fn().mockResolvedValue({
        facets: { kind: [{ value: 'API', count: 2 }] },
      }),
    };

    render(
      <Wrapper mockCatalogApi={mockApi}>
        <EmptyCatalogGate filter={{ kind: 'API' }} emptyState={testEmptyState}>
          API docs content
        </EmptyCatalogGate>
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('API docs content')).toBeInTheDocument();
    });

    expect(mockApi.getEntityFacets).toHaveBeenCalledWith({
      facets: ['kind'],
      filter: { kind: 'API' },
    });
  });

  it('shows error panel on API failure', async () => {
    const mockApi = {
      getEntityFacets: jest.fn().mockRejectedValue(new Error('Network error')),
    };

    render(
      <Wrapper mockCatalogApi={mockApi}>
        <EmptyCatalogGate emptyState={testEmptyState}>
          Original page content
        </EmptyCatalogGate>
      </Wrapper>,
    );

    await waitFor(() => {
      expect(
        screen.queryByText('Original page content'),
      ).not.toBeInTheDocument();
    });
  });
});
