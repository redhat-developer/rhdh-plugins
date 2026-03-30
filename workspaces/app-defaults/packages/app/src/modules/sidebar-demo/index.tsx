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
  AppSidebarGroupBlueprint,
  AppSidebarItemBlueprint,
} from '@red-hat-developer-hub/backstage-plugin-app-react/alpha';
import CategoryIcon from '@material-ui/icons/Category';
import CloudIcon from '@material-ui/icons/Cloud';
import StorageIcon from '@material-ui/icons/Storage';
import LibraryBooksIcon from '@material-ui/icons/LibraryBooks';
import HelpIcon from '@material-ui/icons/Help';

// --- Group with children (attachTo pattern) ---

const platformGroup = AppSidebarGroupBlueprint.make({
  name: 'demo-platform',
  params: {
    id: 'demo-platform',
    title: 'Platform',
    icon: CategoryIcon,
  },
});

const clustersItem = AppSidebarItemBlueprint.make({
  name: 'demo-clusters',
  attachTo: platformGroup.inputs.children,
  params: {
    id: 'demo-clusters',
    title: 'Clusters',
    href: '/clusters',
    icon: CloudIcon,
  },
});

const databasesItem = AppSidebarItemBlueprint.make({
  name: 'demo-databases',
  attachTo: platformGroup.inputs.children,
  params: {
    id: 'demo-databases',
    title: 'Databases',
    href: '/databases',
    icon: StorageIcon,
  },
});

// --- Top-level href item ---

const docsItem = AppSidebarItemBlueprint.make({
  name: 'demo-docs',
  params: {
    id: 'demo-docs',
    title: 'Docs',
    href: '/docs',
    icon: LibraryBooksIcon,
  },
});

// --- Top-level item with custom element ---

const helpItem = AppSidebarItemBlueprint.make({
  name: 'demo-help',
  params: {
    id: 'demo-help',
    title: 'Help',
    icon: HelpIcon,
    href: '/help',
  },
});

export const sidebarDemoModule = createFrontendModule({
  pluginId: 'app',
  extensions: [platformGroup, clustersItem, databasesItem, docsItem, helpItem],
});
