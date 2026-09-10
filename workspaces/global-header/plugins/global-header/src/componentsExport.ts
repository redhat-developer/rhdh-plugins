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
 * (not the package root) so MUI-heavy UI stays off the root NFS sync chunk.
 * Prefer a static import of these from a file that is only reached via a
 * blueprint `loader` `import()`, so the consumer bundles them into its own
 * async chunk at compile/export time.
 *
 * This is a `package.json` `exports["./components"]` subpath, not a host-loaded
 * Module Federation feature. Other dynamic plugins (e.g. quickstart) resolve it
 * as an npm dependency when they are exported; they do not fetch a
 * global-header `/components` remote at runtime. There is no default
 * `FrontendModule` here so `./components` is not listed in `backstage.features`
 * and is not downloaded at app startup.
 *
 * @public
 * @packageDocumentation
 */

import './configureMuiClassName';

export { HeaderIconButton as GlobalHeaderIconButton } from './components/HeaderIconButton/HeaderIconButton';
export type { HeaderIconButtonProps } from './components/HeaderIconButton/HeaderIconButton';

export { GlobalHeaderMenuItem } from './components/GlobalHeaderMenuItem';
export type { GlobalHeaderMenuItemProps } from './components/GlobalHeaderMenuItem';

export { GlobalHeaderDropdown } from './components/GlobalHeaderDropdown';
export type { GlobalHeaderDropdownProps } from './components/GlobalHeaderDropdown';
