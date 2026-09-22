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

/**
 * Legacy PascalCase quickstart config icon ids mapped to RHDH common system /
 * Material icon ligature ids for `QuickstartIcon`.
 *
 * Drawer step rows use a separate MUI map in `QuickstartItemIcon` (`commonIcons`)
 * and short-circuit before this path — same keys, different glyph targets.
 * Keep both maps aligned when adding a legacy id.
 *
 * @see `@red-hat-developer-hub/backstage-plugin-app-defaults` `commonIcons`
 */
export const quickstartLegacyIconAliases: Record<string, string> = {
  Admin: 'manageAccounts',
  Rbac: 'security',
  Git: 'folder',
  Plugins: 'extension',
  Import: 'login',
  Catalog: 'category',
  SelfService: 'control_point',
  Learning: 'school',
};

export const resolveQuickstartIconId = (icon: string): string =>
  quickstartLegacyIconAliases[icon] ?? icon;

/**
 * Material Icons ligature for legacy quickstart ids and lowercase config ids.
 * camelCase ids become snake_case (e.g. manageAccounts → manage_accounts).
 */
export const toMaterialLigature = (icon: string): string => {
  const resolved = resolveQuickstartIconId(icon);
  return resolved.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
};

/** Whether the config value can be rendered as a Material ligature. */
export const shouldUseMaterialLigature = (icon: string): boolean =>
  icon in quickstartLegacyIconAliases || /^[a-z][a-z0-9_]*$/.test(icon);
