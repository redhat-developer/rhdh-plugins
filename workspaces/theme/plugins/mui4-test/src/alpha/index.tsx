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

import {
  createFrontendPlugin,
  NavItemBlueprint,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import { rootRouteRef } from '../routes';
import ExtensionIcon from '@material-ui/icons/Extension';
import { MUI4TestPageComponent } from '..';

const mui4TestPage = PageBlueprint.make({
  params: {
    path: '/mui4-test',
    routeRef: rootRouteRef,
    loader: async () => <MUI4TestPageComponent />,
  },
});

const mui4TestNavItem = NavItemBlueprint.make({
  params: {
    title: 'MUI v4 Tests',
    routeRef: rootRouteRef,
    icon: ExtensionIcon,
  },
});

export default createFrontendPlugin({
  pluginId: 'mui4-test',
  info: { packageJson: () => import('../../package.json') },
  extensions: [mui4TestPage, mui4TestNavItem],
  routes: { root: rootRouteRef },
});
