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

import { createElement } from 'react';
import { createFrontendModule } from '@backstage/frontend-plugin-api';
import {
  SidebarElementBlueprint,
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
 * - `App Visualizer` joins the default `Settings` group, and `Plugins`
 *   joins the default `Administration` group next to the `RBAC` item that
 *   app-defaults ships there.
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
 * Dummy entry for the default Administration group of app-defaults, added
 * next to the RBAC item that app-defaults ships in that group.
 */
const pluginsItem = SidebarItemBlueprint.make({
  name: 'plugins',
  params: {
    title: 'Plugins',
    icon: 'extension',
    to: '/admin/plugins',
    group: 'admin',
  },
});

/**
 * Fixed 64px spacer rendered above the logo. Uses a higher priority than the
 * app-defaults logo element (2000) so it sits at the very top of the sidebar.
 */
const TopSpacer = () =>
  createElement(
    'svg',
    {
      width: '100%',
      height: '64px',
      viewBox: '0 0 70 64',
      preserveAspectRatio: 'none',
      role: 'img',
      'aria-label': 'Red cross',
    },
    createElement('rect', {
      x: 0,
      y: 0,
      width: 70,
      height: 64,
      fill: 'none',
      stroke: 'red',
      strokeWidth: 1,
    }),
    createElement('line', {
      x1: 0,
      y1: 0,
      x2: 70,
      y2: 64,
      stroke: 'red',
      strokeWidth: 1,
    }),
    createElement('line', {
      x1: 70,
      y1: 0,
      x2: 0,
      y2: 64,
      stroke: 'red',
      strokeWidth: 1,
    }),
  );

const topSpacerElement = SidebarElementBlueprint.make({
  name: 'top-spacer',
  params: {
    component: TopSpacer,
    priority: 3000,
  },
});

/**
 * Custom element that throws on render, used to demonstrate that app-defaults
 * wraps every sidebar element in an error boundary: this element fails without
 * taking down the rest of the sidebar.
 */
const CrashingElement = () => {
  throw new Error('This sidebar element crashes on purpose.');
};

const crashingElement = SidebarElementBlueprint.make({
  name: 'crashing',
  params: {
    component: CrashingElement,
    priority: 5,
  },
});

export const sidebarDemoModule = createFrontendModule({
  pluginId: 'app',
  extensions: [
    topSpacerElement,
    crashingElement,
    helpItem,
    documentationGroup,
    docsItem,
    apiDocsItem,
    visualizerItem,
    pluginsItem,
  ],
});
