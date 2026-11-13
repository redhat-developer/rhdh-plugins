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

import { render, screen } from '@testing-library/react';
import { TestApiProvider } from '@backstage/test-utils';
import { useRouteRef } from '@backstage/frontend-plugin-api';
import { searchApiRef } from '@backstage/plugin-search-react';
import { SidebarSearch } from './SidebarSearch';

jest.mock('@backstage/plugin-search', () => ({
  SidebarSearchModal: () => <div data-testid="search-modal" />,
}));

jest.mock('@backstage/core-components', () => ({
  ...jest.requireActual('@backstage/core-components'),
  SidebarItem: ({ to, text }: { to?: string; text?: string }) => (
    <a href={to} data-testid="search-fallback-link">
      {text}
    </a>
  ),
}));

jest.mock('@backstage/frontend-plugin-api', () => ({
  ...jest.requireActual('@backstage/frontend-plugin-api'),
  useRouteRef: jest.fn(),
}));

const mockUseRouteRef = useRouteRef as jest.Mock;
const mockSearchApi = {} as any;

beforeEach(() => {
  mockUseRouteRef.mockReturnValue(() => '/search');
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('SidebarSearch', () => {
  it('renders the search modal when the search API and route are available', () => {
    render(
      <TestApiProvider apis={[[searchApiRef, mockSearchApi]]}>
        <SidebarSearch />
      </TestApiProvider>,
    );
    expect(screen.getByTestId('search-modal')).toBeInTheDocument();
  });

  it('renders nothing when the search API is not available', () => {
    render(
      <TestApiProvider apis={[]}>
        <SidebarSearch />
      </TestApiProvider>,
    );
    expect(screen.queryByTestId('search-modal')).not.toBeInTheDocument();
  });

  it('falls back to a /search link when the search routeRef is unbound', () => {
    mockUseRouteRef.mockReturnValue(undefined);
    render(
      <TestApiProvider apis={[[searchApiRef, mockSearchApi]]}>
        <SidebarSearch />
      </TestApiProvider>,
    );
    expect(screen.queryByTestId('search-modal')).not.toBeInTheDocument();
    const link = screen.getByTestId('search-fallback-link');
    expect(link).toHaveAttribute('href', '/search');
    expect(link).toHaveTextContent('Search');
  });
});
