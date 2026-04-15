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
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';
import { createScaffolderFieldExtension } from '@backstage/plugin-scaffolder-react';

import { rootRouteRef } from './routes';
import {
  RepoAuthentication,
  repoAuthenticationValidation,
  RepoUrlPickerWithBitbucketFix,
} from './scaffolder';
import { repoPickerValidation } from '@backstage/plugin-scaffolder';

/** @public */
export const x2APlugin = createPlugin({
  id: 'x2a',
  routes: {
    root: rootRouteRef,
  },
});

/** @public */
export const X2APage = x2APlugin.provide(
  createRoutableExtension({
    name: 'X2APage',
    component: () => import('./components/Router').then(m => m.Router),
    mountPoint: rootRouteRef,
  }),
);

/** @public */
export const RepoAuthenticationExtension = x2APlugin.provide(
  createScaffolderFieldExtension({
    component: RepoAuthentication,
    name: 'RepoAuthentication', // name used in ui:field in templates
    validation: repoAuthenticationValidation,
  }),
);

/**
 * Scaffolder field extension that wraps the built-in RepoUrlPicker with a fix
 * for Bitbucket Cloud/Server type resolution. Use `ui:field: X2ARepoUrlPicker`
 * in templates instead of `RepoUrlPicker` when bitbucket.org is an allowed host.
 *
 * @public
 */
export const X2ARepoUrlPickerExtension = x2APlugin.provide(
  createScaffolderFieldExtension({
    component: RepoUrlPickerWithBitbucketFix,
    name: 'X2ARepoUrlPicker',
    validation: repoPickerValidation,
  }),
);
