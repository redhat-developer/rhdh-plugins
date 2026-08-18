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
import { renderInTestApp } from '@backstage/test-utils';
import { SidebarLogo } from './SidebarLogo';

jest.mock('@backstage/core-components', () => {
  const actual = jest.requireActual('@backstage/core-components');
  return {
    ...actual,
    useSidebarOpenState: () => ({ isOpen: false }),
  };
});

jest.mock('@red-hat-developer-hub/backstage-plugin-theme', () => ({
  LogoFull: () => <div data-testid="logo-full" />,
  LogoIcon: () => <div data-testid="logo-icon" />,
}));

describe('SidebarLogo', () => {
  it('renders a Home link with the closed-state icon', async () => {
    await renderInTestApp(<SidebarLogo />);

    expect(screen.getByLabelText('Home')).toBeTruthy();
    expect(screen.getByTestId('logo-icon')).toBeTruthy();
  });
});
