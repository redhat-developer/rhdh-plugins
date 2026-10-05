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
import { screen } from '@testing-library/react';

import type { FilterDefinition } from '../../../blueprints/AiCatalogFilterBlueprint';
import { CatalogFilters } from './CatalogFilters';

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

describe('CatalogFilters', () => {
  it('renders a Select for each filter', async () => {
    const filters = [mockFilter('type', 'Type'), mockFilter('owner', 'Owner')];

    await renderInTestApp(
      <CatalogFilters
        filters={filters}
        entities={[]}
        values={new Map()}
        onFilterChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Owner')).toBeInTheDocument();
  });

  it('shows All when a filter has no selected values', async () => {
    await renderInTestApp(
      <CatalogFilters
        filters={[mockFilter('type', 'Type')]}
        entities={[]}
        values={new Map()}
        onFilterChange={jest.fn()}
      />,
    );

    expect(screen.getAllByText('All').length).toBeGreaterThan(0);
  });

  it('keeps an option with the internal All value', async () => {
    const filter = {
      ...mockFilter('type', 'Type'),
      getOptions: () => [
        { id: '__all__', label: 'Reserved value' },
        { id: 'skill', label: 'Skills' },
      ],
    };

    await renderInTestApp(
      <CatalogFilters
        filters={[filter]}
        entities={[]}
        values={new Map([['type', ['__all__']]])}
        onFilterChange={jest.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Reserved value Type' }),
    ).toBeInTheDocument();
  });

  it('returns null when filters array is empty', async () => {
    const { container } = await renderInTestApp(
      <CatalogFilters
        filters={[]}
        entities={[]}
        values={new Map()}
        onFilterChange={jest.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders nav with aria-label', async () => {
    const filters = [mockFilter('type', 'Type')];

    await renderInTestApp(
      <CatalogFilters
        filters={filters}
        entities={[]}
        values={new Map()}
        onFilterChange={jest.fn()}
      />,
    );

    expect(screen.getByRole('navigation')).toHaveAttribute(
      'aria-label',
      'Filters',
    );
  });

  it('uses labelKey for translation when provided', async () => {
    const filter: FilterDefinition = {
      ...mockFilter('type', 'Fallback'),
      labelKey: 'catalog.filter.type',
    };

    await renderInTestApp(
      <CatalogFilters
        filters={[filter]}
        entities={[]}
        values={new Map()}
        onFilterChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Type')).toBeInTheDocument();
  });

  it('uses plain label when labelKey is not set', async () => {
    const filter = mockFilter('ns', 'Namespace');

    await renderInTestApp(
      <CatalogFilters
        filters={[filter]}
        entities={[]}
        values={new Map()}
        onFilterChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Namespace')).toBeInTheDocument();
  });
});
