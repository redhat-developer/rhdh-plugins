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
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import { rootRouteRef } from '../routes';
import ExtensionIcon from '@material-ui/icons/Extension';
import { MUI5TestPageComponent } from '..';

const mui5TestPage = PageBlueprint.make({
  params: {
    path: '/mui5-test',
    title: 'MUI v5 Tests',
    icon: <ExtensionIcon />,
    routeRef: rootRouteRef,
    loader: async () => <MUI5TestPageComponent />,
  },
});

/*
 * @alpha
 */
export default createFrontendPlugin({
  pluginId: 'mui5-test',
  info: { packageJson: () => import('../../package.json') },
  extensions: [mui5TestPage],
  routes: { root: rootRouteRef },
});
