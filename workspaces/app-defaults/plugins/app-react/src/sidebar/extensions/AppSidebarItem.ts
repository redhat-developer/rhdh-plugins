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
 * Application sidebar content contributed by a plugin via AppSidebarItemBlueprint.
 *
 * @public
 */
export interface AppSidebarItem {
  /** Unique identifier for this sidebar item. */
  id: string;
  /** Title for the sidebar item. */
  title: string;
  /** Key for localizing the title. */
  titleKey?: string;
  /** React element to render as sidebar item. */
  element?: React.ReactElement;
  /** Ordering priority when multiple drawers are registered. Higher = first. */
  priority?: number;
}
