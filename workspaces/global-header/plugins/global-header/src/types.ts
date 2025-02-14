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
 * Component
 *
 * @public
 */
export enum ComponentType {
  /**
   * Global Header spacer
   */
  SPACER = 'spacer',
  /**
   * Global Header support button
   */
  SUPPORT_BUTTON = 'support_button',
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
   * Global Header Component list
   */
  LIST = 'list',
  /**
   * Global Header Component search
   */
  SEARCH = 'search',
  /**
   * Global Header Component logout
   */
  LOGOUT = 'logout',
}

/**
 * Global Header Config
 *
 * @public
 */
export interface GlobalHeaderComponentMountPointConfig {
  type?: ComponentType;
  priority?: number;
}

/**
 * Create Dropdown Config
 *
 * @public
 */
export interface CreateDropdownMountPointConfig {
  type: ComponentType;
  priority?: number;
  props?: Record<string, any>;
}
/**
 * Profile Dropdown Config
 *
 * @public
 */
export interface ProfileDropdownMountPointConfig {
  type: ComponentType;
  priority?: number;
  icon?: string;
  title?: string;
  link?: string;
  props?: Record<string, any>;
}

/**
 * Global Header Component Mount Point
 *
 * @public
 */
export interface GlobalHeaderComponentMountPoint {
  Component: React.ComponentType<{}>;
  config?: GlobalHeaderComponentMountPointConfig & {
    layout?: Record<string, any>;
    props?: Record<string, any>;
  };
}

/**
 * Create Dropdown Mount Point
 *
 * @public
 */
export interface CreateDropdownMountPoint {
  Component: React.ComponentType;
  config?: CreateDropdownMountPointConfig & {
    props?: Record<string, any>;
  };
}

/**
 * Profile Dropdown Mount Point
 *
 * @public
 */
export interface ProfileDropdownMountPoint {
  Component: React.ComponentType;
  config?: ProfileDropdownMountPointConfig & {
    props?: Record<string, any>;
  };
}

/**
 * ScalprumState
 *
 * @public
 */
export interface ScalprumState {
  api?: {
    dynamicRootConfig?: {
      mountPoints?: {
        'global.header/component': GlobalHeaderComponentMountPoint[];
        'global.header/create': CreateDropdownMountPoint[];
        'global.header/profile': ProfileDropdownMountPoint[];
      };
    };
  };
}
