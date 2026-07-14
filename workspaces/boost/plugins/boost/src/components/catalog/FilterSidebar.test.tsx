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

import type { FilterDefinition } from '../../blueprints/AiCatalogFilterBlueprint';
import { FilterSidebar } from './FilterSidebar';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockFilter = (urlParam: string, label: string): FilterDefinition => ({
  urlParam,
  label,
  getOptions: () => [
    { id: 'a', label: 'Option A' },
    { id: 'b', label: 'Option B' },
  ],
  matchEntity: () => true,
  priority: 100,
});

describe('FilterSidebar', () => {
  it('renders a Select for each filter', () => {
    const filters = [mockFilter('type', 'Type'), mockFilter('owner', 'Owner')];

    render(
      <FilterSidebar
        filters={filters}
        entities={[]}
        values={new Map()}
        onFilterChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Owner')).toBeInTheDocument();
  });

  it('returns null when filters array is empty', () => {
    const { container } = render(
      <FilterSidebar
        filters={[]}
        entities={[]}
        values={new Map()}
        onFilterChange={jest.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders nav with aria-label', () => {
    const filters = [mockFilter('type', 'Type')];

    render(
      <FilterSidebar
        filters={filters}
        entities={[]}
        values={new Map()}
        onFilterChange={jest.fn()}
      />,
    );

    expect(screen.getByRole('navigation')).toHaveAttribute(
      'aria-label',
      'catalog.page.title',
    );
  });

  it('uses labelKey for translation when provided', () => {
    const filter: FilterDefinition = {
      ...mockFilter('type', 'Fallback'),
      labelKey: 'catalog.filter.type',
    };

    render(
      <FilterSidebar
        filters={[filter]}
        entities={[]}
        values={new Map()}
        onFilterChange={jest.fn()}
      />,
    );

    expect(screen.getByText('catalog.filter.type')).toBeInTheDocument();
  });

  it('uses plain label when labelKey is not set', () => {
    const filter = mockFilter('ns', 'Namespace');

    render(
      <FilterSidebar
        filters={[filter]}
        entities={[]}
        values={new Map()}
        onFilterChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Namespace')).toBeInTheDocument();
  });
});
