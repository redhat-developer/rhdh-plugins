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
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { mockUseTranslation } from '../../../test-utils/mockTranslations';
import { TemplateSectionContent } from '../TemplateSection';
import { useEntities } from '../../../hooks/useEntities';

jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => mockUseTranslation(),
}));

jest.mock('../../../hooks/useEntities');

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
  Link: ({ to, children }: { to: string; children: ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

jest.mock('../../Trans', () => ({
  Trans: ({ message }: { message: string }) => <span>{message}</span>,
}));

jest.mock('../TemplateCard', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => (
    <div data-testid="template-card">{title}</div>
  ),
}));

jest.mock('../ViewMoreLink', () => ({
  ViewMoreLink: ({ children }: { children: ReactNode }) => (
    <span>{children}</span>
  ),
}));

const mockUseEntities = useEntities as jest.MockedFunction<typeof useEntities>;
const theme = createTheme();

const renderSection = () =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <TemplateSectionContent />
      </MemoryRouter>
    </ThemeProvider>,
  );

describe('TemplateSectionContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state', () => {
    mockUseEntities.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    renderSection();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseEntities.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('fetch failed'),
    });

    renderSection();

    expect(screen.getByText('Could not fetch data.')).toBeInTheDocument();
    expect(screen.getByText('Error: fetch failed')).toBeInTheDocument();
  });

  it('renders template cards and view all link', () => {
    mockUseEntities.mockReturnValue({
      data: {
        items: [
          {
            apiVersion: 'scaffolder.backstage.io/v1beta3',
            kind: 'Template',
            metadata: {
              name: 'nodejs',
              namespace: 'default',
              title: 'Node.js Template',
              description: 'Scaffold a Node.js service',
            },
            spec: { type: 'service' },
          },
        ],
        totalItems: 5,
        pageInfo: {},
      },
      isLoading: false,
      error: undefined,
    });

    renderSection();

    expect(screen.getByTestId('template-card')).toHaveTextContent(
      'Node.js Template',
    );
    expect(screen.getByText('templates.viewAll')).toBeInTheDocument();
  });

  it('renders empty state when no templates exist', () => {
    mockUseEntities.mockReturnValue({
      data: {
        items: [],
        totalItems: 0,
        pageInfo: {},
      },
      isLoading: false,
      error: undefined,
    });

    renderSection();

    expect(screen.getByText('No templates added yet')).toBeInTheDocument();
    expect(screen.getByText('Register a template')).toBeInTheDocument();
  });
});
