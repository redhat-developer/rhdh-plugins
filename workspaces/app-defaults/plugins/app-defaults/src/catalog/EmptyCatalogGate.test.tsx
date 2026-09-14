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
import { useRouteRef } from '@backstage/frontend-plugin-api';
import { usePermission } from '@backstage/plugin-permission-react';
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

jest.mock('@backstage/frontend-plugin-api', () => ({
  ...jest.requireActual('@backstage/frontend-plugin-api'),
  useRouteRef: jest.fn(),
}));

jest.mock('@backstage/plugin-permission-react', () => ({
  usePermission: jest.fn(),
}));

const mockUseRouteRef = useRouteRef as jest.Mock;
const mockUsePermission = usePermission as jest.Mock;

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
  importButtonTitle: 'Import something',
};

beforeEach(() => {
  // By default the catalog import page is available and the user is allowed.
  mockUseRouteRef.mockReturnValue(() => '/catalog-import');
  mockUsePermission.mockReturnValue({ loading: false, allowed: true });
});

afterEach(() => {
  jest.clearAllMocks();
});

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

  it('shows empty state with import button when available and allowed', async () => {
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
      expect(screen.getByText('Import something')).toBeInTheDocument();
    });
    expect(screen.queryByText('Original page content')).not.toBeInTheDocument();
  });

  it('hides the import button when the catalog import page is not available', async () => {
    mockUseRouteRef.mockReturnValue(undefined);
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
    });
    expect(screen.queryByText('Import something')).not.toBeInTheDocument();
  });

  it('hides the import button when the user lacks permission', async () => {
    mockUsePermission.mockReturnValue({ loading: false, allowed: false });
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
    });
    expect(screen.queryByText('Import something')).not.toBeInTheDocument();
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
