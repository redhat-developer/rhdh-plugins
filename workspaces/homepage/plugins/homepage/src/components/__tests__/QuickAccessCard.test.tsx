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
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { mockUseTranslation } from '../../test-utils/mockTranslations';
import { QuickAccessCard, QuickAccessCardContent } from '../QuickAccessCard';
import { useQuickAccessLinks } from '../../hooks/useQuickAccessLinks';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => mockUseTranslation(),
}));

jest.mock('../../hooks/useQuickAccessLinks');

jest.mock('@backstage/core-components', () => ({
  CodeSnippet: ({ text }: { text: string }) => <pre>{text}</pre>,
  WarningPanel: ({
    children,
    title,
  }: {
    children: ReactNode;
    title: string;
  }) => (
    <div>
      <span>{title}</span>
      {children}
    </div>
  ),
  InfoCard: ({ title, children }: { title: string; children: ReactNode }) => (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));

jest.mock('@backstage/plugin-home', () => ({
  HomePageToolkit: ({ title }: { title: string }) => (
    <div data-testid="toolkit">{title}</div>
  ),
  ComponentAccordion: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock('../QuickAccessIcon', () => ({
  QuickAccessIcon: () => <span>icon</span>,
}));

const mockUseQuickAccessLinks = useQuickAccessLinks as jest.MockedFunction<
  typeof useQuickAccessLinks
>;

const quickAccessData = [
  {
    title: 'Community',
    isExpanded: true,
    links: [
      {
        iconUrl: '/icons/web.png',
        label: 'Website',
        url: 'https://example.com',
      },
    ],
  },
];

const theme = createTheme();

describe('QuickAccessCardContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state', () => {
    mockUseQuickAccessLinks.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    render(
      <ThemeProvider theme={theme}>
        <QuickAccessCardContent />
      </ThemeProvider>,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error state when data is unavailable', () => {
    mockUseQuickAccessLinks.mockReturnValue({
      data: undefined,
      error: new Error('fetch failed'),
      isLoading: false,
    });

    render(
      <ThemeProvider theme={theme}>
        <QuickAccessCardContent />
      </ThemeProvider>,
    );

    expect(screen.getByText('Could not fetch data.')).toBeInTheDocument();
    expect(screen.getByText('Error: fetch failed')).toBeInTheDocument();
  });

  it('renders quick access toolkits when data is available', () => {
    mockUseQuickAccessLinks.mockReturnValue({
      data: quickAccessData,
      error: undefined,
      isLoading: false,
    });

    render(
      <ThemeProvider theme={theme}>
        <QuickAccessCardContent path="/quick-access" />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('toolkit')).toHaveTextContent('Community');
    expect(mockUseQuickAccessLinks).toHaveBeenCalledWith('/quick-access');
  });
});

describe('QuickAccessCard', () => {
  beforeEach(() => {
    mockUseQuickAccessLinks.mockReturnValue({
      data: quickAccessData,
      error: undefined,
      isLoading: false,
    });
  });

  it('renders with default translated title', () => {
    render(
      <ThemeProvider theme={theme}>
        <QuickAccessCard />
      </ThemeProvider>,
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Quick Access',
    );
    expect(screen.getByTestId('toolkit')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(
      <ThemeProvider theme={theme}>
        <QuickAccessCard title="My Links" />
      </ThemeProvider>,
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'My Links',
    );
  });
});
