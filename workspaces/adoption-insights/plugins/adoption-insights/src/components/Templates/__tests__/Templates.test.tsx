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

import Templates from '../Templates';

// Mock translation hooks
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

jest.mock('../../Trans', () => ({
  Trans: MockTrans,
}));

jest.mock('../../../hooks/useTemplates', () => ({
  useTemplates: () => ({
    templates: {
      data: Array.from({ length: 6 }, (_, i) => ({
        entityref: `template:default/example-go-template-${i + 1}`,
        count: (i + 1) * 10,
      })),
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
  ...jest.requireActual('@backstage/core-plugin-api'),
  useRouteRef: () => (params: any) =>
    `/create/${params.kind}/${params.namespace}/${params.name}`,
}));

jest.mock('../../../utils/constants', () => ({
  TEMPLATE_TABLE_HEADERS: [
    { id: 'name', titleKey: 'table.headers.name' },
    { id: 'executions', titleKey: 'table.headers.executions' },
  ],
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

describe('Templates', () => {
  const theme = createTheme();
  const user = userEvent.setup();

  const renderComponent = () => {
    return render(
      <ThemeProvider theme={theme}>
        <Templates />
      </ThemeProvider>,
    );
  };

  /** Helper function to verify table headers */
  const verifyHeaders = (expectedHeaders: string[]) => {
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(expectedHeaders.length);
    expectedHeaders.forEach((header, index) => {
      expect(headers[index]).toHaveTextContent(header);
    });
  };

  /** Helper function to verify table row data */
  const verifyTableData = (expectedData: string[][]) => {
    const rows = screen.getAllByRole('row').slice(1);
    expectedData.forEach((rowData, rowIndex) => {
      rowData.forEach(text => {
        expect(within(rows[rowIndex]).getByText(text)).toBeInTheDocument();
      });
    });
  };

  /** Helper function to verify entity links */
  const verifyEntityLinks = (expectedLinks: string[]) => {
    const links = screen.getAllByRole('link');
    expectedLinks.forEach((link, index) => {
      expect(links[index]).toHaveAttribute('href', link);
    });
  };

  it('should render the component with initial data', () => {
    renderComponent();
    expect(screen.getByText('Top 3 templates')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(5);
  });

  // eslint-disable-next-line jest/expect-expect
  it('should display correct table headers', () => {
    renderComponent();
    verifyHeaders(['Name', 'Executions']);
  });

  // eslint-disable-next-line jest/expect-expect
  it('should display correct data in table rows', () => {
    renderComponent();
    verifyTableData([
      ['example-go-template-1', '10'],
      ['example-go-template-2', '20'],
    ]);
  });

  it('should handle pagination correctly', async () => {
    renderComponent();
    const select = screen.getByRole('combobox');

    await user.click(select);
    await user.click(screen.getByText('Top 5'));

    expect(screen.getByText('Top 5 templates')).toBeInTheDocument();
  });

  // eslint-disable-next-line jest/expect-expect
  it('should create correct entity links', () => {
    renderComponent();
    verifyEntityLinks([
      '/create/templates/default/example-go-template-1',
      '/create/templates/default/example-go-template-2',
    ]);
  });

  it('should apply correct styling to table rows', () => {
    renderComponent();
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows[0]).toHaveStyle({ backgroundColor: 'inherit' });
  });
});
