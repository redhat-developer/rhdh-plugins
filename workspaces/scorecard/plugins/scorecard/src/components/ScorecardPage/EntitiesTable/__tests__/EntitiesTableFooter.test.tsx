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
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { EntitiesTableFooter } from '../EntitiesTableFooter';

const mockT = jest.fn((key: string, params?: { count?: string }) => {
  if (key === 'entitiesPage.entitiesTableFooter.rows_other' && params?.count) {
    return `${params.count} rows`;
  }
  if (key === 'entitiesPage.entitiesTableFooter.allRows') return 'All';
  return key;
});

jest.mock('../../../../hooks/useTranslation', () => ({
  useTranslation: () => ({ t: mockT }),
}));

jest.mock('../EntitiesTablePagination', () => ({
  EntitiesTablePagination: (props: any) => (
    <div
      data-testid="entities-table-pagination"
      data-count={props.count}
      data-page={props.page}
    />
  ),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

describe('EntitiesTableFooter', () => {
  const defaultProps = {
    count: 10,
    page: 0,
    rowsPerPage: 5,
    handleChangePage: jest.fn(),
    handleChangeRowsPerPage: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render TablePagination with count, page, and rowsPerPage', () => {
    render(
      <TestWrapper>
        <EntitiesTableFooter {...defaultProps} />
      </TestWrapper>,
    );

    expect(screen.getByTestId('entities-table-pagination')).toBeInTheDocument();
    expect(screen.getByTestId('entities-table-pagination')).toHaveAttribute(
      'data-count',
      '10',
    );
    expect(screen.getByTestId('entities-table-pagination')).toHaveAttribute(
      'data-page',
      '0',
    );
  });
});
