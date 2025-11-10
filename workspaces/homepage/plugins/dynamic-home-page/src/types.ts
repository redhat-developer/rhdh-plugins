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

import type { ComponentType } from 'react';

import type { Tool } from '@backstage/plugin-home';
import type { CardLayout, CardSettings } from '@backstage/plugin-home-react';

/**
 * @public
 */
export enum Breakpoint {
  xl = 'xl',
  lg = 'lg',
  md = 'md',
  sm = 'sm',
  xs = 'xs',
  xxs = 'xxs',
}

/**
 * @public
 */
export interface Layout {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

/**
 * @public
 */
export interface HomePageCardMountPointConfig {
  /**
   * This is the internal name that solves duplication issues when using the same
   * component with different configurations.
   * This is used as reference identifier (name) when calling `createCardExtension`
   * for the `CustomHomepageGrid` component from the home plugin.
   */
  name?: string;
  title?: string;
  titleKey?: string;
  description?: string;
  descriptionKey?: string;

  cardLayout?: CardLayout;
  settings?: CardSettings;

  priority?: number;
  /**
   * Setting a layout configuration enables this card by default.
   */
  layouts?: Record<Breakpoint, Layout>;
}

/**
 * @public
 */
export interface HomePageCardMountPoint {
  Component: ComponentType;

  // Untested
  Actions?: ComponentType;
  // Untested
  Settings?: ComponentType;

  config?: HomePageCardMountPointConfig & {
    props?: Record<string, any>;
  };
  enabled?: boolean;
}

export type QuickAccessLink = {
  title: string;
  isExpanded?: boolean;
  links: (Tool & { iconUrl: string })[];
};

export type LearningSectionItem = {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  target?: string;
  ariaLabel?: string;
  endIcon: React.ComponentType;
};
