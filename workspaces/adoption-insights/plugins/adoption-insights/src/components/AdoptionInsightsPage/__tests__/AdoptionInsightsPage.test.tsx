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

import { screen, waitFor } from '@testing-library/react';
import { useTheme } from '@mui/material/styles';
import { IdentityApi, identityApiRef } from '@backstage/core-plugin-api';
import { usePermission } from '@backstage/plugin-permission-react';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';

import {
  MockTrans,
  mockUseTranslation,
} from '../../../test-utils/mockTranslations';
import { AdoptionInsightsPage } from '../AdoptionInsightsPage';

// Mock translation hooks
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

jest.mock('../../Trans', () => ({
  Trans: MockTrans,
}));

jest.mock('@mui/material/styles', () => ({
  ...jest.requireActual('@mui/material/styles'),
  useTheme: jest.fn(),
}));

jest.mock('@mui/material/useMediaQuery', () => jest.fn());

jest.mock('../../Header', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-header">Header</div>,
}));

jest.mock('../../CatalogEntities', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-catalog-entities">CatalogEntities</div>,
}));

jest.mock('../../Templates', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-templates">Templates</div>,
}));

jest.mock('../../Techdocs', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-techdocs">Techdocs</div>,
}));

jest.mock('../../ActiveUsers', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-active-users">ActiveUsers</div>,
}));

jest.mock('../../Plugins', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-plugins">Plugins</div>,
}));

jest.mock('../../Searches', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-searches">Searches</div>,
}));

jest.mock('../../Users', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-users">Users</div>,
}));

jest.mock('@backstage/core-components', () => ({
  Content: ({ children }: { children: ReactNode }) => (
    <div data-testid="mock-content">{children}</div>
  ),
  Page: ({ children }: { children: ReactNode }) => (
    <div data-testid="mock-page">{children}</div>
  ),
}));

jest.mock('@backstage/plugin-permission-react', () => ({
  usePermission: jest.fn(),
  RequirePermission: jest.fn(),
}));

jest.mock('../../Common/PermissionRequiredState', () => ({
  __esModule: true,
  default: () => (
    <div data-testid="mock-permission-state">Missing permissions</div>
  ),
}));

const identityApi = {
  async getCredentials() {
    return { token: 'test-token' };
  },
} as IdentityApi;

const mockUsePermission = usePermission as jest.MockedFunction<
  typeof usePermission
>;

describe('AdoptionInsightsPage', () => {
  const mockTheme = {
    breakpoints: {
      down: jest.fn(),
      up: jest.fn(),
      between: jest.fn(),
    },
  };

  beforeEach(() => {
    (useTheme as jest.Mock).mockReturnValue(mockTheme);
  });

  it('should not display components if permission checks are in loading phase', async () => {
    mockUsePermission.mockReturnValue({ loading: true, allowed: true });

    await renderInTestApp(
      <TestApiProvider apis={[[identityApiRef, identityApi]]}>
        <AdoptionInsightsPage />
      </TestApiProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('Adoption Insights')).not.toBeInTheDocument();
    });
  });

  it('should display missing permissions alert', async () => {
    mockUsePermission.mockReturnValue({ loading: false, allowed: false });

    await renderInTestApp(
      <TestApiProvider apis={[[identityApiRef, identityApi]]}>
        <AdoptionInsightsPage />
      </TestApiProvider>,
    );

    screen.debug();
    await waitFor(() => {
      expect(screen.getByText('Missing permissions')).toBeInTheDocument();
    });
  });

  it('should display all components', async () => {
    mockUsePermission.mockReturnValue({ loading: false, allowed: true });

    await renderInTestApp(
      <TestApiProvider apis={[[identityApiRef, identityApi]]}>
        <AdoptionInsightsPage />
      </TestApiProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('mock-page')).toBeInTheDocument();
      expect(screen.getByTestId('mock-content')).toBeInTheDocument();
      expect(screen.getByTestId('mock-header')).toBeInTheDocument();
      expect(screen.getByTestId('mock-active-users')).toBeInTheDocument();
      expect(screen.getByTestId('mock-users')).toBeInTheDocument();
      expect(screen.getByTestId('mock-templates')).toBeInTheDocument();
      expect(screen.getByTestId('mock-catalog-entities')).toBeInTheDocument();
      expect(screen.getByTestId('mock-plugins')).toBeInTheDocument();
      expect(screen.getByTestId('mock-techdocs')).toBeInTheDocument();
      expect(screen.getByTestId('mock-searches')).toBeInTheDocument();
    });
  });
});
