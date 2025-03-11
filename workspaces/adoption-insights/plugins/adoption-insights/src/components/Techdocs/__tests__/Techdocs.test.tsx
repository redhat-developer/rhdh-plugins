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

import Techdocs from '../Techdocs';

jest.mock('../../../hooks/useTechdocs', () => ({
  useTechdocs: () => ({
    techdocs: {
      data: [
        {
          entityRef: 'component:default/test-doc-1',
          count: 100,
          last_used: '2024-02-20T10:00:00Z',
        },
        {
          entityRef: 'component:default/test-doc-2',
          count: 75,
          last_used: '2024-02-19T15:30:00Z',
        },
        {
          entityRef: 'service:default/test-doc-3',
          count: 50,
          last_used: '2024-02-18T09:15:00Z',
        },
        {
          entityRef: 'website:default/test-doc-4',
          count: 25,
          last_used: '2024-02-17T14:45:00Z',
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
  TECHDOCS_TABLE_HEADERS: [
    { id: 'name', title: 'Name' },
    { id: 'kind', title: 'Kind' },
    { id: 'lastUsed', title: 'Last Used' },
    { id: 'count', title: 'Views' },
  ],
}));

jest.mock('../../../utils/utils', () => ({
  getLastUsedDay: () => 'Yesterday',
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

describe('Techdocs', () => {
  const theme = createTheme();
  const user = userEvent.setup();

  const renderComponent = () => {
    return render(
      <ThemeProvider theme={theme}>
        <Techdocs />
      </ThemeProvider>,
    );
  };

  it('should render the component with initial data', () => {
    renderComponent();
    expect(screen.getByText('Top 3 techdocs')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(5);
  });

  it('should display correct table headers', () => {
    renderComponent();
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(4);
    expect(headers[0]).toHaveTextContent('Name');
    expect(headers[1]).toHaveTextContent('Kind');
    expect(headers[2]).toHaveTextContent('Last Used');
    expect(headers[3]).toHaveTextContent('Views');
  });

  it('should display correct data in table rows', () => {
    renderComponent();
    const rows = screen.getAllByRole('row').slice(1);

    expect(within(rows[0]).getByText('test-doc-1')).toBeInTheDocument();
    expect(within(rows[0]).getByText('component')).toBeInTheDocument();
    expect(within(rows[0]).getByText('Yesterday')).toBeInTheDocument();
    expect(within(rows[0]).getByText('100')).toBeInTheDocument();
  });

  it('should handle pagination correctly', async () => {
    renderComponent();
    const select = screen.getByRole('combobox');

    await user.click(select);
    await user.click(screen.getByText('Top 5'));

    expect(screen.getByText('Top 5 techdocs')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(6);
  });

  it('should create correct entity links', () => {
    renderComponent();
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute(
      'href',
      '/catalog/component/default/test-doc-1',
    );
  });

  it('should format view counts correctly', () => {
    renderComponent();
    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('100')).toBeInTheDocument();
    expect(within(rows[1]).getByText('75')).toBeInTheDocument();
  });

  it('should apply correct styling to table rows', () => {
    renderComponent();
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows[0]).toHaveStyle({ backgroundColor: 'inherit' });
  });
});
