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

import { MemoryRouter } from 'react-router-dom';

import { render, screen } from '@testing-library/react';

import { Router } from './Router';

jest.mock('./BulkImportPage', () => ({
  BulkImportPage: () => <div>Bulk Import</div>,
}));

jest.mock('./AddRepositories/AddRepositoriesPage', () => ({
  AddRepositoriesPage: () => <div>Add Repositories</div>,
}));

describe('Router component', () => {
  it('renders AddRepositoriesPage when path is "/"', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Router />
      </MemoryRouter>,
    );
    expect(screen.queryByText('Add Repositories')).toBeInTheDocument();
  });

  it('renders AddRepositoriesPage when path is "/repositories"', () => {
    render(
      <MemoryRouter initialEntries={['/repositories']}>
        <Router />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Add Repositories')).toBeInTheDocument();
  });

  it('renders Add repositories page when path matches addRepositoriesRouteRef', () => {
    render(
      <MemoryRouter initialEntries={['/add']}>
        <Router />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Add Repositories')).toBeInTheDocument();
  });
});
