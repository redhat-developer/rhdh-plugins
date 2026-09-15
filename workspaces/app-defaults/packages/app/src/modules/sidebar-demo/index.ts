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

import { createFrontendModule } from '@backstage/frontend-plugin-api';
import {
  SidebarItemBlueprint,
  SidebarItemGroupBlueprint,
} from '@red-hat-developer-hub/backstage-plugin-app-react';
import HelpIcon from '@mui/icons-material/HelpOutline';

/**
 * Demo contributions for the priority-ordered sidebar provided by
 * `@red-hat-developer-hub/backstage-plugin-app-defaults`. The search modal,
 * the spacer and dividers, and the notifications item come from the app
 * defaults module itself.
 *
 * - `Help` is an action item (no `to`) that opens the Red Hat Developer
 *   Hub documentation in a new tab and sits in the bottom block next to notifications.
 * - `Docs` and `APIs` take over the auto-discovered TechDocs and API docs
 *   nav items (same `to`) and move them into the `Documentation` group.
 * - The `Documentation` group uses the default inline submenu.
 * - `App Visualizer` joins the default `Settings` group, and `RBAC` and
 *   `Plugins` join the default `Administration` group, which app-defaults
 *   keeps hidden until a module contributes an item to it.
 *
 * Resulting order, top to bottom: logo, search, auto-discovered pages,
 * Documentation, [spacer], divider, Notifications, Help, divider,
 * Administration, Settings.
 */
const helpItem = SidebarItemBlueprint.make({
  name: 'help',
  params: {
    title: 'Help',
    icon: HelpIcon,
    onClick: () => {
      window.open(
        'https://access.redhat.com/documentation/red_hat_developer_hub',
        '_blank',
        'noopener',
      );
    },
    priority: -50,
  },
});

const documentationGroup = SidebarItemGroupBlueprint.make({
  name: 'documentation',
  params: {
    id: 'documentation',
    title: 'Documentation',
    icon: 'school',
    priority: -10,
  },
});

const docsItem = SidebarItemBlueprint.make({
  name: 'docs',
  params: {
    title: 'Docs',
    icon: 'school',
    to: '/docs',
    group: 'documentation',
    priority: 10,
  },
});

const apiDocsItem = SidebarItemBlueprint.make({
  name: 'api-docs',
  params: {
    title: 'APIs',
    icon: 'extension',
    to: '/api-docs',
    group: 'documentation',
  },
});

/** Dummy entry for the default Settings group of app-defaults. */
const visualizerItem = SidebarItemBlueprint.make({
  name: 'visualizer',
  params: {
    title: 'App Visualizer',
    icon: 'layers',
    to: '/visualizer',
    group: 'settings',
  },
});

/**
 * Dummy entries for the default Administration group of app-defaults. The
 * group only becomes visible because these items reference it.
 */
const rbacItem = SidebarItemBlueprint.make({
  name: 'rbac',
  params: {
    title: 'RBAC',
    icon: 'security',
    to: '/admin/rbac',
    group: 'admin',
    priority: 10,
  },
});

const pluginsItem = SidebarItemBlueprint.make({
  name: 'plugins',
  params: {
    title: 'Plugins',
    icon: 'extension',
    to: '/admin/plugins',
    group: 'admin',
  },
});

export const sidebarDemoModule = createFrontendModule({
  pluginId: 'app',
  extensions: [
    helpItem,
    documentationGroup,
    docsItem,
    apiDocsItem,
    visualizerItem,
    rbacItem,
    pluginsItem,
  ],
});
