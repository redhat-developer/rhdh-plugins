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

import {
  RequirePermission,
  usePermission,
} from '@backstage/plugin-permission-react';
import { renderInTestApp } from '@backstage/test-utils';

import { screen } from '@testing-library/react';

import { useAddedRepositories } from '../hooks';
import { BulkImportPage } from './BulkImportPage';

jest.mock('@backstage/plugin-permission-react', () => ({
  usePermission: jest.fn(),
  RequirePermission: jest.fn(),
}));

jest.mock('../hooks/useAddedRepositories', () => ({
  useAddedRepositories: jest.fn(),
}));

const mockUsePermission = usePermission as jest.MockedFunction<
  typeof usePermission
>;

const mockUseAddedRepositories = useAddedRepositories as jest.MockedFunction<
  typeof useAddedRepositories
>;

const RequirePermissionMock = RequirePermission as jest.MockedFunction<
  typeof RequirePermission
>;

describe('BulkImport Page', () => {
  it('should render if user is authorized to access bulk import plugin', async () => {
    RequirePermissionMock.mockImplementation(props => <>{props.children}</>);
    mockUsePermission.mockReturnValue({ loading: false, allowed: true });
    mockUseAddedRepositories.mockReturnValue({
      loading: false,
      data: { addedRepositories: [], totalJobs: 0 },
      refetch: jest.fn(),
      error: undefined,
    });
    await renderInTestApp(<BulkImportPage />);
    expect(screen.getByText('Added repositories')).toBeInTheDocument();
  });

  it('should not render if user is not authorized to access the bulk import plugin', async () => {
    RequirePermissionMock.mockImplementation(_props => <>Not Found</>);
    mockUsePermission.mockReturnValue({ loading: false, allowed: false });

    await renderInTestApp(<BulkImportPage />);
    expect(
      screen.getByText(
        'To view the added repositories, contact your administrator to give you the `bulk.import` permission.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Added repositories')).not.toBeInTheDocument();
  });
});
