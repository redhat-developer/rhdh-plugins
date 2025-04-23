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

import { render } from '@testing-library/react';

import { SelectRepositories } from './SelectRepositories';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

jest.mock('react-use', () => ({
  ...jest.requireActual('react-use'),
  useAsync: jest.fn().mockReturnValue({ loading: false }),
}));

describe('Select Repositories', () => {
  it('should allow users to select repositories if none are selected yet', () => {
    const mockAsyncData = {
      loading: false,
      value: {
        totalCount: 5,
      },
    };
    (useAsync as jest.Mock).mockReturnValue(mockAsyncData);
    const { getByText, getByTestId } = render(
      <BrowserRouter>
        <SelectRepositories
          onOrgRowSelected={jest.fn()}
          orgData={{
            id: '1',
            selectedRepositories: {},
            defaultBranch: 'main',
            totalReposInOrg: 3,
          }}
          addedRepositoriesCount={0}
        />
      </BrowserRouter>,
    );
    expect(getByTestId('select-repositories')).toBeTruthy();
    expect(getByText('None')).toBeInTheDocument();
  });

  it('should allow users to edit repositories if repositories are selected', () => {
    const { getByText, getByTestId } = render(
      <BrowserRouter>
        <SelectRepositories
          onOrgRowSelected={jest.fn()}
          orgData={{
            id: '1',
            totalReposInOrg: 5,
            selectedRepositories: {
              xyz: {
                id: '1',
                repoName: 'xyz',
                defaultBranch: 'main',
              },
            },
            defaultBranch: 'main',
          }}
          addedRepositoriesCount={0}
        />
      </BrowserRouter>,
    );

    expect(getByTestId('edit-repositories')).toBeTruthy();
    expect(getByText('1/5')).toBeInTheDocument();
  });
});
