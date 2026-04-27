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

/**
 * Data produced by a `GlobalHeaderComponentBlueprint` extension.
 * Represents a single toolbar-level item in the global header.
 *
 * @alpha
 */
export interface GlobalHeaderComponentData {
  component: ComponentType<any>;
  priority?: number;
  /** MUI `sx`-compatible layout overrides applied by the header wrapper. */
  layout?: Record<string, unknown>;
}

/**
 * Data produced by a `GlobalHeaderMenuItemBlueprint` extension.
 * Represents a single menu item inside a header dropdown.
 *
 * When `type` is `'component'`, the item is a self-contained component that
 * controls its own layout and `MenuItem` wrapping (e.g. `SoftwareTemplatesSection`,
 * `LogoutButton`).
 *
 * When `type` is `'data'` (the default), the item is data-driven: it is
 * grouped by `sectionLabel` and rendered through `MenuSection`
 * which provides `<MenuItem>` wrapping, `<Link>` navigation, section headers
 * and dividers.
 *
 * @alpha
 */
export interface GlobalHeaderMenuItemData {
  target: string;
  /**
   * React component used for rendering. Required when `type` is `'component'`.
   * For `type: 'data'` items, defaults to the built-in `MenuItemLink`.
   */
  component?: ComponentType<any>;
  priority?: number;
  /**
   * Controls how the item is rendered.
   *
   * - `'data'` (default) -- grouped by `sectionLabel` and rendered through
   *   `MenuSection` with standard `MenuItem` wrapping.
   * - `'component'` -- rendered directly; the component controls its own
   *   layout and `MenuItem` wrapping.
   */
  type?: 'component' | 'data';
  /** Display title for the item. */
  title?: string;
  /** Translation key for the title. */
  titleKey?: string;
  /** Icon identifier passed to `HeaderIcon`. */
  icon?: string;
  /** Secondary title rendered below the main title. */
  subTitle?: string;
  /** Translation key for the secondary title. */
  subTitleKey?: string;
  /** Navigation URL. External links show a launch indicator. */
  link?: string;
  /** Click handler invoked when the item is selected (in addition to closing the menu). */
  onClick?: () => void;
  /**
   * Section label used both as the grouping key and the displayed header.
   * Items sharing the same string are grouped together and rendered as a
   * single `MenuSection`. Auto-translated when the value contains
   * dots (e.g. `'applicationLauncher.sections.documentation'`).
   */
  sectionLabel?: string;
  /** Optional URL rendered as a clickable link in the section header row. */
  sectionLink?: string;
  /** Display text for the section header link. */
  sectionLinkLabel?: string;
}
