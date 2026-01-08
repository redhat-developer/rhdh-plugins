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

import { configApiRef, identityApiRef } from '@backstage/core-plugin-api';
import { permissionApiRef } from '@backstage/plugin-permission-react';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen } from '@testing-library/react';

import { bulkImportApiRef } from '../../api/BulkImportBackendClient';
import { useNumberOfApprovalTools, useRepositories } from '../../hooks';
import { useImportFlow } from '../../hooks/useImportFlow';
import { AddRepositoriesPage } from './AddRepositoriesPage';

jest.mock('../../hooks', () => ({
  useNumberOfApprovalTools: jest.fn(),
  useRepositories: jest.fn(),
}));

jest.mock('../../hooks/useImportFlow', () => ({
  useImportFlow: jest.fn(),
}));

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'page.title': 'Bulk import',
        'page.importEntitiesSubtitle': 'Import to Red Hat Developer Hub',
        'steps.chooseApprovalTool':
          'Choose a source control tool for pull request creation',
        'steps.chooseRepositories': 'Choose which items you want to import',
        'steps.generateCatalogInfo':
          'Generate a catalog-info.yaml file for each selected item',
        'steps.editPullRequest': 'View the pull/merge request details',
        'steps.trackStatus': 'Track the approval status',
      };
      return translations[key] || key;
    },
  })),
}));

// Mock the heavy child components to make tests faster
jest.mock('./AddRepositoriesForm', () => ({
  AddRepositoriesForm: () => (
    <div data-testid="add-repositories-form">Mocked AddRepositoriesForm</div>
  ),
}));

jest.mock('./Illustrations', () => ({
  Illustrations: ({ iconText }: { iconText: string }) => (
    <div data-testid="illustrations">{iconText}</div>
  ),
}));

const mockConfigApi = {
  getOptionalString: jest.fn(() => undefined),
};

const mockIdentityApi = {
  getBackstageIdentity: jest
    .fn()
    .mockResolvedValue({ userEntityRef: 'user:default/testuser' }),
};

const mockBulkImportApi = {
  getImportAction: jest.fn(),
  dataFetcher: jest.fn(),
};

const mockPermissionApi = {
  authorize: jest.fn().mockResolvedValue({ result: 'ALLOW' }),
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return renderInTestApp(
    <TestApiProvider
      apis={[
        [configApiRef, mockConfigApi],
        [identityApiRef, mockIdentityApi],
        [bulkImportApiRef, mockBulkImportApi],
        [permissionApiRef, mockPermissionApi],
      ]}
    >
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    </TestApiProvider>,
  );
};

describe('AddRepositoriesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set common mocks that most tests need
    (useNumberOfApprovalTools as jest.Mock).mockReturnValue({
      numberOfApprovalTools: 2,
    });
    (useImportFlow as jest.Mock).mockReturnValue('open-pull-requests');
    (useRepositories as jest.Mock).mockReturnValue({
      loading: false,
      data: [],
      error: null,
    });
  });

  it('should render page with correct title', async () => {
    await renderWithProviders(<AddRepositoriesPage />);

    expect(screen.getByText('Bulk import')).toBeInTheDocument();
    expect(screen.getByTestId('add-repositories-form')).toBeInTheDocument();
  });

  it('should show instructions section for pull request flow', async () => {
    await renderWithProviders(<AddRepositoriesPage />);

    // Instructions section should be shown for pull request flow
    expect(
      screen.getByText(
        'Choose a source control tool for pull request creation',
      ),
    ).toBeInTheDocument();
  });

  it('should show all steps including edit pull request for pull request flow', async () => {
    await renderWithProviders(<AddRepositoriesPage />);

    // All steps should be shown for pull request flow (both GitHub and GitLab)
    expect(
      screen.getByText(
        'Choose a source control tool for pull request creation',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('View the pull/merge request details'),
    ).toBeInTheDocument();
  });

  it('should hide instructions section when no integrations are configured', async () => {
    // Override default to test missing integrations scenario
    (useNumberOfApprovalTools as jest.Mock).mockReturnValue({
      numberOfApprovalTools: 0, // No integrations configured
    });

    await renderWithProviders(<AddRepositoriesPage />);

    // Instructions section should be hidden when no integrations are configured
    expect(
      screen.queryByText('Import to Red Hat Developer Hub'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'Choose a source control tool for pull request creation',
      ),
    ).not.toBeInTheDocument();

    // Form should still be rendered (it will show missing configurations)
    expect(screen.getByTestId('add-repositories-form')).toBeInTheDocument();
  });

  it('should hide instructions section for scaffolder flow', async () => {
    // Override default to test scaffolder flow
    (useImportFlow as jest.Mock).mockReturnValue('scaffolder');

    await renderWithProviders(<AddRepositoriesPage />);

    // Instructions section should be hidden for scaffolder flow
    expect(
      screen.queryByText('Import to Red Hat Developer Hub'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'Choose a source control tool for pull request creation',
      ),
    ).not.toBeInTheDocument();

    // Form should still be rendered
    expect(screen.getByTestId('add-repositories-form')).toBeInTheDocument();
  });
});
