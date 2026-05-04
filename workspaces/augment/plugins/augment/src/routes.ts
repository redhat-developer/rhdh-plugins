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
import { createRouteRef, createSubRouteRef } from '@backstage/core-plugin-api';

/**
 * Root route ref for the Augment plugin
 * @public
 */
export const rootRouteRef = createRouteRef({
  id: 'augment',
});

/**
 * Sub-route refs for URL-based navigation within the plugin.
 * Each major section of the UI is addressable via a dedicated sub-route.
 * @public
 */
export const chatRouteRef = createSubRouteRef({
  id: 'augment/chat',
  parent: rootRouteRef,
  path: '/chat',
});

export const chatSessionRouteRef = createSubRouteRef({
  id: 'augment/chat/session',
  parent: rootRouteRef,
  path: '/chat/:sessionId',
});

export const agentsRouteRef = createSubRouteRef({
  id: 'augment/agents',
  parent: rootRouteRef,
  path: '/agents',
});

export const agentDetailRouteRef = createSubRouteRef({
  id: 'augment/agents/detail',
  parent: rootRouteRef,
  path: '/agents/:namespace/:name',
});

export const agentCreateRouteRef = createSubRouteRef({
  id: 'augment/agents/create',
  parent: rootRouteRef,
  path: '/agents/create',
});

export const toolsRouteRef = createSubRouteRef({
  id: 'augment/tools',
  parent: rootRouteRef,
  path: '/tools',
});

export const toolDetailRouteRef = createSubRouteRef({
  id: 'augment/tools/detail',
  parent: rootRouteRef,
  path: '/tools/:namespace/:name',
});

export const buildsRouteRef = createSubRouteRef({
  id: 'augment/builds',
  parent: rootRouteRef,
  path: '/builds',
});

export const sandboxRouteRef = createSubRouteRef({
  id: 'augment/sandbox',
  parent: rootRouteRef,
  path: '/sandbox',
});

export const observeRouteRef = createSubRouteRef({
  id: 'augment/observe',
  parent: rootRouteRef,
  path: '/observe',
});

export const observeDashboardsRouteRef = createSubRouteRef({
  id: 'augment/observe/dashboards',
  parent: rootRouteRef,
  path: '/observe/dashboards',
});

export const registryRouteRef = createSubRouteRef({
  id: 'augment/registry',
  parent: rootRouteRef,
  path: '/registry',
});

export const settingsPlatformRouteRef = createSubRouteRef({
  id: 'augment/settings/platform',
  parent: rootRouteRef,
  path: '/settings/platform',
});

export const settingsBrandingRouteRef = createSubRouteRef({
  id: 'augment/settings/branding',
  parent: rootRouteRef,
  path: '/settings/branding',
});

export const settingsAdminRouteRef = createSubRouteRef({
  id: 'augment/settings/admin',
  parent: rootRouteRef,
  path: '/settings/admin',
});

export const docsRouteRef = createSubRouteRef({
  id: 'augment/docs',
  parent: rootRouteRef,
  path: '/docs',
});
