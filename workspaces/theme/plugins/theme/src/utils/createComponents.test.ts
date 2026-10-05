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
import { customLightTheme } from '../lightTheme';
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
      }),
    );
  });

  it('paints BackstageSidebarPage with mainSectionBackgroundColor on all viewports', () => {
    const actual = createComponents({ palette: customDarkTheme() });
    expect(actual.BackstageSidebarPage?.styleOverrides?.root).toEqual(
      expect.objectContaining({
        backgroundColor: '#292929',
      }),
    );
  });

  it('clips the SidebarPage scrollport so the scrollbar follows the rounded well', () => {
    const actual = createComponents({ palette: customDarkTheme() });
    const root = actual.BackstageSidebarPage?.styleOverrides?.root as
      | Record<string, unknown>
      | undefined;
    const desktop = root?.['@media (min-width: 600px)'] as
      | Record<string, unknown>
      | undefined;
    expect(desktop).toEqual(
      expect.objectContaining({
        boxSizing: 'border-box',
        overflowY: 'auto',
        width: 'calc(100% - 1.5rem) !important',
        marginTop: '1.5rem',
        marginRight: '1.5rem',
        marginBottom: '1.5rem',
        marginLeft: 0,
        height: 'calc(100vh - 2 * 1.5rem)',
        maxHeight: 'calc(100vh - 2 * 1.5rem)',
        overscrollBehavior: 'none',
        // Left border-box corners stay square (drawer spacer); content-edge
        // left curves come from sticky ::before masks.
        borderRadius: '0 1rem 1rem 0',
        clipPath: 'inset(0 round 0 1rem 1rem 0)',
      }),
    );
    expect(desktop?.['&::before']).toEqual(
      expect.objectContaining({
        position: 'sticky',
        top: 0,
        pointerEvents: 'none',
        zIndex: 101,
      }),
    );
    expect(
      desktop?.["& > [class*='MuiLinearProgress-root'], & > main"],
    ).toEqual(
      expect.objectContaining({
        backgroundColor: '#292929',
        borderRadius: 0,
        overflow: 'visible',
      }),
    );
    expect(desktop?.['& .fullscreen']).toEqual(
      expect.objectContaining({
        position: 'relative',
      }),
    );
    expect(
      desktop?.[
        '& .fullscreen > .MuiIconButton-root, & .fullscreen .MuiIconButton-root[class*="fullscreenButton"]'
      ],
    ).toEqual(
      expect.objectContaining({
        top: '0.5rem !important',
        right: '0.5rem !important',
      }),
    );
  });

  it('does not require a PageMainContainer wrapper for the content well', () => {
    const actual = createComponents({ palette: customDarkTheme() });
    const root = actual.BackstageSidebarPage?.styleOverrides?.root as
      | Record<string, unknown>
      | undefined;
    const desktop = root?.['@media (min-width: 600px)'] as
      | Record<string, unknown>
      | undefined;
    expect(JSON.stringify(desktop)).not.toContain('RHDHPageMainContainer');
  });
  it('offsets BUI dialogs below the masthead so Inspect Entity stays visible', () => {
    const actual = createComponents({});
    const overrides = actual.MuiCssBaseline?.styleOverrides;
    expect(typeof overrides).toBe('function');
    expect(String(overrides)).toContain('bui-DialogOverlay');
    expect(String(overrides)).toContain('--rhdh-global-header-height');
  });

  it('publishes masthead height and hides sidebar logos when global-header is present', () => {
    const actual = createComponents({});
    const overrides = actual.MuiCssBaseline?.styleOverrides;
    expect(typeof overrides).toBe('function');
    // Source of the styleOverrides factory includes these selectors/tokens.
    expect(String(overrides)).toContain('#global-header');
    expect(String(overrides)).toContain('--rhdh-global-header-height');
    expect(String(overrides)).toContain('sidebar-company-logo');
    expect(String(overrides)).toContain('sidebar-home-logo');
  });

  it('drops SidebarPage top inset and subtracts header from height when global-header is present', () => {
    const actual = createComponents({ palette: customDarkTheme() });
    const root = actual.BackstageSidebarPage?.styleOverrides?.root as
      | Record<string, unknown>
      | undefined;
    const desktop = root?.['@media (min-width: 600px)'] as
      | Record<string, unknown>
      | undefined;
    const withHeader = desktop?.[':root:has(#global-header) &'] as
      | Record<string, unknown>
      | undefined;
    expect(withHeader).toEqual(
      expect.objectContaining({
        marginTop: '0 !important',
        height:
          'calc(100vh - var(--rhdh-global-header-height, 64px) - 1.5rem) !important',
        maxHeight:
          'calc(100vh - var(--rhdh-global-header-height, 64px) - 1.5rem) !important',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: '1rem',
        clipPath: 'inset(0 round 0 0 1rem 0)',
      }),
    );
  });

  it('paints shell chrome (html/body/header) with pageInsetBackgroundColor', () => {
    const dark = createComponents({ palette: customDarkTheme() });
    const light = createComponents({ palette: customLightTheme() });
    const overrides = dark.MuiCssBaseline?.styleOverrides;
    expect(typeof overrides).toBe('function');
    // CssBaseline factory paints html/body/#root/#global-header from the
    // closed-over chrome token (pageInsetBackgroundColor).
    expect(String(overrides)).toContain('#global-header');
    expect(String(overrides)).toContain('shellBackground');
    expect(String(overrides)).toContain('--bui-redhat-theme-page-inset-bg');
    expect(dark.MuiAppBar?.styleOverrides?.root).toEqual(
      expect.objectContaining({
        backgroundColor: '#151515',
      }),
    );
    expect(light.MuiAppBar?.styleOverrides?.root).toEqual(
      expect.objectContaining({
        backgroundColor: '#f2f2f2',
      }),
    );
  });

  it('syncs customized pageInsetBackgroundColor onto BUI shell CSS vars', () => {
    const customized = createComponents({
      palette: {
        ...customDarkTheme(),
        rhdh: {
          ...customDarkTheme().rhdh!,
          general: {
            ...customDarkTheme().rhdh!.general!,
            pageInsetBackgroundColor: '#212830',
            appBarBackgroundColor: '#212830',
            sidebarBackgroundColor: '#212830',
          },
        },
      },
    });
    const overrides = customized.MuiCssBaseline?.styleOverrides;
    expect(typeof overrides).toBe('function');
    // Closed-over branding chrome must drive BUI page-inset vars (not the
    // hardcoded tokens.css defaults), so customized dark shells match
    // sidebar / global-header.
    expect(String(overrides)).toContain('#212830');
    expect(String(overrides)).toContain('--bui-redhat-theme-page-inset-bg');
    expect(String(overrides)).toContain('--bui-bg-app');
    expect(String(overrides)).toContain('!important');
  });

  it('offsets the fixed sidebar below the full-width masthead', () => {
    const actual = createComponents({});
    expect(actual.BackstageSidebar?.styleOverrides?.drawer).toEqual(
      expect.objectContaining({
        top: 'var(--rhdh-global-header-height, 0px) !important',
        height:
          'calc(100vh - var(--rhdh-global-header-height, 0px)) !important',
        bottom: '0 !important',
      }),
    );
  });

  it('reserves a stable scrollbar gutter so sidebar items do not shift', () => {
    const actual = createComponents({});
    const overrides = actual.MuiCssBaseline?.styleOverrides;
    expect(typeof overrides).toBe('function');
    expect(String(overrides)).toContain('sidebar-menu-scroll');
    expect(String(overrides)).toContain('scrollbarGutter');
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

  it('paints BackstageContent article with mainSectionBackgroundColor', () => {
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
        backgroundColor: '#292929',
      }),
    );
  });

  it('wraps MuiToggleButtonGroup to prevent overflow', () => {
    const actual = createComponents({ palette: customDarkTheme() });
    expect(actual.MuiToggleButtonGroup?.styleOverrides?.root).toEqual(
      expect.objectContaining({
        flexWrap: 'wrap',
      }),
    );
  });
});
