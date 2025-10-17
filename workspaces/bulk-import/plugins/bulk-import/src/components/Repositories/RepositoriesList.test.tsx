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
import { permissionApiRef } from '@backstage/plugin-permission-react';
import {
  mockApis,
  renderInTestApp,
  TestApiProvider,
} from '@backstage/test-utils';

import { screen } from '@testing-library/react';
import { useFormikContext } from 'formik';

import {
  BulkImportAPI,
  bulkImportApiRef,
} from '../../api/BulkImportBackendClient';
import { useAddedRepositories } from '../../hooks';
import { mockGetImportJobs, mockGetRepositories } from '../../mocks/mockData';
import { TaskStatus } from '../../types';
import { RepositoriesList } from './RepositoriesList';

jest.mock('./RepositoriesList', () => ({
  ...jest.requireActual('./RepositoriesList'),
  useStyles: jest.fn().mockReturnValue({ empty: 'empty' }),
}));

jest.mock('formik', () => ({
  ...jest.requireActual('formik'),
  useFormikContext: jest.fn(),
}));

jest.mock('../../hooks/useAddedRepositories', () => ({
  useAddedRepositories: jest.fn(),
}));

const mockIdentityApi = {
  getBackstageIdentity: jest
    .fn()
    .mockResolvedValue({ userEntityRef: 'user:default/testuser' }),
};

const mockAsyncData = {
  loading: false,
  data: {
    addedRepositories: mockGetImportJobs.imports.map(item => ({
      id: item.id,
      task: {
        id: item.task?.taskId || '',
        status: 'TASK_COMPLETED' as TaskStatus,
      },
    })),
    totalJobs: mockGetImportJobs.imports.length,
  },
  totalCount: 1,
  error: undefined,
  refetch: jest.fn(),
};

const mockUseAddedRepositories = useAddedRepositories as jest.MockedFunction<
  typeof useAddedRepositories
>;

describe('RepositoriesList', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should have an add button and an Added repositories table', async () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      status: null,
      setFieldValue: jest.fn(),
      values: mockGetRepositories,
    });
    mockUseAddedRepositories.mockReturnValue(mockAsyncData);
    await renderInTestApp(
      <TestApiProvider
        apis={[
          [identityApiRef, mockIdentityApi],
          [bulkImportApiRef, {} as BulkImportAPI],
          [permissionApiRef, mockApis.permission()],
        ]}
      >
        <RepositoriesList />
      </TestApiProvider>,
    );
    const addRepoButton = screen.getByText('Add');
    expect(addRepoButton).toBeInTheDocument();
    expect(
      screen.getByText('Added repositories (4)', { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('import-jobs')).toBeInTheDocument();
  });

  it('should render the component and display empty content when no data', async () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      status: null,
      setFieldValue: jest.fn(),
    });
    mockUseAddedRepositories.mockReturnValue({
      ...mockAsyncData,
      data: { addedRepositories: [], totalJobs: 0 },
    });
    await renderInTestApp(
      <TestApiProvider
        apis={[
          [identityApiRef, mockIdentityApi],
          [bulkImportApiRef, {} as BulkImportAPI],
        ]}
      >
        <RepositoriesList />
      </TestApiProvider>,
    );

    expect(
      screen.getByText('Added repositories', { exact: false }),
    ).toBeInTheDocument();
    const emptyMessage = screen.getByTestId('no-import-jobs-found');
    expect(emptyMessage).toBeInTheDocument();
    expect(emptyMessage).toHaveTextContent('No records found');
  });

  it('should display an alert in case of any errors', async () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      status: {
        title: 'Not found',
        url: 'https://xyz',
      },
      setFieldValue: jest.fn(),
    });
    mockUseAddedRepositories.mockReturnValue({
      ...mockAsyncData,
      data: { addedRepositories: [], totalJobs: 0 },
    });
    await renderInTestApp(
      <TestApiProvider
        apis={[
          [identityApiRef, mockIdentityApi],
          [bulkImportApiRef, {} as BulkImportAPI],
        ]}
      >
        <RepositoriesList />
      </TestApiProvider>,
    );
    const addRepoButton = screen.getByText('Add');
    expect(addRepoButton).toBeInTheDocument();
    expect(screen.getByText('Not found https://xyz')).toBeInTheDocument();
  });
});
