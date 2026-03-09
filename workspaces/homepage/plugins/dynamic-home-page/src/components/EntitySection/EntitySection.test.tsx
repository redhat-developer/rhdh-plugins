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

import { EntitySection } from './EntitySection';
import { useEntities } from '../../hooks/useEntities';

jest.mock('../../hooks/useEntities');
const mockUseEntities = useEntities as jest.MockedFunction<typeof useEntities>;

jest.mock('@backstage/plugin-user-settings', () => ({
  useUserProfile: () => ({
    displayName: 'Test User',
    loading: false,
  }),
}));

jest.mock('@backstage/plugin-catalog-react', () => ({
  EntityRefLink: ({ children }: { children: ReactNode }) => (
    <span>{children}</span>
  ),
}));

jest.mock('@backstage/core-components', () => ({
  CodeSnippet: ({ text }: { text: string }) => <pre>{text}</pre>,
  WarningPanel: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  Link: ({ children, to }: { children: ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  MarkdownContent: ({ content }: { content: string }) => <span>{content}</span>,
}));

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../Trans', () => ({
  Trans: ({ message }: { message: string }) => <span>{message}</span>,
}));

jest.mock('./ViewMoreLink', () => ({
  ViewMoreLink: ({ children }: { children: ReactNode }) => (
    <span>{children}</span>
  ),
}));

jest.mock('../../utils/utils', () => ({
  hasEntityIllustrationUserDismissed: () => true,
  addDismissedEntityIllustrationUsers: jest.fn(),
}));

jest.mock('../../images/homepage-entities-1.svg', () => 'mock-image.svg');

const theme = createTheme();

const renderComponent = () =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <EntitySection />
      </MemoryRouter>
    </ThemeProvider>,
  );

describe('<EntitySection />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays entity title when metadata.title is set', () => {
    mockUseEntities.mockReturnValue({
      data: {
        items: [
          {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: {
              name: 'my-component-name',
              title: 'My Component Title',
              namespace: 'default',
            },
            spec: {},
          },
        ],
        totalItems: 1,
        pageInfo: {},
      },
      isLoading: false,
      error: undefined,
    });

    renderComponent();

    expect(screen.getByText('My Component Title')).toBeInTheDocument();
    expect(screen.queryByText('my-component-name')).not.toBeInTheDocument();
  });

  it('displays entity name when metadata.title is not set', () => {
    mockUseEntities.mockReturnValue({
      data: {
        items: [
          {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: {
              name: 'my-component-name',
              namespace: 'default',
            },
            spec: {},
          },
        ],
        totalItems: 1,
        pageInfo: {},
      },
      isLoading: false,
      error: undefined,
    });

    renderComponent();

    expect(screen.getByText('my-component-name')).toBeInTheDocument();
  });

  it('displays title for entities with title and name for entities without', () => {
    mockUseEntities.mockReturnValue({
      data: {
        items: [
          {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: {
              name: 'component-with-title',
              title: 'Component With Title',
              namespace: 'default',
            },
            spec: {},
          },
          {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'API',
            metadata: {
              name: 'api-without-title',
              namespace: 'default',
            },
            spec: {},
          },
        ],
        totalItems: 2,
        pageInfo: {},
      },
      isLoading: false,
      error: undefined,
    });

    renderComponent();

    expect(screen.getByText('Component With Title')).toBeInTheDocument();
    expect(screen.queryByText('component-with-title')).not.toBeInTheDocument();
    expect(screen.getByText('api-without-title')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseEntities.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    renderComponent();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
