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
import { render, screen, waitFor } from '@testing-library/react';
import { AiExperienceHomePage } from '../AiExperienceHomePage/AiExperienceHomePage';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { identityApiRef } from '@backstage/core-plugin-api';
import { TestApiProvider } from '@backstage/test-utils';
import { mockUseTranslation } from '../../test-utils/mockTranslations';

// Mock dependencies
jest.mock('@backstage/core-plugin-api', () => {
  return {
    ...jest.requireActual('@backstage/core-plugin-api'),
    useApi: jest.fn(),
  };
});

jest.mock('react-use', () => ({
  useAsync: jest.fn(),
}));

jest.mock('../../hooks/useGreeting', () => ({
  __esModule: true,
  default: jest.fn(() => 'Good morning'),
}));

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => mockUseTranslation(),
}));

// Mock Backstage components
jest.mock('@backstage/core-components', () => ({
  ...jest.requireActual('@backstage/core-components'),
  Content: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="content">{children}</div>
  ),
  Page: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page">{children}</div>
  ),
}));

// Mock the child components with correct paths
jest.mock('../LearnSection/LearnSection', () => ({
  LearnSection: () => <div data-testid="learn-section">Learn Section</div>,
}));

jest.mock('../ModelSection/ModelSection', () => ({
  ModelSection: () => <div data-testid="model-section">Model Section</div>,
}));

jest.mock('../TemplateSection/TemplateSection', () => ({
  TemplateSection: () => (
    <div data-testid="template-section">Template Section</div>
  ),
}));

jest.mock('../SectionWrapper', () => ({
  __esModule: true,
  default: ({ title, children }: any) => (
    <div data-testid="section-wrapper">
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));

jest.mock('@backstage/core-components', () => ({
  ...jest.requireActual('@backstage/core-components'),
  Page: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page">{children}</div>
  ),
}));

const queryClient = new QueryClient();
const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <TestApiProvider
      apis={[
        [
          identityApiRef,
          {
            getProfileInfo: () => Promise.resolve({ displayName: 'Test User' }),
          },
        ],
      ]}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>{component}</ThemeProvider>
      </QueryClientProvider>
    </TestApiProvider>,
  );
};

describe('AiExperienceHomePage', () => {
  const mockUseApi = require('@backstage/core-plugin-api').useApi;
  const mockUseAsync = require('react-use').useAsync;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApi.mockReturnValue({
      getProfileInfo: jest.fn().mockResolvedValue({ displayName: 'Test User' }),
    });
    mockUseAsync.mockReturnValue({ value: { displayName: 'Test User' } });
  });

  it('renders the greeting with display name', async () => {
    renderWithProviders(<AiExperienceHomePage />);
    await waitFor(() => {
      expect(screen.getByText('Good morning Test User!')).toBeInTheDocument();
    });
  });

  it('renders the greeting with "Guest" if no display name', async () => {
    mockUseAsync.mockReturnValue({ value: null });

    renderWithProviders(<AiExperienceHomePage />);
    await waitFor(() => {
      expect(screen.getByText('Good morning Guest!')).toBeInTheDocument();
    });
  });

  it('renders "Explore AI models" section', () => {
    renderWithProviders(<AiExperienceHomePage />);
    expect(screen.getByText('Explore AI models')).toBeInTheDocument();
  });

  it('renders "Explore AI templates" section', () => {
    renderWithProviders(<AiExperienceHomePage />);
    expect(screen.getByText('Explore AI templates')).toBeInTheDocument();
  });
});
