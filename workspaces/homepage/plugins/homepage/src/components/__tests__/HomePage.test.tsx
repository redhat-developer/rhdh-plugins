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

import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { TestApiProvider } from '@backstage/test-utils';
import { identityApiRef } from '@backstage/core-plugin-api';

import { mockUseTranslation } from '../../test-utils/mockTranslations';
import { HomePage } from '../HomePage';
import { useDefaultWidgets } from '../../hooks/useDefaultWidgets';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => mockUseTranslation(),
}));

jest.mock('../../hooks/useDefaultWidgets');

jest.mock('../Header', () => ({
  Header: ({ title }: { title?: string }) => (
    <div data-testid="header">{title}</div>
  ),
}));

jest.mock('../HomePageStylesProvider', () => ({
  HomePageStylesProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock('../CustomizableGrid', () => ({
  CustomizableGrid: () => <div data-testid="customizable-grid" />,
}));

jest.mock('../ReadOnlyGrid', () => ({
  ReadOnlyGrid: () => <div data-testid="read-only-grid" />,
}));

jest.mock('../DefaultWidgetsCustomizableGrid', () => ({
  DefaultWidgetsCustomizableGrid: () => (
    <div data-testid="default-widgets-customizable-grid" />
  ),
}));

jest.mock('../DefaultWidgetsReadOnlyGrid', () => ({
  DefaultWidgetsReadOnlyGrid: () => (
    <div data-testid="default-widgets-read-only-grid" />
  ),
}));

jest.mock('@backstage/core-components', () => ({
  Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Content: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Progress: () => <div data-testid="progress" />,
  EmptyState: ({ title }: { title: string }) => (
    <div data-testid="empty-state">{title}</div>
  ),
}));

const mockUseDefaultWidgets = useDefaultWidgets as jest.MockedFunction<
  typeof useDefaultWidgets
>;

const MockCard = () => createElement('div');
const mountPoints = [{ Component: MockCard, config: { id: 'card-1' } }];

const renderHomePage = (customizable: boolean) =>
  render(
    <TestApiProvider
      apis={[
        [
          identityApiRef,
          {
            getProfileInfo: async () => ({}),
            getBackstageIdentity: async () => ({
              type: 'user' as const,
              userEntityRef: 'user:default/guest',
              ownershipEntityRefs: [],
            }),
            getCredentials: async () => ({ token: undefined }),
          },
        ],
      ]}
    >
      <HomePage mountPoints={mountPoints} customizable={customizable} />
    </TestApiProvider>,
  );

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows progress while default widgets are loading', () => {
    mockUseDefaultWidgets.mockReturnValue({
      defaultWidgets: undefined,
      loading: true,
      error: undefined,
    });

    renderHomePage(false);

    expect(screen.getByTestId('progress')).toBeInTheDocument();
  });

  it('renders default widgets customizable grid', () => {
    mockUseDefaultWidgets.mockReturnValue({
      defaultWidgets: [{ id: 'headline', ref: 'homepage.headline' }],
      loading: false,
      error: undefined,
    });

    renderHomePage(true);

    expect(
      screen.getByTestId('default-widgets-customizable-grid'),
    ).toBeInTheDocument();
  });

  it('renders default widgets read-only grid', () => {
    mockUseDefaultWidgets.mockReturnValue({
      defaultWidgets: [{ id: 'headline', ref: 'homepage.headline' }],
      loading: false,
      error: undefined,
    });

    renderHomePage(false);

    expect(
      screen.getByTestId('default-widgets-read-only-grid'),
    ).toBeInTheDocument();
  });

  it('shows empty state when default widgets list is empty', () => {
    mockUseDefaultWidgets.mockReturnValue({
      defaultWidgets: [],
      loading: false,
      error: undefined,
    });

    renderHomePage(false);

    expect(screen.getByTestId('empty-state')).toHaveTextContent(
      'No home page widgets configured or found.',
    );
  });

  it('renders customizable grid when no default widgets and customizable', () => {
    mockUseDefaultWidgets.mockReturnValue({
      defaultWidgets: undefined,
      loading: false,
      error: undefined,
    });

    renderHomePage(true);

    expect(screen.getByTestId('customizable-grid')).toBeInTheDocument();
  });

  it('renders read-only grid when no default widgets and not customizable', () => {
    mockUseDefaultWidgets.mockReturnValue({
      defaultWidgets: undefined,
      loading: false,
      error: undefined,
    });

    renderHomePage(false);

    expect(screen.getByTestId('read-only-grid')).toBeInTheDocument();
  });

  it('shows empty state when no mount points and no default widgets', () => {
    mockUseDefaultWidgets.mockReturnValue({
      defaultWidgets: undefined,
      loading: false,
      error: undefined,
    });

    render(
      <TestApiProvider
        apis={[
          [
            identityApiRef,
            {
              getProfileInfo: async () => ({}),
              getBackstageIdentity: async () => ({
                type: 'user' as const,
                userEntityRef: 'user:default/guest',
                ownershipEntityRefs: [],
              }),
              getCredentials: async () => ({ token: undefined }),
            },
          ],
        ]}
      >
        <HomePage mountPoints={[]} customizable />
      </TestApiProvider>,
    );

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });
});
