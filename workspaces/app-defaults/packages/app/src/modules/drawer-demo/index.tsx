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
  AppDrawerContentBlueprint,
  GlobalHeaderMenuItemBlueprint,
} from '@red-hat-developer-hub/backstage-plugin-app-react';
import { ChatDrawerContent, HelpDrawerContent } from './DrawerDemoContent';

const chatDrawer = AppDrawerContentBlueprint.make({
  name: 'demo-chat',
  params: {
    id: 'demo-chat',
    element: <ChatDrawerContent />,
    resizable: true,
    defaultWidth: 450,
  },
});

const helpDrawer = AppDrawerContentBlueprint.make({
  name: 'demo-help',
  params: {
    id: 'demo-help',
    element: <HelpDrawerContent />,
    defaultWidth: 350,
  },
});

const helpMenuItem = GlobalHeaderMenuItemBlueprint.make({
  name: 'demo-help',
  params: {
    target: 'help',
    priority: 50,
    // Import building blocks from `/global-header-components` inside the
    // loader so they stay off the root Module Federation sync chunk.
    loader: () =>
      import('./HelpDrawerMenuItem').then(m => m.HelpDrawerMenuItem),
  },
});

export const drawerDemoModule = createFrontendModule({
  pluginId: 'app',
  extensions: [chatDrawer, helpDrawer, helpMenuItem],
});
