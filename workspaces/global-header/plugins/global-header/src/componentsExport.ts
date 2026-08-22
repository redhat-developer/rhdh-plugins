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
 * Building-block React components for custom global-header UI.
 *
 * Import from `@red-hat-developer-hub/backstage-plugin-global-header/components`
 * so these stay off the root NFS sync chunk. Prefer dynamic `import()`
 * inside blueprint loaders.
 *
 * @public
 * @packageDocumentation
 */

import { createFrontendModule } from '@backstage/frontend-plugin-api';

import './configureMuiClassName';

export { HeaderIconButton as GlobalHeaderIconButton } from './components/HeaderIconButton/HeaderIconButton';
export type { HeaderIconButtonProps } from './components/HeaderIconButton/HeaderIconButton';

export { GlobalHeaderMenuItem } from './components/GlobalHeaderMenuItem';
export type { GlobalHeaderMenuItemProps } from './components/GlobalHeaderMenuItem';

export { GlobalHeaderDropdown } from './components/GlobalHeaderDropdown';
export type { GlobalHeaderDropdownProps } from './components/GlobalHeaderDropdown';

/**
 * Empty module so this package export is published as a Module Federation
 * expose. Backstage only federates entry points whose default export is a
 * recognized feature type.
 *
 * @public
 */
export default createFrontendModule({
  pluginId: 'global-header',
  extensions: [],
});
