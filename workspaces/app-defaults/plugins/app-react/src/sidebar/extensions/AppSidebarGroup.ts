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

import type { IconComponent } from '@backstage/frontend-plugin-api';

import type { AppSidebarItem } from './AppSidebarItem';

/**
 * A sidebar group that contains child nav items, contributed via
 * AppSidebarGroupBlueprint. Children attach to the group using
 * AppSidebarItemBlueprint with `attachTo: group.inputs.children`.
 *
 * @alpha
 */
export interface AppSidebarGroup {
  /** Unique identifier for this sidebar group. */
  id: string;
  /** Title for the sidebar group. */
  title: string;
  /** Key for localizing the title. */
  titleKey?: string;
  /** Icon component for the sidebar group. */
  icon?: IconComponent;
  /** Child nav items collected from attached extensions. */
  children: AppSidebarItem[];
  /** Ordering priority when multiple groups are registered. Higher = first. */
  priority?: number;
}
