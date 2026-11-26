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

import type { ReactElement, ReactNode } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { screen } from '@testing-library/react';
import { appThemeApiRef, configApiRef } from '@backstage/core-plugin-api';
import {
  mockApis,
  renderInTestApp,
  TestApiProvider,
} from '@backstage/test-utils';

import { CompanyLogo } from './CompanyLogo';

const customLogo = 'data:image/png;base64,custom-logo';

const withAppearance = (ui: ReactElement, mode: 'light' | 'dark') => (
  <ThemeProvider theme={createTheme({ palette: { mode } })}>{ui}</ThemeProvider>
);

const createMockThemeApi = (
  variant: 'light' | 'dark' = 'light',
  themeId: string = variant,
) => ({
  getActiveThemeId: () => themeId,
  getInstalledThemes: () => [
    {
      id: themeId,
      title: themeId,
      variant,
      Provider: ({ children }: { children: ReactNode }) => <>{children}</>,
    },
  ],
  setActiveThemeId: () => undefined,
});

const configWithFullLogo = mockApis.config({
  data: {
    app: {
      branding: {
        fullLogo: customLogo,
      },
    },
  },
});

const renderCompanyLogo = (
  ui: ReactElement,
  apis: Parameters<typeof TestApiProvider>[0]['apis'],
) => renderInTestApp(<TestApiProvider apis={apis}>{ui}</TestApiProvider>);

describe('CompanyLogo', () => {
  it.each(['light', 'dark'] as const)(
    'uses the resolved %s logo in Auto mode',
    async mode => {
      const logos = {
        light: 'data:image/png;base64,light-logo',
        dark: 'data:image/png;base64,dark-logo',
      };
      const configApi = mockApis.config({
        data: {
          app: {
            branding: {
              fullLogo: logos,
            },
          },
        },
      });
      const themeApi = {
        ...createMockThemeApi(),
        getActiveThemeId: () => undefined,
      };

      await renderCompanyLogo(withAppearance(<CompanyLogo />, mode), [
        [configApiRef, configApi],
        [appThemeApiRef, themeApi],
      ]);

      expect(screen.getByTestId('home-logo')).toHaveAttribute(
        'src',
        logos[mode],
      );
    },
  );

  it('updates the Auto logo when the resolved appearance changes', async () => {
    const logos = {
      light: 'data:image/png;base64,light-logo',
      dark: 'data:image/png;base64,dark-logo',
    };
    const configApi = mockApis.config({
      data: {
        app: {
          branding: {
            fullLogo: logos,
          },
        },
      },
    });
    const themeApi = {
      ...createMockThemeApi(),
      getActiveThemeId: () => undefined,
    };
    const renderLogo = (mode: 'light' | 'dark') => (
      <TestApiProvider
        apis={[
          [configApiRef, configApi],
          [appThemeApiRef, themeApi],
        ]}
      >
        {withAppearance(<CompanyLogo />, mode)}
      </TestApiProvider>
    );

    const { rerender } = await renderInTestApp(renderLogo('light'));

    expect(screen.getByTestId('home-logo')).toHaveAttribute('src', logos.light);

    rerender(renderLogo('dark'));

    expect(screen.getByTestId('home-logo')).toHaveAttribute('src', logos.dark);
  });

  it('prefers a custom theme-ID logo over its variant', async () => {
    const themeLogo = 'data:image/png;base64,custom-theme-logo';

    await renderCompanyLogo(
      withAppearance(
        <CompanyLogo
          logo={{
            'company-dark': themeLogo,
            dark: 'data:image/png;base64,dark-logo',
          }}
        />,
        'dark',
      ),
      [
        [configApiRef, configWithFullLogo],
        [appThemeApiRef, createMockThemeApi('dark', 'company-dark')],
      ],
    );

    expect(screen.getByTestId('home-logo')).toHaveAttribute('src', themeLogo);
  });

  it.each(['light', 'dark'] as const)(
    'uses a string logo in Auto mode with resolved %s appearance',
    async mode => {
      await renderCompanyLogo(withAppearance(<CompanyLogo />, mode), [
        [configApiRef, configWithFullLogo],
        [
          appThemeApiRef,
          {
            ...createMockThemeApi(),
            getActiveThemeId: () => undefined,
          },
        ],
      ]);

      expect(screen.getByTestId('home-logo')).toHaveAttribute(
        'src',
        customLogo,
      );
    },
  );

  it('renders the built-in default logo when no branding is configured', async () => {
    await renderCompanyLogo(<CompanyLogo />, [
      [configApiRef, mockApis.config({})],
      [appThemeApiRef, createMockThemeApi('light')],
    ]);

    expect(
      screen.getByTestId('global-header-company-logo').querySelector('svg'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('home-logo')).not.toBeInTheDocument();
  });

  it('renders app.branding.fullLogo when no logo prop is provided', async () => {
    await renderCompanyLogo(<CompanyLogo />, [
      [configApiRef, configWithFullLogo],
      [appThemeApiRef, createMockThemeApi('light')],
    ]);

    const logo = screen.getByTestId('home-logo');
    expect(logo).toHaveAttribute('src', customLogo);
  });

  it('renders themed app.branding.fullLogo object for the active theme variant', async () => {
    const lightLogo = 'data:image/png;base64,light-logo';
    const darkLogo = 'data:image/png;base64,dark-logo';
    const configWithThemedFullLogo = mockApis.config({
      data: {
        app: {
          branding: {
            fullLogo: { light: lightLogo, dark: darkLogo },
          },
        },
      },
    });

    await renderCompanyLogo(<CompanyLogo />, [
      [configApiRef, configWithThemedFullLogo],
      [appThemeApiRef, createMockThemeApi('light')],
    ]);

    expect(screen.getByTestId('home-logo')).toHaveAttribute('src', lightLogo);
  });

  it('prefers the logo prop over app.branding.fullLogo', async () => {
    const propLogo = 'data:image/png;base64,prop-logo';

    await renderCompanyLogo(<CompanyLogo logo={propLogo} />, [
      [configApiRef, configWithFullLogo],
      [appThemeApiRef, createMockThemeApi('light')],
    ]);

    const logo = screen.getByTestId('home-logo');
    expect(logo).toHaveAttribute('src', propLogo);
  });
});
