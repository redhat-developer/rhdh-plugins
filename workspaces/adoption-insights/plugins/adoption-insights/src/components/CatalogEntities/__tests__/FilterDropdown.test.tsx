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
import { render, screen, fireEvent } from '@testing-library/react';

import {
  MockTrans,
  mockUseTranslation,
} from '../../../test-utils/mockTranslations';

import FilterDropdown from '../FilterDropdown';

// Mock translation hooks
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

jest.mock('../../Trans', () => ({
  Trans: MockTrans,
}));

describe('FilterDropdown Component', () => {
  const mockHandleChange = jest.fn();

  test('should render the dropdown with default value', () => {
    render(
      <FilterDropdown
        selectedOption=""
        handleChange={mockHandleChange}
        uniqueCatalogEntityKinds={['Kind', 'Component']}
      />,
    );

    expect(screen.getByLabelText(/Select kind/i)).toBeInTheDocument();
  });

  test('should display dropdown options when clicked', () => {
    render(
      <FilterDropdown
        selectedOption=""
        handleChange={mockHandleChange}
        uniqueCatalogEntityKinds={['Component', 'Service']}
      />,
    );

    fireEvent.mouseDown(screen.getByLabelText(/Select kind/i));

    expect(screen.getByText('Component')).toBeInTheDocument();
    expect(screen.getByText('Service')).toBeInTheDocument();
  });
});
