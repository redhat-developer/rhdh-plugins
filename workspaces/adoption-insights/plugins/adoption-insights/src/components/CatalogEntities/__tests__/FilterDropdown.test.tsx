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
import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';

import FilterDropdown from '../FilterDropdown';
import { catalogEntityKinds } from '../../../utils/utils';
import { CatalogEntities } from '../../../types';

jest.mock('../../../utils/utils', () => ({
  catalogEntityKinds: jest.fn(),
}));

describe('FilterDropdown Component', () => {
  const mockHandleChange = jest.fn();

  const mockCatalogEntities: CatalogEntities[] = [
    {
      plugin_id: 'plugin-1',
      name: 'Component',
      kind: 'Component',
      namespace: 'default',
      last_used: '2024-03-01',
      count: 10,
    },
    {
      plugin_id: 'plugin-2',
      name: 'Service',
      kind: 'Service',
      namespace: 'default',
      last_used: '2024-03-02',
      count: 15,
    },
  ];

  beforeEach(() => {
    (catalogEntityKinds as jest.Mock).mockReturnValue(['Component', 'Service']);
  });

  test('should render the dropdown with default value', () => {
    render(
      <FilterDropdown
        selectedOption=""
        handleChange={mockHandleChange}
        catalogEntitiesData={mockCatalogEntities}
      />,
    );

    expect(screen.getByLabelText(/Select kind/i)).toBeInTheDocument();
  });

  test('should display dropdown options when clicked', () => {
    render(
      <FilterDropdown
        selectedOption=""
        handleChange={mockHandleChange}
        catalogEntitiesData={mockCatalogEntities}
      />,
    );

    fireEvent.mouseDown(screen.getByLabelText(/Select kind/i));

    expect(screen.getByText('Component')).toBeInTheDocument();
    expect(screen.getByText('Service')).toBeInTheDocument();
  });
});
