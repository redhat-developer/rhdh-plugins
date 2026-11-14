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
  resolveLazyComponent,
  resolveSyncComponent,
} from './resolveExtensionComponent';

/**
 * Params accepted by {@link GlobalHeaderComponentBlueprint}.
 *
 * Prefer {@link ToolbarComponentParams.loader} so the implementation is loaded
 * asynchronously. Supply data fields (`icon`, `title`, `link` / `onClick`) with
 * no loader/component for the built-in header icon-button tier rendered by the
 * default global-header implementation.
 *
 * @public
 */
export interface ToolbarComponentParams {
  /** Icon identifier for data-driven toolbar buttons. */
  icon?: string;
  /** Display title for data-driven toolbar buttons. */
  title?: string;
  /** Translation key for the title. */
  titleKey?: string;
  /** Tooltip for data-driven toolbar buttons. */
  tooltip?: string;
  /** Navigation URL for data-driven toolbar buttons. */
  link?: string;
  /** Click handler for data-driven toolbar buttons without a link. */
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
  /** Ordering priority. Higher values render first. */
  priority?: number;
  /** MUI `sx`-compatible layout overrides applied by the header wrapper. */
  layout?: Record<string, unknown>;
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
  throw new Error(
    'GlobalHeaderComponentBlueprint requires loader, component, or data fields',
  );
}

/**
 * Blueprint for contributing toolbar-level items to the global header.
 *
 * Supports three tiers:
 *
 * 1. **Data-driven** -- provide `icon`, `title`, `link` (or `onClick`) and the
 *    default global-header implementation renders a consistent icon button.
 * 2. **Loader** -- provide `loader: () => import(...).then(m => m.Comp)`
 *    (preferred for custom UI).
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
    const priority = config.priority ?? params.priority;
    const hasCustomUi = !!(params.loader || params.component);

    if (hasCustomUi) {
      yield globalHeaderComponentDataRef({
        id: node.spec.id,
        component: resolveToolbarComponent(params, node),
        priority,
        layout: params.layout,
      });
      return;
    }

    yield globalHeaderComponentDataRef({
      id: node.spec.id,
      icon: params.icon,
      title: params.title,
      titleKey: params.titleKey,
      tooltip: params.tooltip,
      link: params.link,
      onClick: params.onClick,
      priority,
      layout: params.layout,
    });
  },
});
