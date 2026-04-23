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
 * Common types for the homepage plugin shared between frontend and backend.
 *
 * @packageDocumentation
 */

export {
  homepageDefaultWidgetsReadPermission,
  homepagePermissions,
  RESOURCE_TYPE_HOMEPAGE_DEFAULT_WIDGET,
} from './permissions';
export type { HomepageDefaultWidgetPermission } from './permissions';

/**
 * @public
 */
export interface CardVisibility {
  users?: string[];
  groups?: string[];
  permissions?: string[];
}

/**
 * @public
 */
export interface CardLayout {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

/**
 * @public
 */
export interface CardNode {
  id?: string;
  props?: Record<string, unknown>;
  layouts?: Record<string, CardLayout>;
  if?: CardVisibility;
  children?: CardNode[];
}

/**
 * @public
 */
export interface VisibleCard {
  id: string;
  props?: Record<string, unknown>;
  layouts?: Record<string, CardLayout>;
}

/**
 * @public
 */
export interface DefaultWidgetsResponse {
  customizable: boolean;
  items: VisibleCard[];
}
