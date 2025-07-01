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
import { QUICKSTART_DRAWER_OPEN_KEY } from './const';
import { QuickstartButton } from './QuickstartButton';
import { renderInTestApp } from '@backstage/test-utils';
import '@testing-library/jest-dom';

jest.mock('./useQuickstartButtonPermission', () => ({
  useQuickstartButtonPermission: jest.fn(),
}));

const mockPermission =
  require('./useQuickstartButtonPermission').useQuickstartButtonPermission;

describe('QuickStartButton', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('does not render if permission is false', async () => {
    mockPermission.mockReturnValue(false);
    await renderInTestApp(<QuickstartButton />);
    expect(screen.queryByTestId('quickstart-button')).not.toBeInTheDocument();
  });

  it('renders correctly with default props if permission is true', async () => {
    mockPermission.mockReturnValue(true);
    await renderInTestApp(<QuickstartButton />);
    expect(screen.getByTestId('quickstart-button')).toBeInTheDocument();
    expect(screen.getByTestId('quickstart-button')).toHaveTextContent(
      'Quick start',
    );
  });

  it('renders with custom props if permission is true', async () => {
    mockPermission.mockReturnValue(true);
    await renderInTestApp(
      <QuickstartButton title="Custom Title" tooltip="Custom Tooltip" />,
    );
    screen.logTestingPlaygroundURL();
    expect(screen.getByTestId('quickstart-button')).toHaveTextContent(
      'Custom Title',
    );
    expect(
      screen.getByRole('menuitem', {
        name: /custom tooltip/i,
      }),
    ).toBeInTheDocument();
  });

  it('toggles QUICKSTART_DRAWER_OPEN_KEY in localStorage on click', async () => {
    mockPermission.mockReturnValue(true);
    await renderInTestApp(<QuickstartButton />);
    const button = screen.getByTestId('quickstart-button');

    expect(localStorage.getItem(QUICKSTART_DRAWER_OPEN_KEY)).toBeNull();

    fireEvent.click(button);
    expect(localStorage.getItem(QUICKSTART_DRAWER_OPEN_KEY)).toBe('true');

    fireEvent.click(button);
    expect(localStorage.getItem(QUICKSTART_DRAWER_OPEN_KEY)).toBe('false');
  });
});
