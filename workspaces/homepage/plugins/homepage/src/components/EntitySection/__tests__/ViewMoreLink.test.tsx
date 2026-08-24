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

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { ViewMoreLink } from '../ViewMoreLink';

jest.mock('@backstage/core-components', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

describe('EntitySection ViewMoreLink', () => {
  it('renders a link with children', () => {
    render(
      <MemoryRouter>
        <ViewMoreLink to="/catalog">View all entities</ViewMoreLink>
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'View all entities' });
    expect(link).toHaveAttribute('href', '/catalog');
  });
});
