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

import type { ThemeConfig } from '../types';
import { customDarkTheme } from '../darkTheme';
import { createComponents, type Components } from './createComponents';

interface TestCase {
  name: string;
  config: ThemeConfig;
  expected: Components;
}

const testCases: TestCase[] = [
  {
    name: 'No options defined',
    config: {},
    expected: expect.objectContaining({
      MuiButton: {
        defaultProps: {
          disableRipple: true,
        },
        styleOverrides: expect.any(Object),
      },
    }),
  },
  {
    name: 'No option parameters are defined',
    config: {
      options: {},
    },
    expected: expect.objectContaining({
      MuiButton: {
        defaultProps: {
          disableRipple: true,
        },
        styleOverrides: expect.any(Object),
      },
    }),
  },
  {
    name: 'Reenable ripple effect when rippleEffect=on',
    config: {
      options: {
        rippleEffect: 'on',
      },
    },
    expected: expect.objectContaining({
      MuiButton: {
        defaultProps: {
          disableRipple: false,
        },
        styleOverrides: expect.any(Object),
      },
    }),
  },
  {
    name: 'No components returned for components=backstage',
    config: {
      options: {
        components: 'backstage',
      },
    },
    expected: {},
  },
];

describe('createComponents', () => {
  testCases.forEach(testCase => {
    // eslint-disable-next-line jest/valid-title
    it(testCase.name, () => {
      const actual = createComponents(testCase.config);
      expect(actual).toEqual(testCase.expected);
    });
  });

  it('sets BackstageSidebarPage minHeight to fill the viewport', () => {
    const actual = createComponents({});
    expect(actual.BackstageSidebarPage?.styleOverrides?.root).toEqual(
      expect.objectContaining({
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }),
    );
  });

  it('stretches main with mainSectionBackgroundColor inside the page inset', () => {
    const actual = createComponents({ palette: customDarkTheme() });
    const root = actual.BackstageSidebarPage?.styleOverrides?.root as
      | Record<string, unknown>
      | undefined;
    const desktop = root?.['@media (min-width: 600px)'] as
      | Record<string, unknown>
      | undefined;
    expect(
      desktop?.["& > [class*='MuiLinearProgress-root'], & > main"],
    ).toEqual(
      expect.objectContaining({
        backgroundColor: '#292929',
        minHeight: 'calc(100vh - 2 * 1.5rem)',
        maxHeight: 'calc(100vh - 2 * 1.5rem)',
      }),
    );
  });

  it('makes NFS BUI main a flex column so nested Containers can grow', () => {
    const actual = createComponents({ palette: customDarkTheme() });
    const root = actual.BackstageSidebarPage?.styleOverrides?.root as
      | Record<string, unknown>
      | undefined;
    const desktop = root?.['@media (min-width: 600px)'] as
      | Record<string, unknown>
      | undefined;
    expect(desktop?.['& > main:not([data-backstage-core-page])']).toEqual(
      expect.objectContaining({
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
      }),
    );
  });

  it('paints BUI content Containers with mainSectionBackgroundColor', () => {
    const actual = createComponents({ palette: customDarkTheme() });
    const root = actual.BackstageSidebarPage?.styleOverrides?.root as
      | Record<string, unknown>
      | undefined;
    const desktop = root?.['@media (min-width: 600px)'] as
      | Record<string, unknown>
      | undefined;
    expect(
      desktop?.["& > [class*='bui-Container']:not([class*='bui-Header'])"],
    ).toEqual(
      expect.objectContaining({
        backgroundColor: '#292929',
      }),
    );
  });

  it('grows BackstageContent article to fill the flex column', () => {
    const actual = createComponents({ palette: customDarkTheme() });
    const root = actual.BackstageSidebarPage?.styleOverrides?.root as
      | Record<string, unknown>
      | undefined;
    const desktop = root?.['@media (min-width: 600px)'] as
      | Record<string, unknown>
      | undefined;
    expect(
      desktop?.['& > article, & > [class*="BackstageContent-root"]'],
    ).toEqual(
      expect.objectContaining({
        flex: 1,
        backgroundColor: '#292929',
      }),
    );
  });
});
