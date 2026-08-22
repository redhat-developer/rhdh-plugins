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
 * Legacy (OFS) direct-component API surface for the RHDH app drawer.
 *
 * @deprecated Migrate to the NFS extension API:
 *   `import { AppDrawerContentBlueprint } from '@red-hat-developer-hub/backstage-plugin-app-react'`
 *
 * @packageDocumentation
 */

export { useAppDrawer } from '../drawer/hooks/useAppDrawer';
export { ApplicationDrawer } from './ApplicationDrawer';
export { DrawerPanel } from './DrawerPanel';
export type { ApplicationDrawerProps } from './ApplicationDrawer';
export type { DrawerPanelProps } from './DrawerPanel';
export type { AppDrawerContent, AppDrawerApi } from '../drawer/types';
