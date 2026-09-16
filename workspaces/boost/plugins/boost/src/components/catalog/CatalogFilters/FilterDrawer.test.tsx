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

import { fireEvent, screen } from '@testing-library/react';
import { renderInTestApp } from '@backstage/test-utils';

import type { FilterDefinition } from '../../../blueprints/AiCatalogFilterBlueprint';
import { FilterDrawer } from './FilterDrawer';

const filter: FilterDefinition = {
  urlParam: 'type',
  label: 'Type',
  getOptions: () => [{ id: 'skill', label: 'Skills' }],
  matchEntity: () => true,
  priority: 100,
};

describe('FilterDrawer', () => {
  it('opens a drawer with the registered filters', async () => {
    await renderInTestApp(
      <FilterDrawer
        filters={[filter]}
        entities={[]}
        values={new Map()}
        onFilterChange={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
  });
});
