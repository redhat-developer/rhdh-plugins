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
 * Slot
 *
 * @public
 */
export enum Slot {
  /**
   * Positions the global header component at the start of the global header
   */
  HEADER_START = 'header-start',
  /**
   * Positions the global header component at the end of the global header
   */
  HEADER_END = 'header-end',
}

/**
 * Component
 *
 * @public
 */
export enum ComponentType {
  /**
   * Global Header Component dropdown button
   */
  DROPDOWN_BUTTON = 'dropdown_button',
  /**
   * Global Header Component icon button
   */
  ICON_BUTTON = 'icon_button',
  /**
   * Global Header Component link
   */
  LINK = 'link',
  /**
   * Global Header Component search
   */
  SEARCH = 'search',
}

/**
 * Global Header Config
 *
 * @public
 */
export interface GlobalHeaderComponentMountPointConfig {
  type: ComponentType;
  key?: string;
  enabled?: boolean;
  slot?: Slot;
  priority?: number;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Global Header Component Mount Point
 *
 * @public
 */
export interface GlobalHeaderComponentMountPoint {
  Component: React.ComponentType;
  config?: GlobalHeaderComponentMountPointConfig & {
    props?: Record<string, any>;
  };
}