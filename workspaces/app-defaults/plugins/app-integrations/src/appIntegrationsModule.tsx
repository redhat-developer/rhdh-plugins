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
  bitbucketAuthApiRef,
  configApiRef,
  githubAuthApiRef,
  gitlabAuthApiRef,
  microsoftAuthApiRef,
} from '@backstage/core-plugin-api';
import {
  ApiBlueprint,
  createFrontendModule,
} from '@backstage/frontend-plugin-api';
import {
  ScmIntegrationsApi,
  scmAuthApiRef,
  scmIntegrationsApiRef,
} from '@backstage/integration-react';

import { mergeScmAuthFromDeps } from './mergeScmAuthFromDeps';

const scmIntegrationsApi = ApiBlueprint.make({
  name: 'scm-integrations',
  params: defineParams =>
    defineParams({
      api: scmIntegrationsApiRef,
      deps: { configApi: configApiRef },
      factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
    }),
});

const scmAuthApi = ApiBlueprint.make({
  name: 'scm-auth',
  params: defineParams =>
    defineParams({
      api: scmAuthApiRef,
      deps: {
        github: githubAuthApiRef,
        gitlab: gitlabAuthApiRef,
        azure: microsoftAuthApiRef,
        bitbucket: bitbucketAuthApiRef,
        configApi: configApiRef,
      },
      factory: ({ github, gitlab, azure, bitbucket, configApi }) =>
        mergeScmAuthFromDeps({
          github,
          gitlab,
          azure,
          bitbucket,
          configApi,
        }),
    }),
});

/**
 * RHDH-style `scmIntegrationsApiRef` + `scmAuthApiRef` for `pluginId: 'app'`.
 * Default-export this module for dynamic frontend loading.
 *
 * @alpha
 */
export const appIntegrationsModule = createFrontendModule({
  pluginId: 'app',
  extensions: [scmIntegrationsApi, scmAuthApi],
});
