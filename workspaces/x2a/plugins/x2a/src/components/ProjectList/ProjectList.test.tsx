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
  mockApis,
  renderInTestApp,
  TestApiProvider,
} from '@backstage/test-utils';
import { ProjectList } from './ProjectList';
import { discoveryApiRef, fetchApiRef } from '@backstage/core-plugin-api';

describe('ProjectList component', () => {
  it('renders the progressbar', async () => {
    const discoveryApiMock = mockApis.discovery({
      baseUrl: 'http://localhost:1234',
    });
    const fetchApiMock = {
      fetch: jest.fn().mockReturnValue(new Promise(() => {})),
    };

    const { findByRole } = await renderInTestApp(
      <TestApiProvider
        apis={[
          [fetchApiRef, fetchApiMock],
          [discoveryApiRef, discoveryApiMock],
        ]}
      >
        <ProjectList />
      </TestApiProvider>,
    );

    // Wait for the progressbar to render
    const progressbar = await findByRole('progressbar');
    expect(progressbar).toBeInTheDocument();

    // TODO: test on mock data

    // const table = await findByRole('table');

    // // Assert that the table contains the expected user data
    // expect(table).toBeInTheDocument();
    // expect(getByText('Migration 1')).toBeInTheDocument();
  });
});
