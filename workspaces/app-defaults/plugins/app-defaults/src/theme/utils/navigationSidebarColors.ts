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

import * as backstage from '../backstage';
import * as rhdh from '../rhdh';
import {
  type RHDHThemePalette,
  type ThemeConfig,
  type ThemeConfigPalette,
} from '../types';

function baselinePalette(
  themeConfig: ThemeConfig,
): ThemeConfigPalette | undefined {
  const mode = themeConfig.mode ?? 'light';
  const variant = themeConfig.variant ?? 'rhdh';
  const baseline =
    variant === 'backstage'
      ? backstage.getDefaultThemeConfig(mode)
      : rhdh.getDefaultThemeConfig(mode);
  return baseline.palette as ThemeConfigPalette | undefined;
}

function hasRhdhGeneral(
  baseline: ThemeConfigPalette | undefined,
  palette: ThemeConfigPalette,
): boolean {
  return !!baseline?.rhdh?.general || !!palette.rhdh?.general;
}

/**
 * One conceptual color can be set in two places in the merged theme:
 * - Backstage: `palette.navigation…`
 * - RHDH: `palette.rhdh.general…`
 *
 * We load the **default** palette for this mode/variant and compare:
 * - If only the Backstage value differs from its default → use Backstage (user
 *   likely customized `navigation` in app config).
 * - If only the RHDH value differs from its default → use RHDH.
 * - If both differ and disagree → prefer **RHDH**.
 */
type NavigationVsRhdhGeneralPick = {
  /** Current merged `palette.navigation…` color. */
  navigationColor: string | undefined;
  /** Current merged `palette.rhdh.general…` color. */
  rhdhGeneralColor: string | undefined;
  /** That same navigation field on the **default** theme (for this mode). */
  defaultNavigationColor: (baseline: ThemeConfigPalette) => string | undefined;
  /** That same RHDH general field on the **default** theme. */
  defaultRhdhGeneralColor: (baseline: ThemeConfigPalette) => string | undefined;
};

function pickNavigationOrRhdhGeneralColor(
  themeConfig: ThemeConfig,
  palette: ThemeConfigPalette,
  pick: NavigationVsRhdhGeneralPick,
): string {
  const {
    navigationColor: fromNavigation,
    rhdhGeneralColor: fromRhdh,
    defaultNavigationColor,
    defaultRhdhGeneralColor,
  } = pick;

  const baseline = baselinePalette(themeConfig);
  if (!baseline) {
    return fromRhdh || fromNavigation || '';
  }
  if (!hasRhdhGeneral(baseline, palette)) {
    return fromNavigation || fromRhdh || '';
  }

  const defaultNav = defaultNavigationColor(baseline);
  const defaultRhdh = defaultRhdhGeneralColor(baseline);

  if (defaultNav === undefined && defaultRhdh === undefined) {
    return fromRhdh || fromNavigation || '';
  }

  const navigationCustomized =
    fromNavigation !== undefined && fromNavigation !== defaultNav;
  const rhdhCustomized = fromRhdh !== undefined && fromRhdh !== defaultRhdh;

  if (navigationCustomized && !rhdhCustomized) {
    return fromNavigation!;
  }
  if (rhdhCustomized && !navigationCustomized) {
    return fromRhdh!;
  }
  if (navigationCustomized && rhdhCustomized && fromNavigation !== fromRhdh) {
    return fromRhdh ?? fromNavigation ?? '';
  }
  return fromRhdh || fromNavigation || '';
}

export type NavigationSidebarChrome = {
  /** `navigation.background` and `rhdh.general.sidebarBackgroundColor` */
  sidebarBackgroundColor: string;
  /** `navigation.navItem.hoverBackground` and `sidebarItemSelectedBackgroundColor` */
  sidebarItemInteractionBackgroundColor: string;
  /** `navigation.color` (fallback: `text.primary`) */
  navigationItemColor: string;
  /** `navigation.selectedColor` (fallback: `navigation.color`, then `text.primary`) */
  navigationSelectedColor: string;
};

/**
 * Resolves all navigation/sidebar chrome colors for RHDH component overrides.
 */
export function resolveNavigationSidebarColors(
  themeConfig: ThemeConfig,
): NavigationSidebarChrome {
  const palette = (themeConfig.palette ?? {}) as ThemeConfigPalette;
  const general = palette.rhdh?.general ?? ({} as RHDHThemePalette['general']);
  const textPrimary = palette.text?.primary ?? '';

  const navigationItemColor = palette.navigation?.color ?? textPrimary;
  const navigationSelectedColor =
    palette.navigation?.selectedColor ??
    palette.navigation?.color ??
    textPrimary;

  /** `themeConfig` + `palette` fixed; only pass which navigation vs RHDH fields to compare. */
  const pickNavigationColor = (fields: NavigationVsRhdhGeneralPick) =>
    pickNavigationOrRhdhGeneralColor(themeConfig, palette, fields);

  return {
    sidebarBackgroundColor: pickNavigationColor({
      navigationColor: palette.navigation?.background,
      rhdhGeneralColor: general.sidebarBackgroundColor,
      defaultNavigationColor: b => b.navigation?.background,
      defaultRhdhGeneralColor: b => b.rhdh?.general?.sidebarBackgroundColor,
    }),
    sidebarItemInteractionBackgroundColor: pickNavigationColor({
      navigationColor: palette.navigation?.navItem?.hoverBackground,
      rhdhGeneralColor: general.sidebarItemSelectedBackgroundColor,
      defaultNavigationColor: b => b.navigation?.navItem?.hoverBackground,
      defaultRhdhGeneralColor: b =>
        b.rhdh?.general?.sidebarItemSelectedBackgroundColor,
    }),
    navigationItemColor,
    navigationSelectedColor,
  };
}
