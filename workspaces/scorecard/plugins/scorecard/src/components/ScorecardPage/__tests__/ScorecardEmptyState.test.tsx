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
import { BrowserRouter } from 'react-router-dom';

import ScorecardEmptyState from '../ScorecardEmptyState';

jest.mock('../../../images/no-scorecard.svg', () => 'mocked-no-scorecard.svg');

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = createTheme();
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </BrowserRouter>
  );
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(component, { wrapper: TestWrapper });
};

describe('ScorecardEmptyState', () => {
  it('should render the main heading', () => {
    renderWithProviders(<ScorecardEmptyState />);

    expect(screen.getByText('No scorecards added yet')).toBeInTheDocument();
  });

  it('should render the description text', () => {
    renderWithProviders(<ScorecardEmptyState />);

    expect(
      screen.getByText(
        'Scorecards help you monitor component health at a glance. To begin, explore our documentation for setup guidelines.',
      ),
    ).toBeInTheDocument();
  });

  it('should render the documentation button with correct text', () => {
    renderWithProviders(<ScorecardEmptyState />);

    const button = screen.getByRole('button', { name: /view documentation/i });
    expect(button).toBeInTheDocument();
  });

  it('should render the OpenInNewOutlined icon', () => {
    renderWithProviders(<ScorecardEmptyState />);

    const button = screen.getByRole('button', { name: /view documentation/i });
    expect(button).toBeInTheDocument();

    const icon = button.querySelector(
      'svg[data-testid="OpenInNewOutlinedIcon"]',
    );
    expect(icon).toBeInTheDocument();
  });

  it('should render the no-scorecard image', () => {
    renderWithProviders(<ScorecardEmptyState />);

    const image = screen.getByAltText('No scorecards');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'mocked-no-scorecard.svg');
  });
});
