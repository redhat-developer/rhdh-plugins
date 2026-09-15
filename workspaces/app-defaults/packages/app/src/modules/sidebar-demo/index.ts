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
 * - `Help` is an action item (no `to`) that opens the Backstage docs in a
 *   new tab and sits in the bottom block next to notifications.
 * - `Docs` and `APIs` take over the auto-discovered TechDocs and API docs
 *   nav items (same `to`) and move them into the `Documentation` group.
 * - The `Documentation` group uses the default inline submenu, while the
 *   `Settings` group collects the user settings and app visualizer pages in
 *   a flyout submenu and is pinned to the very bottom via the lowest
 *   priority.
 *
 * Resulting order, top to bottom: search, auto-discovered pages,
 * Documentation, [spacer], divider, Notifications, Help, divider, Settings.
 */
const helpItem = SidebarItemBlueprint.make({
  name: 'help',
  params: {
    title: 'Help',
    icon: HelpIcon,
    onClick: () => {
      window.open('https://backstage.io/docs', '_blank', 'noopener');
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

const settingsGroup = SidebarItemGroupBlueprint.make({
  name: 'settings',
  params: {
    id: 'settings',
    title: 'Settings',
    icon: 'manageAccounts',
    to: '/settings',
    priority: -100,
    submenu: 'flyout',
  },
});

const userSettingsItem = SidebarItemBlueprint.make({
  name: 'user-settings',
  params: {
    title: 'User Settings',
    icon: 'account',
    to: '/settings',
    group: 'settings',
    priority: 10,
  },
});

const visualizerItem = SidebarItemBlueprint.make({
  name: 'visualizer',
  params: {
    title: 'App Visualizer',
    icon: 'layers',
    to: '/visualizer',
    group: 'settings',
  },
});

export const sidebarDemoModule = createFrontendModule({
  pluginId: 'app',
  extensions: [
    helpItem,
    documentationGroup,
    docsItem,
    apiDocsItem,
    settingsGroup,
    userSettingsItem,
    visualizerItem,
  ],
});
