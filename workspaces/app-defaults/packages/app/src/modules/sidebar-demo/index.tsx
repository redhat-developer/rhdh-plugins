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
import { AppSidebarItemBlueprint } from '@red-hat-developer-hub/backstage-plugin-app-react/alpha';

const chatDrawer = AppSidebarItemBlueprint.make({
  name: 'demo-chat',
  params: {
    id: 'demo-chat',
    title: 'Chat',
    titleKey: 'app.demo.chat',
    // element: <ChatDrawerContent />,
  },
});

const helpDrawer = AppSidebarItemBlueprint.make({
  name: 'demo-help',
  params: {
    id: 'demo-help',
    title: 'Help',
    titleKey: 'app.demo.help',
    // element: <HelpDrawerContent />,
  },
});

export const sidebarDemoModule = createFrontendModule({
  pluginId: 'app',
  extensions: [chatDrawer, helpDrawer],
});
