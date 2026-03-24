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
import { BUITestPageComponent } from '..';

const buiTestPage = PageBlueprint.make({
  params: {
    path: '/bui-test',
    title: 'BUI Tests',
    icon: <ExtensionIcon />,
    routeRef: rootRouteRef,
    loader: async () => <BUITestPageComponent />,
  },
});

/*
 * @alpha
 */
export default createFrontendPlugin({
  pluginId: 'bui-test',
  info: { packageJson: () => import('../../package.json') },
  extensions: [buiTestPage],
  routes: { root: rootRouteRef },
});
