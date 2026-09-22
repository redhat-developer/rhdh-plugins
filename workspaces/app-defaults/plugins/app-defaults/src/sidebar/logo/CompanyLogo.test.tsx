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

import type { ReactNode } from 'react';
import { screen } from '@testing-library/react';
import { SidebarOpenStateProvider } from '@backstage/core-components';
import { renderInTestApp } from '@backstage/frontend-test-utils';

import { CompanyLogo } from './CompanyLogo';

const customFull = 'data:image/png;base64,custom-full';
const customIcon = 'data:image/png;base64,custom-icon';

const Sidebar = ({
  open,
  children,
}: {
  open: boolean;
  children: ReactNode;
}) => (
  <SidebarOpenStateProvider value={{ isOpen: open, setOpen: () => {} }}>
    {children}
  </SidebarOpenStateProvider>
);

type Branding = Record<
  string,
  string | number | { light: string; dark: string }
>;

const renderLogo = (
  open: boolean,
  branding: Branding = {},
  element = <CompanyLogo />,
) =>
  renderInTestApp(<Sidebar open={open}>{element}</Sidebar>, {
    config: { app: { branding } },
  });

describe('CompanyLogo', () => {
  it('links home and renders the default full logo while open', async () => {
    await renderLogo(true);

    const logo = screen.getByTestId('home-logo');
    expect(logo).toHaveAttribute('alt', 'Home logo');
    expect(logo.getAttribute('src')).toMatch(/^data:image\/svg\+xml,/);
    expect(logo).toHaveAttribute('width', '170');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('renders the default icon logo while collapsed', async () => {
    await renderLogo(false);

    const logo = screen.getByTestId('home-logo');
    expect(logo.getAttribute('src')).toMatch(/^data:image\/svg\+xml,/);
    expect(logo).toHaveAttribute('width', '28');
  });

  it('uses app.branding.fullLogo and fullLogoWidth while open', async () => {
    await renderLogo(true, { fullLogo: customFull, fullLogoWidth: 120 });

    const logo = screen.getByTestId('home-logo');
    expect(logo).toHaveAttribute('src', customFull);
    expect(logo).toHaveAttribute('width', '120');
  });

  it('uses app.branding.iconLogo while collapsed', async () => {
    await renderLogo(false, { fullLogo: customFull, iconLogo: customIcon });

    expect(screen.getByTestId('home-logo')).toHaveAttribute('src', customIcon);
  });

  it('picks the dark variant of themed logos by default', async () => {
    await renderLogo(true, {
      fullLogo: { light: 'light-full', dark: 'dark-full' },
    });

    expect(screen.getByTestId('home-logo')).toHaveAttribute('src', 'dark-full');
  });

  it('prefers props over config', async () => {
    await renderLogo(
      true,
      { fullLogo: customFull },
      <CompanyLogo fullLogo="prop-full" to="/home" width={99} />,
    );

    const logo = screen.getByTestId('home-logo');
    expect(logo).toHaveAttribute('src', 'prop-full');
    expect(logo).toHaveAttribute('width', '99');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      '/home',
    );
  });
});
