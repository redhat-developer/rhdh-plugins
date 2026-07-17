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
import { TestApiProvider } from '@backstage/test-utils';
import { identityApiRef } from '@backstage/core-plugin-api';

import { mockUseTranslation } from '../../test-utils/mockTranslations';
import { Header } from '../Header';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => mockUseTranslation(),
}));

jest.mock('../LocalClock', () => ({
  LocalClock: ({ label }: { label?: string }) => (
    <div data-testid="local-clock">{label}</div>
  ),
}));

jest.mock('@backstage/core-components', () => ({
  Header: ({
    title,
    subtitle,
    pageTitleOverride,
    children,
  }: {
    title: string;
    subtitle?: string;
    pageTitleOverride?: string;
    children?: React.ReactNode;
  }) => (
    <div data-testid="backstage-header">
      <h1>{title}</h1>
      {subtitle && <p data-testid="subtitle">{subtitle}</p>}
      {pageTitleOverride && (
        <span data-testid="page-title">{pageTitleOverride}</span>
      )}
      {children}
    </div>
  ),
}));

jest.mock('@backstage/plugin-home', () => ({
  HeaderWorldClock: () => <div data-testid="world-clock" />,
}));

const renderHeader = (
  props: React.ComponentProps<typeof Header> = {},
  profile?: { displayName?: string },
) =>
  render(
    <TestApiProvider
      apis={[
        [
          identityApiRef,
          {
            getProfileInfo: async () => profile ?? {},
            getBackstageIdentity: async () => ({
              type: 'user',
              userEntityRef: 'user:default/guest',
              ownershipEntityRefs: [],
            }),
            getCredentials: async () => ({ token: undefined }),
          },
        ],
      ]}
    >
      <Header {...props} />
    </TestApiProvider>,
  );

describe('Header', () => {
  it('renders default welcome title when no profile', async () => {
    renderHeader();

    expect(await screen.findByText('Welcome back!')).toBeInTheDocument();
  });

  it('renders personalized welcome when profile has displayName', async () => {
    renderHeader({}, { displayName: 'Jane Doe' });

    expect(await screen.findByText('Welcome back, Jane!')).toBeInTheDocument();
  });

  it('uses custom title with variable interpolation', async () => {
    renderHeader(
      { title: 'Hello {{firstName}}!' },
      { displayName: 'Jane Doe' },
    );

    expect(await screen.findByText('Hello Jane!')).toBeInTheDocument();
  });

  it('strips placeholders from custom title when no displayName', async () => {
    renderHeader({ title: 'Hello {{firstName}}!' });

    expect(await screen.findByText('Hello !')).toBeInTheDocument();
  });

  it('uses personalizedTitle when profile is available', async () => {
    renderHeader(
      { personalizedTitle: 'Hi {{displayName}}' },
      { displayName: 'Jane Doe' },
    );

    expect(await screen.findByText('Hi Jane Doe')).toBeInTheDocument();
  });

  it('renders subtitle with interpolation', async () => {
    renderHeader(
      { subtitle: 'Welcome {{firstName}}' },
      { displayName: 'Jane Doe' },
    );

    expect(await screen.findByTestId('subtitle')).toHaveTextContent(
      'Welcome Jane',
    );
  });

  it('renders local clock and world clocks when configured', async () => {
    renderHeader({
      localClock: { format: 'time' },
      worldClocks: [{ label: 'NYC', timeZone: 'America/New_York' }],
    });

    expect(await screen.findByTestId('local-clock')).toHaveTextContent('Local');
    expect(screen.getByTestId('world-clock')).toBeInTheDocument();
  });
});
