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

import { BrowserRouter } from 'react-router-dom';
import { useAsync } from 'react-use';

import {
  ApiRef,
  configApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';
import { TestApiProvider } from '@backstage/test-utils';

import { render } from '@testing-library/react';
import { useFormikContext } from 'formik';

import { bulkImportApiRef } from '../../api/BulkImportBackendClient';
import { useRepositories } from '../../hooks';
import { mockGetImportJobs, mockGetRepositories } from '../../mocks/mockData';
import { ImportJobStatus, RepositorySelection } from '../../types';
import { AddRepositoriesTable } from './AddRepositoriesTable';

jest.mock('formik', () => ({
  ...jest.requireActual('formik'),
  useFormikContext: jest.fn(),
}));

const configMock = {
  getOptionalString: jest.fn(() => undefined),
};

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn((apiRef: ApiRef<any>) => {
    if (apiRef === bulkImportApiRef) {
      return {
        getImportAction: jest.fn(),
      };
    }
    if (apiRef === configApiRef) {
      return configMock;
    }
    return undefined;
  }),
}));

jest.mock('react-use', () => ({
  ...jest.requireActual('react-use'),
  useAsync: jest.fn().mockReturnValue({ loading: false }),
}));

jest.mock('../../hooks', () => ({
  useRepositories: jest.fn(),
  useNumberOfApprovalTools: jest.fn(() => ({
    numberOfApprovalTools: 1,
    isGitHubConfigured: true,
    isGitLabConfigured: false,
  })),
  useGitlabConfigured: jest.fn(() => false),
}));

class MockBulkImportApi {
  async getImportAction(
    repo: string,
    _defaultBranch: string,
  ): Promise<ImportJobStatus | Response> {
    return mockGetImportJobs.imports.find(
      i => i.repository.url === repo,
    ) as ImportJobStatus;
  }
}

const mockUseRepositories = useRepositories as jest.MockedFunction<
  typeof useRepositories
>;

const mockBulkImportApi = new MockBulkImportApi();

describe('Add Repositories Table', () => {
  const mockIdentityApi = {
    getBackstageIdentity: jest.fn(),
  };
  mockIdentityApi.getBackstageIdentity.mockResolvedValue({
    type: 'user',
    userEntityRef: 'user:default/foo',
    ownershipEntityRefs: [],
  });

  it('should show Circular progress when data is loading', async () => {
    const mockAsyncData = {
      loading: false,
      value: {
        status: null,
      },
    };
    (useAsync as jest.Mock).mockReturnValue(mockAsyncData);
    (useFormikContext as jest.Mock).mockReturnValue({
      errors: {},
      values: {
        repositories: {},
        repositoryType: RepositorySelection.Repository,
      },
    });
    mockUseRepositories.mockReturnValue({
      loading: true,
      data: null,
      error: undefined,
    });
    const { getByText, getByTestId } = render(
      <TestApiProvider apis={[[identityApiRef, mockIdentityApi]]}>
        <BrowserRouter>
          <AddRepositoriesTable title="Selected repositories" />
        </BrowserRouter>
      </TestApiProvider>,
    );
    expect(getByText('Selected repositories (0)')).toBeInTheDocument();
    expect(getByTestId('repositories-table-loading')).toBeTruthy();
  });

  it('should render list of repositories', async () => {
    const mockAsyncData = {
      loading: false,
      value: {
        status: null,
      },
    };
    (useAsync as jest.Mock).mockReturnValue(mockAsyncData);
    (useFormikContext as jest.Mock).mockReturnValue({
      errors: {},
      values: {
        repositories: {
          'org/dessert/Cupcake': mockGetRepositories.repositories[0],
        },
        repositoryType: RepositorySelection.Repository,
      },
    });
    mockUseRepositories.mockReturnValue({
      loading: false,
      data: {
        repositories: mockGetRepositories.repositories.reduce(
          (acc, r) => ({ ...acc, [r.id]: r }),
          {},
        ),
        totalRepositories: 10,
        totalOrganizations: 0,
      },
      error: undefined,
    });
    const { getByText, getByTestId } = render(
      <TestApiProvider
        apis={[
          [identityApiRef, mockIdentityApi],
          [bulkImportApiRef, mockBulkImportApi],
        ]}
      >
        <BrowserRouter>
          <AddRepositoriesTable title="Selected repositories" />
        </BrowserRouter>
      </TestApiProvider>,
    );
    expect(getByText('Selected repositories (1)')).toBeInTheDocument();
    expect(getByTestId('repositories-table')).toBeTruthy();
  });
});
