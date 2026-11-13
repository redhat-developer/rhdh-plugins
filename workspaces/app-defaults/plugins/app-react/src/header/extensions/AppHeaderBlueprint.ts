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
import { z } from 'zod';

import { appHeaderDataRef } from './appHeaderDataRef';

/**
 * Blueprint for plugins to contribute a header bar to the app layout.
 *
 * Headers attach to the `headers` input of the `app/layout` extension
 * provided by `@red-hat-developer-hub/backstage-plugin-app-defaults`. The
 * layout stacks all contributed headers above the sidebar, the page content
 * and the app drawer, ordered by `priority` (higher first, i.e. closer to
 * the top of the viewport). Each header is rendered in its own error
 * boundary, so a failing header does not take down the rest of the app.
 *
 * `priority` can be overridden by deployers via `app-config.yaml`:
 *
 * ```yaml
 * app:
 *   extensions:
 *     - app-header:my-plugin/announcement:
 *         config:
 *           priority: 100
 * ```
 *
 * @example
 * ```
 * const announcementHeader = AppHeaderBlueprint.make({
 *   name: 'announcement',
 *   params: {
 *     component: AnnouncementBanner,
 *     priority: 100,
 *   },
 * });
 * ```
 *
 * @public
 */
export const AppHeaderBlueprint = createExtensionBlueprint({
  kind: 'app-header',
  attachTo: { id: 'app/layout', input: 'headers' },
  output: [appHeaderDataRef],
  dataRefs: {
    header: appHeaderDataRef,
  },
  configSchema: {
    priority: z.number().optional(),
  },
  *factory(
    params: {
      component: ComponentType<{}>;
      priority?: number;
    },
    { config, node },
  ) {
    yield appHeaderDataRef({
      id: node.spec.id,
      component: params.component,
      priority: config.priority ?? params.priority,
    });
  },
});
