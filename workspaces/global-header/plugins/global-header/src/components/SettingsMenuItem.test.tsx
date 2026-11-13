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

import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';

import { SettingsMenuItem } from './SettingsMenuItem';
import { useIsSettingsAvailable } from '../hooks/useIsSettingsAvailable';

jest.mock('../hooks/useIsSettingsAvailable', () => ({
  useIsSettingsAvailable: jest.fn(),
}));

const mockUseIsSettingsAvailable = jest.mocked(useIsSettingsAvailable);

describe('SettingsMenuItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders null when user-settings is not available', async () => {
    mockUseIsSettingsAvailable.mockReturnValue(false);
    const { queryByRole } = await renderInTestApp(
      <TestApiProvider apis={[]}>
        <SettingsMenuItem />
      </TestApiProvider>,
    );
    expect(queryByRole('menuitem')).not.toBeInTheDocument();
    expect(queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders menu item link when user-settings is available', async () => {
    mockUseIsSettingsAvailable.mockReturnValue(true);
    const { getByRole } = await renderInTestApp(
      <TestApiProvider apis={[]}>
        <SettingsMenuItem />
      </TestApiProvider>,
    );
    const menuItem = getByRole('menuitem');
    expect(menuItem).toBeInTheDocument();
    expect(menuItem.getAttribute('href')).toEqual('/settings');
    expect(menuItem).toHaveTextContent('Settings');
  });
});
