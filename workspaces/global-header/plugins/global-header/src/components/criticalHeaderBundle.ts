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
 * Barrel for the single critical first-paint header async chunk.
 *
 * Re-exports components required for initial header rendering. Imported
 * through one dynamic import (`loadCriticalHeaderBundle()` in `loaders.ts`)
 * so all critical header UI is emitted into one async chunk.
 *
 * Dropdown trigger wrappers are included here because they render on mount.
 * Menu contents stay behind separate interaction `import()` split points
 * inside each dropdown (e.g. `GlobalHeaderDropdownContent`, `StarredDropdownMenu`).
 *
 * Do not statically import from sync entrypoints (`index.ts`, `plugin.ts`,
 * `blueprints.tsx`, `globalHeaderModule.tsx`).
 *
 * @internal
 */

export { GlobalHeader } from './GlobalHeader';
export { CompanyLogo } from './CompanyLogo/CompanyLogo';
export { SearchComponent } from './SearchComponent/SearchComponent';
export { Spacer } from './Spacer/Spacer';
export { HeaderIconButton } from './HeaderIconButton/HeaderIconButton';
export { HeaderIcon } from './HeaderIcon/HeaderIcon';
export { Divider } from './Divider/Divider';
export { NotificationButton } from './NotificationButton/NotificationButton';

export { SidebarPinToggle } from './SidebarPinToggle/SidebarPinToggle';

export { StarredDropdown } from './HeaderDropdownComponent/StarredDropdown';
export { ApplicationLauncherDropdown } from './ApplicationLauncherDropdown';
export { HelpDropdown } from './HelpDropdown';
export { ProfileDropdown } from './ProfileDropdown';
