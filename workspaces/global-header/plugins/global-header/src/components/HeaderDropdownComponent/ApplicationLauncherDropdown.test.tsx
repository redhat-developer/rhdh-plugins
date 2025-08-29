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
import { renderInTestApp } from '@backstage/test-utils';
import {
  MockTrans,
  mockUseTranslation,
} from '../../test-utils/mockTranslations';
import { ApplicationLauncherDropdown } from './ApplicationLauncherDropdown';
import { useDropdownManager } from '../../hooks';
import { useApplicationLauncherDropdownMountPoints } from '../../hooks/useApplicationLauncherDropdownMountPoints';

jest.mock('../../hooks', () => ({
  useDropdownManager: jest.fn(),
}));

jest.mock('../../hooks/useApplicationLauncherDropdownMountPoints', () => ({
  useApplicationLauncherDropdownMountPoints: jest.fn(),
}));

// Mock translation hooks
jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

jest.mock('../../components/Trans', () => ({
  Trans: MockTrans,
}));

describe('ApplicationLauncherDropdown', () => {
  beforeEach(() => {
    (useDropdownManager as jest.Mock).mockReturnValue({
      anchorEl: null,
      handleOpen: jest.fn(),
      handleClose: jest.fn(),
    });
  });

  test('renders dropdown button', async () => {
    await renderInTestApp(<ApplicationLauncherDropdown />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('opens dropdown on button click', async () => {
    const { handleOpen } = useDropdownManager();
    await renderInTestApp(<ApplicationLauncherDropdown />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleOpen).toHaveBeenCalled();
  });

  test('renders no application links message when empty', async () => {
    (useApplicationLauncherDropdownMountPoints as jest.Mock).mockReturnValue(
      [],
    );
    await renderInTestApp(<ApplicationLauncherDropdown />);
    expect(
      screen.getByText('No application links configured'),
    ).toBeInTheDocument();
  });
});
