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
 * New Frontend System API surface for the global header plugin.
 *
 * @public
 * @packageDocumentation
 */

import { unstable_ClassNameGenerator as ClassNameGenerator } from '@mui/material/className';

ClassNameGenerator.configure(componentName => {
  return componentName.startsWith('v5-')
    ? componentName
    : `v5-${componentName}`;
});

import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { TranslationBlueprint } from '@backstage/plugin-app-react';
import { globalHeaderTranslations } from './translations';

// ── Core: plugin + module ──────────────────────────────────────────────

export { default } from './alpha/plugin';
export { globalHeaderModule } from './alpha/extensions/globalHeaderModule';

// ── Blueprints: for other plugins to contribute header items ───────────

export {
  GlobalHeaderComponentBlueprint,
  GlobalHeaderMenuItemBlueprint,
} from './alpha/extensions/blueprints';
export type {
  ToolbarComponentParams,
  MenuItemParams,
} from './alpha/extensions/blueprints';

// ── Data refs ──────────────────────────────────────────────────────────

export {
  globalHeaderComponentDataRef,
  globalHeaderMenuItemDataRef,
} from './alpha/extensions/dataRefs';

// ── Context hooks for custom dropdown components ───────────────────────

export {
  useGlobalHeaderComponents,
  useGlobalHeaderMenuItems,
} from './alpha/extensions/GlobalHeaderContext';

// ── Types ──────────────────────────────────────────────────────────────

export type {
  GlobalHeaderComponentData,
  GlobalHeaderMenuItemData,
} from './alpha/types';

// ── Building block components for plugin authors ───────────────────────

export { HeaderIconButton as GlobalHeaderIconButton } from './components/HeaderIconButton/HeaderIconButton';
export type { HeaderIconButtonProps } from './components/HeaderIconButton/HeaderIconButton';
export { GlobalHeaderMenuItem } from './alpha/components/GlobalHeaderMenuItem';
export type { GlobalHeaderMenuItemProps } from './alpha/components/GlobalHeaderMenuItem';
export { GlobalHeaderDropdown } from './alpha/components/GlobalHeaderDropdown';
export type { GlobalHeaderDropdownProps } from './alpha/components/GlobalHeaderDropdown';

// ── Default extensions (collections + individual for cherry-picking) ───

export * from './alpha/defaults';

// ── Translations ───────────────────────────────────────────────────────

export { globalHeaderTranslationRef } from './translations/ref';
export { globalHeaderTranslations } from './translations';

const globalHeaderTranslation = TranslationBlueprint.make({
  name: 'global-header-translations',
  params: {
    resource: globalHeaderTranslations,
  },
});

/**
 * App module that registers global header translations.
 * @public
 */
export const globalHeaderTranslationsModule = createFrontendModule({
  pluginId: 'app',
  extensions: [globalHeaderTranslation],
});
