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
 * First-paint global header UI primitives.
 *
 * Only components required for initial header rendering belong here.
 * Interaction-only UI (dropdown menus, search results, etc.) must stay
 * in separate modules with their own `import()` split points.
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
