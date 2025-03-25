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
 * Global Header Config
 *
 * @public
 */
export interface GlobalHeaderComponentMountPointConfig {
  priority?: number;
}

/**
 * Create Dropdown Config
 *
 * @public
 */
export interface CreateDropdownMountPointConfig {
  priority?: number;
  props?: Record<string, any>;
}
/**
 * Profile Dropdown Config
 *
 * @public
 */
export interface ProfileDropdownMountPointConfig {
  priority?: number;
  icon?: string;
  title?: string;
  link?: string;
  props?: Record<string, any>;
}

/**
 * Application Launcher Dropdown Config
 *
 * @public
 */
export interface ApplicationLauncherDropdownMountPointConfig {
  section?: string;
  sectionLink?: string;
  sectionLinkLabel?: string;
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
  Component: React.ComponentType<{
    layout?: React.CSSProperties;
  }>;
  config?: GlobalHeaderComponentMountPointConfig & {
    props?: Record<string, any>;
    layout?: React.CSSProperties;
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

export interface ApplicationLauncherDropdownMountPoint {
  Component: React.ComponentType<any>;
  config?: ApplicationLauncherDropdownMountPointConfig & {
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
        'global.header/application-launcher': ApplicationLauncherDropdownMountPoint[];
      };
    };
  };
}
