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

import { configApiRef, errorApiRef } from '@backstage/core-plugin-api';
import { translationApiRef } from '@backstage/core-plugin-api/alpha';
import { CatalogApi, catalogApiRef } from '@backstage/plugin-catalog-react';
import {
  mockApis,
  MockConfigApi,
  MockErrorApi,
  TestApiProvider,
} from '@backstage/test-utils';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useFormikContext } from 'formik';

import { bulkImportApiRef } from '../../api/BulkImportBackendClient';
import { mockGetImportJobs, mockGetRepositories } from '../../mocks/mockData';
import { mockEntities } from '../../mocks/mockEntities';
import { ApprovalTool, ImportJobStatus } from '../../types';
import { getPRTemplate } from '../../utils/repository-utils';
import { PreviewPullRequestForm } from './PreviewPullRequestForm';

jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  makeStyles: () => () => {
    return {
      previewCard: 'previewcard',
      previewCardContent: 'previewcardcontent',
    };
  },
}));

jest.mock('formik', () => ({
  ...jest.requireActual('formik'),
  useFormikContext: jest.fn(),
}));

jest.mock('react-use', () => ({
  ...jest.requireActual('react-use'),
  useAsync: jest.fn().mockReturnValue({ loading: false }),
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

const mockBulkImportApi = new MockBulkImportApi();

const mockCatalogApi: Partial<CatalogApi> = {
  getEntities: jest.fn().mockReturnValue(mockEntities),
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <TestApiProvider
      apis={[
        [errorApiRef, new MockErrorApi()],
        [translationApiRef, mockApis.translation()],
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
        [catalogApiRef, mockCatalogApi],
        [bulkImportApiRef, mockBulkImportApi],
      ]}
    >
      {ui}
    </TestApiProvider>,
  );
};

describe('Preview Pull Request Form', () => {
  // Enable this test when Service Now approval tool is supported
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('should render the servicenow ticket preview', async () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      errors: {},
      values: {
        repositories: {
          'org/dessert/cupcake': mockGetRepositories.repositories[0],
        },
        approvalTool: ApprovalTool.ServiceNow,
      },
    });

    const { getByText, getByPlaceholderText } = renderWithProviders(
      <PreviewPullRequestForm
        repoId="org/dessert/cupcake"
        repoUrl="https://github.com/org/dessert/cupcake"
        pullRequest={{
          cupcake: getPRTemplate(
            'org/dessert/cupcake',
            'org/dessert',
            'user:default/guest',
            'https://localhost:3001',
            'https://github.com/org/dessert/cupcake',
            'main',
            'github',
          ),
        }}
        setFormErrors={() => jest.fn()}
        formErrors={{}}
        setPullRequest={() => jest.fn()}
      />,
    );
    expect(getByText(/ServiceNow ticket details/i)).toBeInTheDocument();
    expect(getByText(/Preview ServiceNow ticket/i)).toBeInTheDocument();
    expect(getByText(/Preview entities/i)).toBeInTheDocument();
    expect(getByPlaceholderText(/Component Name/)).toHaveValue('cupcake');
  });

  it('should render the pull request preview form', async () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      errors: {},
      values: {
        repositories: {
          'org/dessert/cupcake': mockGetRepositories.repositories[0],
        },
        approvalTool: ApprovalTool.Git,
      },
    });

    const { getByText, getByPlaceholderText } = renderWithProviders(
      <PreviewPullRequestForm
        repoId="org/dessert/cupcake"
        repoUrl="https://github.com/org/dessert/cupcake"
        pullRequest={{
          'org/dessert/cupcake': getPRTemplate(
            'org/dessert/cupcake',
            'org/dessert',
            'user:default/guest',
            'https://localhost:3001',
            'https://github.com/org/dessert/cupcake',
            'main',
            'github',
          ),
        }}
        setFormErrors={() => jest.fn()}
        formErrors={{}}
        setPullRequest={() => jest.fn()}
      />,
    );
    expect(getByText(/Pull request details/i)).toBeInTheDocument();
    expect(getByText(/Preview pull request/i)).toBeInTheDocument();
    expect(getByText(/Preview entities/i)).toBeInTheDocument();
    expect(getByPlaceholderText(/groups and users/)).toBeInTheDocument();
  });

  it('should show field error if PR title/component name field is empty', async () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      errors: {},
      values: {
        repositories: {
          'org/dessert/cupcake': mockGetRepositories.repositories[0],
        },
        approvalTool: ApprovalTool.Git,
      },
    });

    const setFormErrors = jest.fn();

    const { getByPlaceholderText } = renderWithProviders(
      <PreviewPullRequestForm
        repoId="org/dessert/cupcake"
        repoUrl="https://github.com/org/dessert/cupcake"
        pullRequest={{
          'org/dessert/cupcake': getPRTemplate(
            'org/dessert/cupcake',
            'org/dessert',
            'user:default/guest',
            'https://localhost:3001',
            'https://github.com/org/dessert/cupcake',
            'main',
            'github',
          ),
        }}
        setFormErrors={setFormErrors}
        formErrors={{}}
        setPullRequest={() => jest.fn()}
      />,
    );
    const prTitle = getByPlaceholderText(
      /Add Backstage catalog entity descriptor files/,
    );
    fireEvent.change(prTitle, { target: { value: '' } });
    await waitFor(() => {
      expect(
        screen.queryByText('Pull request title is required'),
      ).toBeInTheDocument();
    });

    const componentName = getByPlaceholderText(/Component Name/);
    fireEvent.change(componentName, { target: { value: '' } });
    await waitFor(() => {
      expect(
        screen.queryByText('Component name is required'),
      ).toBeInTheDocument();
    });
  });
});
