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
import { getDefaultThemeConfig } from '../rhdh';
import { resolveNavigationSidebarColors } from './navigationSidebarColors';

describe('resolveNavigationSidebarChrome', () => {
  const defaultLight = getDefaultThemeConfig('light');

  it('matches baseline defaults', () => {
    const c = resolveNavigationSidebarColors(defaultLight);
    expect(c.sidebarBackgroundColor).toBe(
      defaultLight.palette?.rhdh?.general?.sidebarBackgroundColor,
    );
    expect(c.sidebarItemInteractionBackgroundColor).toBe(
      defaultLight.palette?.rhdh?.general?.sidebarItemSelectedBackgroundColor,
    );
    expect(c.navigationItemColor).toBe(defaultLight.palette?.navigation?.color);
    expect(c.navigationSelectedColor).toBe(
      defaultLight.palette?.navigation?.selectedColor,
    );
  });

  it('uses palette.navigation.background when only that differs from baseline', () => {
    const config = {
      ...defaultLight,
      palette: {
        ...defaultLight.palette,
        navigation: {
          ...defaultLight.palette?.navigation,
          background: '#aabbcc',
        },
      },
    } as ThemeConfig;
    expect(resolveNavigationSidebarColors(config).sidebarBackgroundColor).toBe(
      '#aabbcc',
    );
  });

  it('uses rhdh.general.sidebarBackgroundColor when only that differs from baseline', () => {
    const config = {
      ...defaultLight,
      palette: {
        ...defaultLight.palette,
        rhdh: {
          ...defaultLight.palette?.rhdh,
          general: {
            ...defaultLight.palette?.rhdh?.general,
            sidebarBackgroundColor: '#ddeeff',
          },
        },
      },
    } as ThemeConfig;
    expect(resolveNavigationSidebarColors(config).sidebarBackgroundColor).toBe(
      '#ddeeff',
    );
  });

  it('uses palette.navigation.navItem.hoverBackground when only that differs from baseline', () => {
    const config = {
      ...defaultLight,
      palette: {
        ...defaultLight.palette,
        navigation: {
          ...defaultLight.palette?.navigation,
          navItem: {
            ...defaultLight.palette?.navigation?.navItem,
            hoverBackground: '#0a0b0c',
          },
        },
      },
    } as ThemeConfig;
    expect(
      resolveNavigationSidebarColors(config)
        .sidebarItemInteractionBackgroundColor,
    ).toBe('#0a0b0c');
  });
});
