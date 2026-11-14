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
import { z } from 'zod';

import {
  createExtensionBlueprint,
  type AppNode,
} from '@backstage/frontend-plugin-api';

import { globalHeaderMenuItemDataRef } from './dataRefs';
import {
  resolveLazyComponent,
  resolveSyncComponent,
} from './resolveExtensionComponent';

/**
 * Params accepted by {@link GlobalHeaderMenuItemBlueprint}.
 *
 * Prefer {@link MenuItemParams.loader} for custom menu item UI.
 *
 * Items with a loader/component but **no** data fields (`title`, `link`, etc.)
 * are rendered directly by the dropdown — the component controls its own
 * layout and `MenuItem` wrapping (e.g. `LogoutButton`).
 *
 * Items with data fields are grouped by `sectionLabel` and rendered inside
 * `MenuSection`.
 *
 * @public
 */
export interface MenuItemParams {
  /** Dropdown target name that collects this item (for example `'help'`). */
  target: string;
  /** Display title for the item. */
  title?: string;
  /** Translation key for the title. */
  titleKey?: string;
  /** Secondary title rendered below the main title. */
  subTitle?: string;
  /** Translation key for the secondary title. */
  subTitleKey?: string;
  /** Icon identifier passed to `HeaderIcon`. */
  icon?: string;
  /** Navigation URL. External links show a launch indicator. */
  link?: string;
  /** Click handler invoked when the item is selected. */
  onClick?: () => void;
  /**
   * Async component loader. Prefer this over {@link MenuItemParams.component}.
   */
  loader?: () => Promise<ComponentType<any>>;
  /**
   * Sync component. Kept for compatibility; prefer {@link MenuItemParams.loader}.
   */
  component?: ComponentType<any>;
  /** Ordering priority. Higher values render first. */
  priority?: number;
  /** Section label used as the grouping key and the displayed section header. */
  sectionLabel?: string;
  /** URL rendered as a clickable link in the section header row. */
  sectionLink?: string;
  /** Display text for the section header link. */
  sectionLinkLabel?: string;
}

function resolveMenuItemComponent(
  params: MenuItemParams,
  node: AppNode,
): ComponentType<any> | undefined {
  if (params.loader) {
    return resolveLazyComponent(node, params.loader);
  }
  if (params.component) {
    return resolveSyncComponent(node, params.component);
  }
  return undefined;
}

/**
 * Blueprint for contributing menu items to a header dropdown.
 *
 * The `target` field routes the item to the correct dropdown (e.g. `'create'`,
 * `'profile'`, `'help'`, `'app-launcher'`, or any custom target).
 *
 * Prefer `loader` for custom components so their modules stay async.
 * **Custom components** (only `component`, no data fields) are rendered
 * directly by the dropdown — they control their own layout and wrapping.
 *
 * **Data-driven items** (at least `title`/`link`/`icon`) are grouped by
 * `sectionLabel` and rendered through `MenuSection` for consistent styling.
 *
 * Deployers can override any data field via `app-config.yaml`:
 *
 * ```yaml
 * app:
 *   extensions:
 *     - gh-menu-item:global-header/app-launcher-devhub:
 *         config:
 *           title: "Custom Title"
 *           sectionLabel: mySection
 * ```
 *
 * @public
 */
export const GlobalHeaderMenuItemBlueprint = createExtensionBlueprint({
  kind: 'gh-menu-item',
  attachTo: {
    id: 'app-root-wrapper:app/global-header',
    input: 'menuItems',
  },
  output: [globalHeaderMenuItemDataRef],
  dataRefs: { menuItemData: globalHeaderMenuItemDataRef },
  configSchema: {
    priority: z.number().optional(),
    title: z.string().optional(),
    titleKey: z.string().optional(),
    icon: z.string().optional(),
    link: z.string().optional(),
    sectionLabel: z.string().optional(),
    sectionLink: z.string().optional(),
    sectionLinkLabel: z.string().optional(),
  },
  *factory(params: MenuItemParams, { config, node }) {
    const title = config.title ?? params.title;
    const titleKey =
      config.titleKey ?? (config.title ? undefined : params.titleKey);
    const link = config.link ?? params.link;
    const component = resolveMenuItemComponent(params, node);
    const hasDataFields = !!(title || titleKey || link);

    yield globalHeaderMenuItemDataRef({
      target: params.target,
      component,
      type: component && !hasDataFields ? 'component' : 'data',
      title,
      titleKey,
      icon: config.icon ?? params.icon,
      link,
      onClick: params.onClick,
      subTitle: params.subTitle,
      subTitleKey: params.subTitleKey,
      sectionLabel: config.sectionLabel ?? params.sectionLabel,
      sectionLink: config.sectionLink ?? params.sectionLink,
      sectionLinkLabel: config.sectionLinkLabel ?? params.sectionLinkLabel,
      priority: config.priority ?? params.priority,
    });
  },
});
