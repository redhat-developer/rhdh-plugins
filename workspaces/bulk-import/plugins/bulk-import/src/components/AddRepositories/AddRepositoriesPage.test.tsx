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
import { AddRepositoriesPage } from './AddRepositoriesPage';

jest.mock('../../hooks', () => ({
  useNumberOfApprovalTools: jest.fn(),
  useGitlabConfigured: jest.fn(() => false),
  useRepositories: jest.fn(() => ({ loading: false, data: [], error: null })),
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
  });

  it('should render page with correct title', async () => {
    const { useNumberOfApprovalTools } = require('../../hooks');
    useNumberOfApprovalTools.mockReturnValue({
      numberOfApprovalTools: 2,
    });

    await renderWithProviders(<AddRepositoriesPage />);

    expect(screen.getByText('Bulk import')).toBeInTheDocument();
    expect(screen.getByTestId('add-repositories-form')).toBeInTheDocument();
  });

  it('should show first step when multiple approval tools are configured', async () => {
    const { useNumberOfApprovalTools } = require('../../hooks');
    useNumberOfApprovalTools.mockReturnValue({
      numberOfApprovalTools: 2,
    });

    await renderWithProviders(<AddRepositoriesPage />);

    expect(
      screen.getByText(
        'Choose a source control tool for pull request creation',
      ),
    ).toBeInTheDocument();
  });

  it('should hide first step when only one approval tool is configured', async () => {
    const { useNumberOfApprovalTools } = require('../../hooks');
    useNumberOfApprovalTools.mockReturnValue({
      numberOfApprovalTools: 1,
    });

    await renderWithProviders(<AddRepositoriesPage />);

    expect(
      screen.queryByText(
        'Choose a source control tool for pull request creation',
      ),
    ).not.toBeInTheDocument();
  });

  it('should hide first step when no approval tools are configured', async () => {
    const { useNumberOfApprovalTools } = require('../../hooks');
    useNumberOfApprovalTools.mockReturnValue({
      numberOfApprovalTools: 0,
    });

    await renderWithProviders(<AddRepositoriesPage />);

    expect(
      screen.queryByText(
        'Choose a source control tool for pull request creation',
      ),
    ).not.toBeInTheDocument();
  });
});
