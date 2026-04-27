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
import { createExtensionBlueprint } from '@backstage/frontend-plugin-api';

import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import { HeaderIconButton } from '../../components/HeaderIconButton/HeaderIconButton';
import { HeaderIcon } from '../../components/HeaderIcon/HeaderIcon';
import { useTranslation } from '../../hooks/useTranslation';
import { translateWithFallback } from '../../utils/translationUtils';

import {
  globalHeaderComponentDataRef,
  globalHeaderMenuItemDataRef,
} from './dataRefs';

/**
 * Params accepted by {@link GlobalHeaderComponentBlueprint}.
 *
 * Supply `component` for full control (tier 2/3), or provide data fields
 * (`icon`, `title`, `link`/`onClick`) and let the framework render a
 * consistent `HeaderIconButton` automatically (tier 1).
 *
 * @alpha
 */
export interface ToolbarComponentParams {
  icon?: string;
  title?: string;
  titleKey?: string;
  tooltip?: string;
  link?: string;
  onClick?: () => void;
  component?: ComponentType<any>;
  priority?: number;
  /** MUI `sx`-compatible layout overrides applied by the header wrapper. */
  layout?: Record<string, unknown>;
}

/**
 * Params accepted by {@link GlobalHeaderMenuItemBlueprint}.
 *
 * Supply `component` for full control, or provide data fields
 * (`title`, `icon`, `link`) and let the framework render a
 * consistent `MenuItemLink` automatically.
 *
 * Items with a `component` but **no** data fields (`title`, `link`, etc.)
 * are rendered directly by the dropdown — the component controls its own
 * layout and `MenuItem` wrapping (e.g. `SoftwareTemplatesSection`,
 * `LogoutButton`).
 *
 * Items with data fields (with or without a custom component) are grouped
 * by `sectionLabel` and rendered inside `MenuSection`.
 *
 * @alpha
 */
export interface MenuItemParams {
  target: string;
  title?: string;
  titleKey?: string;
  subTitle?: string;
  subTitleKey?: string;
  icon?: string;
  link?: string;
  onClick?: () => void;
  component?: ComponentType<any>;
  priority?: number;
  /** Section label used as the grouping key and the displayed section header. */
  sectionLabel?: string;
  /** URL rendered as a clickable link in the section header row. */
  sectionLink?: string;
  /** Display text for the section header link. */
  sectionLinkLabel?: string;
}

// ---------------------------------------------------------------------------
// Data-driven component factories
// ---------------------------------------------------------------------------

function createDataDrivenToolbarComponent(
  params: ToolbarComponentParams,
): ComponentType<any> {
  if (params.link) {
    const LinkButton = () => (
      <HeaderIconButton
        title={params.title ?? ''}
        titleKey={params.titleKey}
        icon={params.icon ?? ''}
        tooltip={params.tooltip}
        to={params.link!}
      />
    );
    return LinkButton;
  }

  const ActionButton = () => {
    const { t } = useTranslation();
    const displayTitle = translateWithFallback(
      t,
      params.titleKey,
      params.title,
    );
    return (
      <Tooltip title={params.tooltip ?? displayTitle ?? ''}>
        <IconButton
          onClick={params.onClick}
          color="inherit"
          size="small"
          aria-label={displayTitle ?? ''}
        >
          {params.icon && <HeaderIcon icon={params.icon} size="small" />}
        </IconButton>
      </Tooltip>
    );
  };
  return ActionButton;
}

// ---------------------------------------------------------------------------
// Blueprints
// ---------------------------------------------------------------------------

/**
 * Blueprint for contributing toolbar-level items to the global header.
 *
 * Supports three tiers:
 *
 * 1. **Data-driven** -- provide `icon`, `title`, `link` (or `onClick`) and the
 *    framework renders a consistent `HeaderIconButton` automatically.
 * 2. **Building blocks** -- provide a `component` that uses the exported
 *    `GlobalHeaderIconButton` / `GlobalHeaderDropdown` for consistent styling.
 * 3. **Fully custom** -- provide any arbitrary React component.
 *
 * The `priority` can be overridden by deployers via `app-config.yaml`:
 *
 * ```yaml
 * app:
 *   extensions:
 *     - gh-component:global-header/search:
 *         config:
 *           priority: 200
 * ```
 *
 * @alpha
 */
export const GlobalHeaderComponentBlueprint = createExtensionBlueprint({
  kind: 'gh-component',
  attachTo: {
    id: 'app-root-wrapper:app/global-header',
    input: 'components',
  },
  output: [globalHeaderComponentDataRef],
  dataRefs: { componentData: globalHeaderComponentDataRef },
  config: {
    schema: {
      priority: z => z.number().optional(),
    },
  },
  *factory(params: ToolbarComponentParams, { config }) {
    const component =
      params.component ?? createDataDrivenToolbarComponent(params);

    yield globalHeaderComponentDataRef({
      component,
      priority: config.priority ?? params.priority,
      layout: params.layout,
    });
  },
});

/**
 * Blueprint for contributing menu items to a header dropdown.
 *
 * The `target` field routes the item to the correct dropdown (e.g. `'create'`,
 * `'profile'`, `'help'`, `'app-launcher'`, or any custom target).
 *
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
 * @alpha
 */
export const GlobalHeaderMenuItemBlueprint = createExtensionBlueprint({
  kind: 'gh-menu-item',
  attachTo: {
    id: 'app-root-wrapper:app/global-header',
    input: 'menuItems',
  },
  output: [globalHeaderMenuItemDataRef],
  dataRefs: { menuItemData: globalHeaderMenuItemDataRef },
  config: {
    schema: {
      priority: z => z.number().optional(),
      title: z => z.string().optional(),
      titleKey: z => z.string().optional(),
      icon: z => z.string().optional(),
      link: z => z.string().optional(),
      sectionLabel: z => z.string().optional(),
      sectionLink: z => z.string().optional(),
      sectionLinkLabel: z => z.string().optional(),
    },
  },
  *factory(params: MenuItemParams, { config }) {
    const title = config.title ?? params.title;
    const titleKey =
      config.titleKey ?? (config.title ? undefined : params.titleKey);
    const link = config.link ?? params.link;
    const hasDataFields = !!(title || titleKey || link);

    yield globalHeaderMenuItemDataRef({
      target: params.target,
      component: params.component,
      type: params.component && !hasDataFields ? 'component' : 'data',
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
