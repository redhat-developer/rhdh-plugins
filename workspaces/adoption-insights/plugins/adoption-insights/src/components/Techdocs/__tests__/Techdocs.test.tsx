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

import Techdocs from '../Techdocs';

// Mock translation hooks
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

jest.mock('../../Trans', () => ({
  Trans: MockTrans,
}));

const types = ['component', 'component', 'service', 'website'];
const names = ['test-doc-1', 'test-doc-2', 'test-doc-3', 'test-doc-4'];
const namespaces = ['default', 'default', 'default', 'default'];
const counts = [100, 75, 50, 25];
const lastUsedDates = [
  '2025-02-20T10:00:00Z',
  '2025-02-19T15:30:00Z',
  '2025-02-18T09:15:00Z',
  '2025-02-17T14:45:00Z',
];

jest.mock('../../../hooks/useTechdocs', () => ({
  useTechdocs: () => ({
    techdocs: {
      data: types.map((type, i) => ({
        entityref: `${type}:default/${names[i]}`,
        count: counts[i],
        last_used: lastUsedDates[i],
        kind: types[i],
        name: names[i],
        namespace: namespaces[i],
      })),
    },
    loading: false,
  }),
}));

jest.mock('../../../hooks/useEntityMetadataMap', () => ({
  useEntityMetadataMap: () => ({
    entityMetadataMap: {
      'Component:default/test-doc-1': { title: 'Test Doc One' },
      'Component:default/test-doc-2': { title: 'Test Doc Two' },
      'Service:default/test-doc-3': { title: 'Test Doc Three' },
      'Website:default/test-doc-4': { title: 'Test Doc Four' },
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
  TECHDOCS_TABLE_HEADERS: [
    { id: 'name', titleKey: 'table.headers.name' },
    { id: 'kind', titleKey: 'table.headers.kind' },
    { id: 'lastUsed', titleKey: 'table.headers.lastUsed' },
    { id: 'count', titleKey: 'table.headers.views' },
  ],
}));

jest.mock('../../../utils/utils', () => ({
  getLastUsedDay: () => 'Yesterday',
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

describe('Techdocs', () => {
  const theme = createTheme();
  const user = userEvent.setup();

  beforeEach(() => {
    render(
      <ThemeProvider theme={theme}>
        <Techdocs />
      </ThemeProvider>,
    );
  });

  it('should render the component with initial data', () => {
    expect(screen.getByText('Top 3 TechDocs')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(5);
  });

  it('should display correct table headers', () => {
    const headers = screen.getAllByRole('columnheader');
    const expectedHeaders = ['Name', 'Kind', 'Last used', 'Views'];

    expect(headers).toHaveLength(expectedHeaders.length);

    expectedHeaders.forEach((text, index) => {
      expect(headers[index]).toHaveTextContent(text);
    });
  });

  it('should handle pagination correctly', async () => {
    const select = screen.getByRole('combobox');

    await user.click(select);
    await user.click(screen.getByText('All'));

    expect(screen.getByText('All TechDocs')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(6);
  });

  it('should create correct entity links', () => {
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute(
      'href',
      '/docs/default/component/test-doc-1',
    );
  });

  it('should format view counts correctly', () => {
    const rows = screen.getAllByRole('row').slice(1);
    const expectedRowData = ['100', '75'];

    expectedRowData.forEach((text, index) => {
      expect(within(rows[index]).getByText(text)).toBeInTheDocument();
    });
  });

  it('should apply correct styling to table rows', () => {
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows[0]).toHaveStyle({ backgroundColor: 'inherit' });
  });
});
