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
 * On-mount global header widgets (AppBar shell + default toolbar items).
 *
 * Every default toolbar `loader` and the lazy AppBar must `import()` this
 * same module so webpack/Rspack emit one async chunk instead of one request
 * per widget.
 *
 * Do not statically import this file from the package root (`index.ts`,
 * `plugin.ts`, `blueprints.tsx`) or it lands on the Module Federation sync
 * graph. Dropdown menus, search results, and highlighter langs stay on their
 * own `import()` / `React.lazy` split points.
 *
 * @internal
 */

export { GlobalHeader } from './GlobalHeader';
export { CompanyLogo } from './CompanyLogo/CompanyLogo';
export { SearchComponent } from './SearchComponent/SearchComponent';
export { Spacer } from './Spacer/Spacer';
export { HeaderIconButton } from './HeaderIconButton/HeaderIconButton';
export { HeaderIcon } from './HeaderIcon/HeaderIcon';
export { StarredDropdown } from './HeaderDropdownComponent/StarredDropdown';
export { ApplicationLauncherDropdown } from './ApplicationLauncherDropdown';
export { HelpDropdown } from './HelpDropdown';
export { NotificationButton } from './NotificationButton/NotificationButton';
export { Divider } from './Divider/Divider';
export { ProfileDropdown } from './ProfileDropdown';
