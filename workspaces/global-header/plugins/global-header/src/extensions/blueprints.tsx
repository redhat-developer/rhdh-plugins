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

import { globalHeaderComponentDataRef } from './dataRefs';
import {
  loadCriticalHeaderBundle,
  loadHeaderIconButton,
} from '../components/loaders';
import {
  resolveLazyComponent,
  resolveSyncComponent,
} from './resolveExtensionComponent';

// Re-export menu-item blueprint from its thin module so existing
// `from './blueprints'` / package-root imports keep working.
export {
  GlobalHeaderMenuItemBlueprint,
  type MenuItemParams,
} from './menuItemBlueprint';

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

// ---------------------------------------------------------------------------
// Data-driven component factories
// ---------------------------------------------------------------------------

/**
 * Data-driven toolbar UI is loaded asynchronously so HeaderIconButton / MUI
 * stay off the blueprint module's sync graph.
 */
function createDataDrivenToolbarLoader(
  params: ToolbarComponentParams,
): () => Promise<ComponentType<any>> {
  return async () => {
    if (params.link) {
      const HeaderIconButton = await loadHeaderIconButton();
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
      criticalHeaderBundle,
      { useTranslation },
      { translateWithFallback },
    ] = await Promise.all([
      import('@mui/material/IconButton'),
      import('@mui/material/Tooltip'),
      loadCriticalHeaderBundle(),
      import('../hooks/useTranslation'),
      import('../utils/translationUtils'),
    ]);

    const { HeaderIcon } = criticalHeaderBundle;

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
  configSchema: {
    priority: z.number().optional(),
  },
  *factory(params: ToolbarComponentParams, { config, node }) {
    yield globalHeaderComponentDataRef({
      component: resolveToolbarComponent(params, node),
      priority: config.priority ?? params.priority,
      layout: params.layout,
    });
  },
});
