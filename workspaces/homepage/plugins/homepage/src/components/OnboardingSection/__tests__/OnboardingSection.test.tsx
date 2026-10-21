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
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { TestApiProvider } from '@backstage/test-utils';
import { catalogApiRef } from '@backstage/plugin-catalog-react';

import { mockUseTranslation } from '../../../test-utils/mockTranslations';
import {
  OnboardingSectionContent,
  useOnboardingSection,
} from '../OnboardingSection';

jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => mockUseTranslation(),
}));

jest.mock('@backstage/plugin-user-settings', () => ({
  useUserProfile: () => ({
    displayName: 'Test User',
    backstageIdentity: { userEntityRef: 'user:default/test-user' },
    loading: false,
  }),
}));

jest.mock('../../../hooks/useGreeting', () => ({
  __esModule: true,
  default: () => 'Good morning',
}));

jest.mock('../../../images/homepage-illustration-dark.svg', () => 'dark.svg');
jest.mock('../../../images/homepage-illustration-light.svg', () => 'light.svg');

jest.mock('../OnboardingCard', () => ({
  __esModule: true,
  default: ({
    title,
    description,
    buttonText,
  }: {
    title: string;
    description: string;
    buttonText: string;
  }) => (
    <div data-testid="onboarding-card">
      <span>{title}</span>
      <span>{description}</span>
      <span>{buttonText}</span>
    </div>
  ),
}));

const theme = createTheme();

const catalogUserEntity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: { name: 'catalog-user', title: 'Catalog User' },
  spec: { profile: { displayName: 'Catalog User' } },
};

const renderWithProviders = (
  ui: ReactNode,
  getEntityByRef: jest.Mock = jest.fn().mockResolvedValue(catalogUserEntity),
) =>
  render(
    <TestApiProvider apis={[[catalogApiRef, { getEntityByRef }]]}>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </TestApiProvider>,
  );

describe('OnboardingSectionContent', () => {
  it('renders greeting and learning cards', async () => {
    renderWithProviders(<OnboardingSectionContent />);

    await waitFor(() => {
      expect(
        screen.getByText(/Good morning, Catalog User!/),
      ).toBeInTheDocument();
    });

    expect(screen.getAllByTestId('onboarding-card').length).toBeGreaterThan(0);
    expect(screen.getByText('Get started')).toBeInTheDocument();
  });
});

describe('useOnboardingSection', () => {
  const HookHarness = () => {
    const { greetingLine } = useOnboardingSection();
    return <div data-testid="greeting">{greetingLine}</div>;
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('prefers catalog display name over entity-ref profile displayName', async () => {
    jest
      .spyOn(require('@backstage/plugin-user-settings'), 'useUserProfile')
      .mockReturnValue({
        displayName: 'user:default/test-user',
        backstageIdentity: { userEntityRef: 'user:default/test-user' },
        loading: false,
      });

    const getEntityByRef = jest.fn().mockResolvedValue(catalogUserEntity);
    renderWithProviders(<HookHarness />, getEntityByRef);

    await waitFor(() => {
      expect(screen.getByTestId('greeting')).toHaveTextContent(
        'Good morning, Catalog User!',
      );
    });

    // Entity-ref formatting would yield "Test-user" if catalog were ignored.
    expect(screen.getByTestId('greeting')).not.toHaveTextContent('Test-user');
    expect(getEntityByRef).toHaveBeenCalledWith('user:default/test-user');
  });
});
