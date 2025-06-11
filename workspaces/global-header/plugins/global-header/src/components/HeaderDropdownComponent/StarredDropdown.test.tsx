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
import { screen, fireEvent } from '@testing-library/react';
import {
  useStarredEntities,
  useEntityPresentation,
} from '@backstage/plugin-catalog-react';
import { renderInTestApp } from '@backstage/test-utils';
import { StarredDropdown } from './StarredDropdown';
import { useDropdownManager } from '../../hooks';

jest.mock('@backstage/plugin-catalog-react', () => ({
  useStarredEntities: jest.fn(),
  useEntityPresentation: jest.fn(),
}));

jest.mock('../../hooks', () => ({
  useDropdownManager: jest.fn(),
}));

describe('StarredDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useStarredEntities as jest.Mock).mockReturnValue({
      starredEntities: new Set(),
      toggleStarredEntity: jest.fn(),
      isStarredEntity: jest.fn(),
    });

    (useEntityPresentation as jest.Mock).mockReturnValue({
      Icon: () => <svg />, // Mock an icon component
      primaryTitle: 'Mock Entity',
      secondaryTitle: 'Mock Kind',
    });

    (useDropdownManager as jest.Mock).mockReturnValue({
      anchorEl: null,
      handleOpen: jest.fn(),
      handleClose: jest.fn(),
    });

    jest.spyOn(console, 'warn').mockImplementation(message => {
      if (message.includes('⚠️ React Router Future Flag Warning')) {
        return; // Suppress React Router warning
      }
      // eslint-disable-next-line no-console
      console.warn(message); // Log other warnings
    });

    jest.spyOn(console, 'error').mockImplementation(message => {
      if (
        typeof message === 'string' &&
        message.includes('findDOMNode is deprecated')
      ) {
        return; // Suppress findDOMNode warning in tests
      }
      // eslint-disable-next-line no-console
      console.error(message); // Allow other errors to be logged
    });
  });

  it('renders an empty state when there are no starred entities', async () => {
    await renderInTestApp(<StarredDropdown />);

    // Replace this with the actual empty state message in your component
    expect(screen.getByText(/No starred items yet/i)).toBeInTheDocument();
  });

  it('renders starred items when entities exist', async () => {
    (useStarredEntities as jest.Mock).mockReturnValue({
      starredEntities: new Set(['component:default/my-entity']),
      toggleStarredEntity: jest.fn(),
      isStarredEntity: jest.fn(),
    });

    await renderInTestApp(<StarredDropdown />);
    expect(screen.getByText(/Your starred items/i)).toBeInTheDocument();
  });

  it('calls handleOpen when dropdown button is clicked', async () => {
    const handleOpen = jest.fn();
    (useStarredEntities as jest.Mock).mockReturnValue({
      starredEntities: new Set(['component:default/my-entity']),
      toggleStarredEntity: jest.fn(),
      isStarredEntity: jest.fn(),
    });

    (useDropdownManager as jest.Mock).mockReturnValue({
      anchorEl: null,
      handleOpen,
      handleClose: jest.fn(),
    });

    await renderInTestApp(<StarredDropdown />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleOpen).toHaveBeenCalled();
  });
});
