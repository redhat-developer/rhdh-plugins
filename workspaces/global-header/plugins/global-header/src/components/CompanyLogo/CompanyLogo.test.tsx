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
import { configApiRef } from '@backstage/core-plugin-api';
import {
  mockApis,
  renderInTestApp,
  TestApiProvider,
} from '@backstage/test-utils';

import { CompanyLogo } from './CompanyLogo';

jest.mock('../../hooks/useAppBarBackgroundScheme', () => ({
  useAppBarBackgroundScheme: () => 'light',
}));

const customLogo = 'data:image/png;base64,custom-logo';

const configWithFullLogo = mockApis.config({
  data: {
    app: {
      branding: {
        fullLogo: customLogo,
      },
    },
  },
});

describe('CompanyLogo', () => {
  it('renders the built-in default logo when no branding is configured', async () => {
    await renderInTestApp(
      <TestApiProvider apis={[[configApiRef, mockApis.config({})]]}>
        <CompanyLogo />
      </TestApiProvider>,
    );

    const logo = screen.getByTestId('home-logo');
    expect(logo).toHaveAttribute('alt', 'Home logo');
    expect(logo.getAttribute('src')).toMatch(/^data:image\/svg\+xml,/);
  });

  it('renders app.branding.fullLogo when no logo prop is provided', async () => {
    await renderInTestApp(
      <TestApiProvider apis={[[configApiRef, configWithFullLogo]]}>
        <CompanyLogo />
      </TestApiProvider>,
    );

    const logo = screen.getByTestId('home-logo');
    expect(logo).toHaveAttribute('src', customLogo);
  });

  it('renders themed app.branding.fullLogo object for the app bar scheme', async () => {
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

    await renderInTestApp(
      <TestApiProvider apis={[[configApiRef, configWithThemedFullLogo]]}>
        <CompanyLogo />
      </TestApiProvider>,
    );

    expect(screen.getByTestId('home-logo')).toHaveAttribute('src', lightLogo);
  });

  it('prefers the logo prop over app.branding.fullLogo', async () => {
    const propLogo = 'data:image/png;base64,prop-logo';

    await renderInTestApp(
      <TestApiProvider apis={[[configApiRef, configWithFullLogo]]}>
        <CompanyLogo logo={propLogo} />
      </TestApiProvider>,
    );

    const logo = screen.getByTestId('home-logo');
    expect(logo).toHaveAttribute('src', propLogo);
  });
});
