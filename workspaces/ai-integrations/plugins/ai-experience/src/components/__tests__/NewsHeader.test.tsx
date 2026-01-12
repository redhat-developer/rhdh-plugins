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
import { render, screen } from '@testing-library/react';
import { NewsHeader } from '../NewsPage/NewsHeader';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { lightTheme } from '@backstage/theme';
import { mockUseTranslation } from '../../test-utils/mockTranslations';

// Mock dependencies
jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => mockUseTranslation(),
}));

jest.mock('@backstage/core-components', () => ({
  ...jest.requireActual('@backstage/core-components'),
  Header: ({ title, pageTitleOverride }: any) => (
    <div data-testid="header">
      <h1>{pageTitleOverride}</h1>
      {title}
    </div>
  ),
}));

const theme = createTheme(lightTheme);

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('NewsHeader', () => {
  it('renders the NewsHeader with translated title', () => {
    renderWithTheme(<NewsHeader />);

    // Check that "AI News" appears in the header
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getAllByText('AI News')).toHaveLength(2); // pageTitleOverride and title
  });
});
