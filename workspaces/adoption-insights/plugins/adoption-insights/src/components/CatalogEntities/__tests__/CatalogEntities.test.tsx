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
import React from 'react';

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import CatalogEntities from '../CatalogEntities';

jest.mock('../../../hooks/useCatalogEntities', () => ({
  useCatalogEntities: () => ({
    catalogEntities: {
      data: [
        {
          plugin_id: '1',
          name: 'devhub',
          kind: 'Component',
          last_used: '2025-03-06T06:25:16.708Z',
          count: 2233,
          namespace: 'default',
        },
        {
          plugin_id: '2',
          name: 'hg-dev-hub-starter',
          kind: 'Component',
          last_used: '2025-03-05T06:25:16.708Z',
          count: 1974,
          namespace: 'default',
        },
        {
          plugin_id: '3',
          name: 'netbox',
          kind: 'API',
          last_used: '2025-03-04T06:25:16.708Z',
          count: 1863,
          namespace: 'default',
        },
        {
          plugin_id: '4',
          name: 'devhub',
          kind: 'Component',
          last_used: '2025-03-01T06:25:16.708Z',
          count: 2233,
          namespace: 'default',
        },
        {
          plugin_id: '5',
          name: 'hg-dev-hub-starter',
          kind: 'Component',
          last_used: '2025-03-06T06:25:16.708Z',
          count: 1974,
          namespace: 'default',
        },
        {
          plugin_id: '6',
          name: 'netbox',
          kind: 'API',
          last_used: '2025-03-06T06:25:16.708Z',
          count: 1863,
          namespace: 'default',
        },
      ],
    },
    loading: false,
  }),
}));

jest.mock('@backstage/catalog-model', () => ({
  parseEntityRef: (ref: string) => {
    const [kind, name] = ref.split(':')[0].split('/');
    return { kind, name: name || ref.split('/')[1] };
  },
}));

jest.mock('@backstage/plugin-catalog-react', () => ({
  entityRouteRef: 'entityRouteRef',
}));

jest.mock('@backstage/core-plugin-api', () => ({
  useRouteRef: () => (params: any) =>
    `/catalog/${params.kind}/${params.namespace}/${params.name}`,
}));

jest.mock('../../../utils/constants', () => ({
  CATALOG_ENTITIES_TABLE_HEADERS: [
    { id: 'name', title: 'Name' },
    { id: 'kind', title: 'Kind' },
    { id: 'last-used', title: 'Last used' },
    { id: 'views', title: 'Views' },
  ],
  CATALOG_ENTITIES_TITLE: 'Top catalog entities',
}));

jest.mock('../../../utils/utils', () => ({
  getLastUsedDay: () => 'Yesterday',
  setCatalogEntitieskinds: jest.fn(),
}));

jest.mock('../../CardWrapper', () => ({
  __esModule: true,
  default: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title: string;
  }) => (
    <div data-testid="card-wrapper">
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));

describe('CatalogEntities', () => {
  const theme = createTheme();
  const user = userEvent.setup();

  const renderComponent = () => {
    return render(
      <ThemeProvider theme={theme}>
        <CatalogEntities />
      </ThemeProvider>,
    );
  };

  it('should render the component with initial data', () => {
    renderComponent();
    expect(screen.getByText('Top catalog entities')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(5);
  });

  it('should display correct table headers', () => {
    renderComponent();
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(4);
    expect(headers[0]).toHaveTextContent('Name');
    expect(headers[1]).toHaveTextContent('Kind');
    expect(headers[2]).toHaveTextContent('Last used');
    expect(headers[3]).toHaveTextContent('Views');
  });

  it('should display correct data in table rows', () => {
    renderComponent();
    const rows = screen.getAllByRole('row').slice(1);

    expect(within(rows[0]).getByText('devhub')).toBeInTheDocument();
    expect(within(rows[0]).getByText('Component')).toBeInTheDocument();
    expect(within(rows[0]).getByText('Yesterday')).toBeInTheDocument();
    expect(within(rows[0]).getByText('2,233')).toBeInTheDocument();
  });

  it('should handle pagination correctly', async () => {
    renderComponent();
    const select = screen.getByRole('combobox');

    await user.click(select);
    await user.click(screen.getByText('Top 5'));

    expect(screen.getByText('Top catalog entities')).toBeInTheDocument();
  });

  it('should create correct entity links', () => {
    renderComponent();
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute(
      'href',
      '/catalog/Component/default/devhub',
    );
  });

  it('should format view counts correctly', () => {
    renderComponent();
    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('2,233')).toBeInTheDocument();
    expect(within(rows[1]).getByText('1,974')).toBeInTheDocument();
  });

  it('should apply correct styling to table rows', () => {
    renderComponent();
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows[0]).toHaveStyle({ backgroundColor: 'inherit' });
  });
});
