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
 * `@red-hat-developer-hub/backstage-plugin-app-defaults`.
 *
 * - `Help` is an action item (no `to`) that opens the Backstage docs in a
 *   new tab and sinks below the auto-discovered pages via a negative priority.
 * - `Docs` and `APIs` take over the auto-discovered TechDocs and API docs
 *   nav items (same `to`) and move them into the `Documentation` group.
 * - The `Settings` group collects the user settings and app visualizer
 *   pages and sinks to the bottom via a negative priority.
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
