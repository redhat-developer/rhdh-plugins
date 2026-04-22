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

import { EntitiesTableWrapper } from '../EntitiesTableWrapper';

jest.mock('../../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      key === 'metric.drillDownCalculationFailures'
        ? 'Calculation failed for one or more entities'
        : key,
  }),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

describe('EntitiesTableWrapper', () => {
  it('should render title and children', () => {
    render(
      <TestWrapper>
        <EntitiesTableWrapper title="Entities">
          <div data-testid="table-content">Table content</div>
        </EntitiesTableWrapper>
      </TestWrapper>,
    );

    expect(screen.getByText('Entities')).toBeInTheDocument();
    expect(screen.getByTestId('table-content')).toHaveTextContent(
      'Table content',
    );
  });

  it('should not render calculation warning icon by default', () => {
    const { container } = render(
      <TestWrapper>
        <EntitiesTableWrapper title="Entities">
          <span>Content</span>
        </EntitiesTableWrapper>
      </TestWrapper>,
    );

    expect(
      container.querySelector('.MuiSvgIcon-colorWarning'),
    ).not.toBeInTheDocument();
  });

  it('should render calculation warning icon when showCalculationWarning', () => {
    const { container } = render(
      <TestWrapper>
        <EntitiesTableWrapper title="Entities" showCalculationWarning>
          <span>Content</span>
        </EntitiesTableWrapper>
      </TestWrapper>,
    );

    expect(
      container.querySelector('.MuiSvgIcon-colorWarning'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Calculation failed for one or more entities'),
    ).toBeInTheDocument();
  });
});
