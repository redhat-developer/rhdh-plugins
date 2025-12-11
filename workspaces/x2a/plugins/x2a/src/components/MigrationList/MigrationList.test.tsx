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
import { renderInTestApp } from '@backstage/test-utils';
import { MigrationList } from './MigrationList';

// const migrationsMock = {
//   results: [
//     {
//       name: 'Migration 1',
//       status: 'Pending',
//       sourceRepository: 'https://github.com/org/repo',
//     },
//     {
//       name: 'Migration 2',
//       status: 'Completed',
//       sourceRepository: 'https://github.com/org/repo',
//     },
//   ],
// };

describe('MigrationList component', () => {
  it('renders the table', async () => {
    const { getByText, findByRole } = await renderInTestApp(<MigrationList />);

    // Wait for the table to render
    const table = await findByRole('table');

    // Assert that the table contains the expected user data
    expect(table).toBeInTheDocument();
    expect(getByText('Migration 1')).toBeInTheDocument();
  });
});
