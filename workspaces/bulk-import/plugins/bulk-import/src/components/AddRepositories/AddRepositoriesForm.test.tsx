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

import { BrowserRouter as Router } from 'react-router-dom';

import { configApiRef, identityApiRef } from '@backstage/core-plugin-api';
import { MockConfigApi, TestApiProvider } from '@backstage/test-utils';

import { useDrawer } from '@janus-idp/shared-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { useFormikContext } from 'formik';

import { bulkImportApiRef } from '../../api/BulkImportBackendClient';
import { mockGetImportJobs, mockGetRepositories } from '../../mocks/mockData';
import {
  ImportJobStatus,
  OrgAndRepoResponse,
  RepositorySelection,
} from '../../types';
import { AddRepositories } from './AddRepositories';

jest.mock('formik', () => ({
  ...jest.requireActual('formik'),
  useFormikContext: jest.fn(),
}));

jest.mock('./AddRepositoriesForm', () => ({
  ...jest.requireActual('./AddRepositoriesForm'),
  useStyles: jest.fn().mockReturnValue({
    body: 'body',
    approvalTool: 'approvaltool',
    approvalToolTooltip: 'approvalToolTooltip',
  }),
}));

jest.mock('@janus-idp/shared-react', () => ({
  ...jest.requireActual('@janus-idp/shared-react'),
  useDrawer: jest.fn(),
}));

jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  makeStyles: () => () => {
    return {
      body: 'body',
      approvalTool: 'approvaltool',
      approvalToolTooltip: 'approvalToolTooltip',
    };
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for testing
      },
    },
  });
let queryClient: QueryClient;

class MockBulkImportApi {
  async getImportAction(
    repo: string,
    _defaultBranch: string,
  ): Promise<ImportJobStatus | Response> {
    return mockGetImportJobs.imports.find(
      i => i.repository.url === repo,
    ) as ImportJobStatus;
  }
  async dataFetcher(
    _pageNo: number,
    _size: number,
    _searchString: string,
  ): Promise<OrgAndRepoResponse> {
    return mockGetRepositories;
  }
}

const mockBulkImportApi = new MockBulkImportApi();

const mockIdentityApi = {
  getBackstageIdentity: jest
    .fn()
    .mockResolvedValue({ userEntityRef: 'user:default/testuser' }),
};

beforeEach(() => {
  (useFormikContext as jest.Mock).mockReturnValue({
    values: {
      repositoryType: RepositorySelection.Repository,
    },
    setFieldValue: jest.fn(),
  });
  queryClient = createTestQueryClient();
});

describe('AddRepositoriesForm', () => {
  it('should render the repositories list with the footer', async () => {
    (useDrawer as jest.Mock).mockImplementation(initial => ({
      initial,
      setOpenDrawer: jest.fn(),
      setDrawerData: jest.fn(),
    }));
    render(
      <Router>
        <TestApiProvider
          apis={[
            [identityApiRef, mockIdentityApi],
            [bulkImportApiRef, mockBulkImportApi],
            [
              configApiRef,
              new MockConfigApi({
                catalog: {
                  import: {
                    entityFilename: 'test.yaml',
                  },
                },
              }),
            ],
          ]}
        >
          <QueryClientProvider client={queryClient}>
            <AddRepositories error={null} />
          </QueryClientProvider>
        </TestApiProvider>
      </Router>,
    );
    expect(
      screen.getByText('Selected repositories (0)', { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('add-repository-footer')).toBeInTheDocument();

    expect(screen.queryByTestId('preview-pullrequest-sidebar')).toBeFalsy();
  });

  it('should show any load errors', async () => {
    (useDrawer as jest.Mock).mockReturnValue({
      openDrawer: true,
      drawerData: mockGetRepositories.repositories[0],
      setOpenDrawer: jest.fn(),
      setDrawerData: jest.fn(),
    });
    render(
      <Router>
        <TestApiProvider
          apis={[
            [identityApiRef, mockIdentityApi],
            [bulkImportApiRef, mockBulkImportApi],
            [
              configApiRef,
              new MockConfigApi({
                catalog: {
                  import: {
                    entityFilename: 'test.yaml',
                  },
                },
              }),
            ],
          ]}
        >
          <QueryClientProvider client={queryClient}>
            <AddRepositories error={{ err: 'error occurred' }} />
          </QueryClientProvider>
        </TestApiProvider>
      </Router>,
    );
    expect(screen.getByText('error occurred')).toBeTruthy();
    expect(
      screen.getByText('Selected repositories (0)', { exact: false }),
    ).toBeInTheDocument();
  });
});
