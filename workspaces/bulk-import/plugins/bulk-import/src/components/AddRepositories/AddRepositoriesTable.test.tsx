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

import { identityApiRef } from '@backstage/core-plugin-api';
import { TestApiProvider } from '@backstage/test-utils';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { useFormikContext } from 'formik';

import { mockGetRepositories } from '../../mocks/mockData';
import { ApprovalTool, RepositorySelection } from '../../types';
import { AddRepositoriesTable } from './AddRepositoriesTable';

// Mock all the dependencies
jest.mock('formik', () => ({
  ...jest.requireActual('formik'),
  useFormikContext: jest.fn(),
}));

jest.mock('../../hooks', () => ({
  useRepositories: jest.fn(() => ({
    loading: false,
    data: null,
    error: undefined,
  })),
  useNumberOfApprovalTools: jest.fn(() => ({
    numberOfApprovalTools: 1,
  })),
  useTranslation: jest.fn(() => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'addRepositories.selectedLabel': 'Selected',
        'addRepositories.selectedRepositories': 'repositories',
        'addRepositories.selectedProjects': 'projects',
      };
      return translations[key] || key;
    },
  })),
}));

// Mock the child components to avoid complex dependencies
jest.mock('./AddRepositoriesTableToolbar', () => ({
  AddRepositoriesTableToolbar: ({ title }: { title: string }) => (
    <div data-testid="table-toolbar">{title}</div>
  ),
}));

// Mock the RepositoriesTable to simulate loading and data states
jest.mock('./RepositoriesTable', () => ({
  RepositoriesTable: jest.fn(() => (
    <div data-testid="repositories-table">Repositories Table</div>
  )),
}));

jest.mock('./ApprovalTool', () => ({
  __esModule: true,
  default: () => <div data-testid="approval-tool">Approval Tool</div>,
}));

describe('AddRepositoriesTable', () => {
  const mockIdentityApi = {
    getBackstageIdentity: jest.fn().mockResolvedValue({
      type: 'user',
      userEntityRef: 'user:default/test',
      ownershipEntityRefs: [],
    }),
  };

  const mockFormikContext = {
    values: {
      repositories: {},
      repositoryType: RepositorySelection.Repository,
      approvalTool: ApprovalTool.Git,
    },
    setFieldValue: jest.fn(),
    errors: {},
  };

  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    (useFormikContext as jest.Mock).mockReturnValue(mockFormikContext);
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TestApiProvider apis={[[identityApiRef, mockIdentityApi]]}>
          <AddRepositoriesTable {...props} />
        </TestApiProvider>
      </QueryClientProvider>,
    );
  };

  it('should show approval tool when numberOfApprovalTools is greater than 1', () => {
    const { useNumberOfApprovalTools } = require('../../hooks');
    useNumberOfApprovalTools.mockReturnValue({
      numberOfApprovalTools: 2,
    });

    renderComponent();

    expect(screen.getByTestId('approval-tool')).toBeInTheDocument();
  });

  it('should show projects label when approval tool is gitlab', () => {
    const gitlabFormikContext = {
      ...mockFormikContext,
      values: {
        ...mockFormikContext.values,
        approvalTool: ApprovalTool.Gitlab,
      },
    };

    (useFormikContext as jest.Mock).mockReturnValue(gitlabFormikContext);

    renderComponent();

    expect(screen.getByText('Selected projects')).toBeInTheDocument();
  });

  it('should render list of repositories', () => {
    const { useRepositories } = require('../../hooks');

    // Mock repositories data
    useRepositories.mockReturnValue({
      loading: false,
      data: {
        repositories: mockGetRepositories.repositories.reduce(
          (acc, r) => ({ ...acc, [r.id]: r }),
          {},
        ),
        totalRepositories: mockGetRepositories.repositories.length,
        totalOrganizations: 0,
      },
      error: undefined,
    });

    // Mock formik context with selected repositories
    (useFormikContext as jest.Mock).mockReturnValue({
      ...mockFormikContext,
      values: {
        ...mockFormikContext.values,
        repositories: {
          [mockGetRepositories.repositories[0].id]:
            mockGetRepositories.repositories[0],
        },
      },
    });

    // Mock RepositoriesTable to show it received the data
    const { RepositoriesTable } = require('./RepositoriesTable');
    (RepositoriesTable as jest.Mock).mockImplementation(() => (
      <div data-testid="repositories-table">
        Repository: {mockGetRepositories.repositories[0].repoName}
      </div>
    ));

    renderComponent({ title: 'Selected repositories' });

    expect(screen.getByTestId('repositories-table')).toBeInTheDocument();
    expect(
      screen.getByText(
        `Repository: ${mockGetRepositories.repositories[0].repoName}`,
      ),
    ).toBeInTheDocument();
  });
});
