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
import {
  createExtensionBlueprint,
  ExtensionBoundary,
  type AppNode,
} from '@backstage/frontend-plugin-api';

import {
  globalHeaderComponentDataRef,
  globalHeaderMenuItemDataRef,
} from './dataRefs';

/**
 * Params accepted by {@link GlobalHeaderComponentBlueprint}.
 *
 * Prefer {@link ToolbarComponentParams.loader} so the implementation is loaded
 * asynchronously (same pattern as `HomePageWidgetBlueprint` /
 * `HomePageLayoutBlueprint`). Supply data fields (`icon`, `title`, `link` /
 * `onClick`) with no loader/component for the built-in HeaderIconButton tier.
 *
 * @public
 */
export interface ToolbarComponentParams {
  icon?: string;
  title?: string;
  titleKey?: string;
  tooltip?: string;
  link?: string;
  onClick?: () => void;
  /**
   * Async component loader. Prefer this over {@link ToolbarComponentParams.component}
   * so the module graph stays off the NFS federation sync chunk.
   */
  loader?: () => Promise<ComponentType<any>>;
  /**
   * Sync component. Kept for compatibility; prefer {@link ToolbarComponentParams.loader}.
   */
  component?: ComponentType<any>;
  priority?: number;
  /** MUI `sx`-compatible layout overrides applied by the header wrapper. */
  layout?: Record<string, unknown>;
}

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
  target: string;
  title?: string;
  titleKey?: string;
  subTitle?: string;
  subTitleKey?: string;
  icon?: string;
  link?: string;
  onClick?: () => void;
  /**
   * Async component loader. Prefer this over {@link MenuItemParams.component}.
   */
  loader?: () => Promise<ComponentType<any>>;
  /**
   * Sync component. Kept for compatibility; prefer {@link MenuItemParams.loader}.
   */
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

function resolveLazyComponent(
  node: AppNode,
  loader: () => Promise<ComponentType<any>>,
): ComponentType<any> {
  return ExtensionBoundary.lazyComponent(node, async () => {
    const Comp = await loader();
    return (props: any) => <Comp {...props} />;
  });
}

function resolveSyncComponent(
  node: AppNode,
  Comp: ComponentType<any>,
): ComponentType<any> {
  return (props: any) => (
    <ExtensionBoundary node={node}>
      <Comp {...props} />
    </ExtensionBoundary>
  );
}

/**
 * Data-driven toolbar UI is loaded asynchronously so HeaderIconButton / MUI
 * stay off the blueprint module's sync graph.
 */
function createDataDrivenToolbarLoader(
  params: ToolbarComponentParams,
): () => Promise<ComponentType<any>> {
  return async () => {
    if (params.link) {
      const { HeaderIconButton } = await import(
        '../../components/HeaderIconButton/HeaderIconButton'
      );
      return () => (
        <HeaderIconButton
          title={params.title ?? ''}
          titleKey={params.titleKey}
          icon={params.icon ?? ''}
          tooltip={params.tooltip}
          to={params.link!}
        />
      );
    }

    const [
      { default: IconButton },
      { default: Tooltip },
      { HeaderIcon },
      { useTranslation },
      { translateWithFallback },
    ] = await Promise.all([
      import('@mui/material/IconButton'),
      import('@mui/material/Tooltip'),
      import('../../components/HeaderIcon/HeaderIcon'),
      import('../../hooks/useTranslation'),
      import('../../utils/translationUtils'),
    ]);

    return () => {
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
  };
}

function resolveToolbarComponent(
  params: ToolbarComponentParams,
  node: AppNode,
): ComponentType<any> {
  if (params.loader) {
    return resolveLazyComponent(node, params.loader);
  }
  if (params.component) {
    return resolveSyncComponent(node, params.component);
  }
  return resolveLazyComponent(node, createDataDrivenToolbarLoader(params));
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

// ---------------------------------------------------------------------------
// Blueprints
// ---------------------------------------------------------------------------

/**
 * Blueprint for contributing toolbar-level items to the global header.
 *
 * Supports three tiers:
 *
 * 1. **Data-driven** -- provide `icon`, `title`, `link` (or `onClick`) and the
 *    framework lazy-loads a consistent `HeaderIconButton`.
 * 2. **Loader** -- provide `loader: () => import(...).then(m => m.Comp)`
 *    (preferred for custom UI; mirrors `HomePageLayoutBlueprint`).
 * 3. **Sync component** -- provide `component` (compatibility only).
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
 * @public
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
  *factory(params: ToolbarComponentParams, { config, node }) {
    yield globalHeaderComponentDataRef({
      component: resolveToolbarComponent(params, node),
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
