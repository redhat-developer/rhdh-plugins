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
import type { ReactNode } from 'react';

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import {
  MockTrans,
  mockUseTranslation,
} from '../../../test-utils/mockTranslations';

import CatalogEntities from '../CatalogEntities';

// Mock translation hooks
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

jest.mock('../../Trans', () => ({
  Trans: MockTrans,
}));

const ids = ['1', '2', '3', '4', '5', '6'];
const names = [
  'devhub',
  'hg-dev-hub-starter',
  'netbox',
  'devhub',
  'hg-dev-hub-starter',
  'netbox',
];
const kinds = [
  'Component',
  'Component',
  'API',
  'Component',
  'Component',
  'API',
];
const lastUsedDates = [
  '2025-03-06T06:25:16.708Z',
  '2025-03-05T06:25:16.708Z',
  '2025-03-04T06:25:16.708Z',
  '2025-03-01T06:25:16.708Z',
  '2025-03-06T06:25:16.708Z',
  '2025-03-06T06:25:16.708Z',
];
const counts = [2233, 1974, 1863, 2233, 1974, 1863];

jest.mock('../../../hooks/useCatalogEntities', () => ({
  useCatalogEntities: () => ({
    catalogEntities: {
      data: ids.map((id, i) => ({
        plugin_id: id,
        name: names[i],
        kind: kinds[i],
        last_used: lastUsedDates[i],
        count: counts[i],
        namespace: 'default',
      })),
    },
    loading: false,
  }),
}));

jest.mock('../../../hooks/useEntityMetadataMap', () => ({
  useEntityMetadataMap: () => ({
    entityMetadataMap: {
      'Component:default/devhub': {
        title: 'Dev Hub',
        description: 'Dev hub description',
        kind: 'Component',
      },
      'Component:default/hg-dev-hub-starter': {
        title: 'HG Dev Hub Starter',
        description: 'HG dev hub starter',
        kind: 'Component',
      },
      'API:default/netbox': {
        title: 'Netbox API',
        description: 'Netbox API description',
        kind: 'API',
      },
    },
  }),
}));

jest.mock('@backstage/catalog-model', () => ({
  parseEntityRef: (ref: string) => {
    const [kind, name] = ref.split(':')[0].split('/');
    return { kind, name: name || ref.split('/')[1] };
  },
  stringifyEntityRef: (entity: {
    kind: string;
    namespace?: string;
    name: string;
  }) => `${entity.kind}:${entity.namespace || 'default'}/${entity.name}`,
}));

jest.mock('@backstage/plugin-catalog-react', () => ({
  entityRouteRef: 'entityRouteRef',
}));

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useRouteRef: () => (params: any) =>
    `/catalog/${params.kind}/${params.namespace}/${params.name}`,
}));

jest.mock('../../../utils/constants', () => ({
  CATALOG_ENTITIES_TABLE_HEADERS: [
    { id: 'name', titleKey: 'table.headers.name' },
    { id: 'kind', titleKey: 'table.headers.kind' },
    { id: 'last-used', titleKey: 'table.headers.lastUsed' },
    { id: 'views', titleKey: 'table.headers.views' },
  ],
  CATALOG_ENTITIES_TITLE: 'Top catalog entities',
}));

jest.mock('../../../utils/utils', () => ({
  getLastUsedDay: () => 'Yesterday',
  getUniqueCatalogEntityKinds: jest.fn(),
}));

jest.mock('../../CardWrapper', () => ({
  __esModule: true,
  default: ({ children, title }: { children: ReactNode; title: string }) => (
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
    expect(screen.getByText('Top 3 catalog entities')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(5);
  });

  it('should display correct table headers', () => {
    renderComponent();
    const headers = screen.getAllByRole('columnheader');
    const expectedHeaders = ['Name', 'Kind', 'Last used', 'Views'];

    expect(headers).toHaveLength(expectedHeaders.length);

    expectedHeaders.forEach((text, index) => {
      expect(headers[index]).toHaveTextContent(text);
    });
  });

  it('should display correct data in table rows', () => {
    renderComponent();
    const rows = screen.getAllByRole('row').slice(1);
    const expectedRowData = [
      ['Dev Hub', 'Component', 'Yesterday', '2,233'],
      ['HG Dev Hub Starter', 'Component', 'Yesterday', '1,974'],
      ['Netbox API', 'API', 'Yesterday', '1,863'],
    ];

    expectedRowData.forEach((rowData, rowIndex) => {
      rowData.forEach(text => {
        expect(within(rows[rowIndex]).getByText(text)).toBeInTheDocument();
      });
    });
  });

  it('should handle pagination correctly', async () => {
    renderComponent();
    const select = screen.getByRole('combobox');

    await user.click(select);
    await user.click(screen.getByText('Top 5'));

    expect(screen.getByText('Top 5 catalog entities')).toBeInTheDocument();
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
