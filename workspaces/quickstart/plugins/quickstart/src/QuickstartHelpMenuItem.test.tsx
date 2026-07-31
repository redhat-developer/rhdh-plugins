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

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderInTestApp } from '@backstage/test-utils';

import { QuickstartHelpMenuItem } from './QuickstartHelpMenuItem';
import { QUICKSTART_DRAWER_ID } from './const';

const mockToggleDrawer = jest.fn();

jest.mock('@red-hat-developer-hub/backstage-plugin-app-react', () => ({
  useAppDrawer: () => ({
    toggleDrawer: mockToggleDrawer,
    isOpen: jest.fn(),
    openDrawer: jest.fn(),
    closeDrawer: jest.fn(),
  }),
}));

jest.mock(
  '@red-hat-developer-hub/backstage-plugin-global-header/alpha',
  () => ({
    GlobalHeaderMenuItem: ({
      title,
      onClick,
    }: {
      title?: string;
      onClick?: () => void;
    }) => (
      <button type="button" role="menuitem" onClick={onClick}>
        {title}
      </button>
    ),
  }),
);

describe('QuickstartHelpMenuItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders as a menuitem with Quick start label', async () => {
    await renderInTestApp(
      <ul role="menu">
        <QuickstartHelpMenuItem />
      </ul>,
    );

    expect(
      screen.getByRole('menuitem', { name: /Quick start/i }),
    ).toBeInTheDocument();
  });

  it('toggles the quickstart drawer and closes the menu on click', async () => {
    const handleClose = jest.fn();
    const user = userEvent.setup();

    await renderInTestApp(
      <ul role="menu">
        <QuickstartHelpMenuItem handleClose={handleClose} />
      </ul>,
    );

    await user.click(screen.getByRole('menuitem', { name: /Quick start/i }));

    expect(mockToggleDrawer).toHaveBeenCalledWith(QUICKSTART_DRAWER_ID);
    expect(handleClose).toHaveBeenCalled();
  });
});
