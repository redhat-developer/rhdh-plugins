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
import { createApp } from '@backstage/frontend-defaults';
import {
  ApiBlueprint,
  configApiRef,
  createFrontendModule,
  githubAuthApiRef,
  gitlabAuthApiRef,
  bitbucketAuthApiRef,
  microsoftAuthApiRef,
} from '@backstage/frontend-plugin-api';
import { ScmAuth, scmAuthApiRef } from '@backstage/integration-react';
import { SignInPage } from '@backstage/core-components';
import {
  SignInPageBlueprint,
  type SignInPageProps,
} from '@backstage/plugin-app-react';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import scaffolderPlugin from '@backstage/plugin-scaffolder/alpha';
import userSettingsPlugin from '@backstage/plugin-user-settings/alpha';
import x2aPlugin, {
  x2aTranslationsModule,
} from '@red-hat-developer-hub/backstage-plugin-x2a/alpha';
import { rhdhThemeModule } from '@red-hat-developer-hub/backstage-plugin-theme/alpha';
import { navModule } from './modules/nav';

const signInPageExtension = SignInPageBlueprint.make({
  params: {
    loader: async () => (props: SignInPageProps) => (
      <SignInPage
        {...props}
        auto
        providers={[
          'guest',
          {
            id: 'github-auth-provider',
            title: 'GitHub',
            message: 'Sign in using GitHub',
            apiRef: githubAuthApiRef,
          },
          {
            id: 'gitlab-auth-provider',
            title: 'GitLab',
            message: 'Sign in using GitLab',
            apiRef: gitlabAuthApiRef,
          },
          {
            id: 'bitbucket-auth-provider',
            title: 'Bitbucket',
            message: 'Sign in using Bitbucket',
            apiRef: bitbucketAuthApiRef,
          },
        ]}
      />
    ),
  },
});

// Copy of RHDH 1.10+'s `mergeScmAuthFromDeps`
// (workspaces/app-defaults/plugins/app-integrations): maps every
// `integrations.<type>[]` host to the per-type auth API, so the picker gets a
// token for self-hosted hosts. Overrides the default `scm-auth` API of
// `@backstage/plugin-app`. Dev app only; RHDH ships its own.
const scmAuthExtension = ApiBlueprint.make({
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
      factory: ({ github, gitlab, azure, bitbucket, configApi }) => {
        const providers = [
          { key: 'github', ref: github, factory: ScmAuth.forGithub },
          { key: 'gitlab', ref: gitlab, factory: ScmAuth.forGitlab },
          { key: 'azure', ref: azure, factory: ScmAuth.forAzure },
          { key: 'bitbucket', ref: bitbucket, factory: ScmAuth.forBitbucket },
        ];
        return ScmAuth.merge(
          ...providers.flatMap(({ key, ref, factory }) => {
            const configs = configApi.getOptionalConfigArray(
              `integrations.${key}`,
            );
            return configs?.length
              ? configs.map(c => factory(ref, { host: c.getString('host') }))
              : [factory(ref)];
          }),
        );
      },
    }),
});

const appModule = createFrontendModule({
  pluginId: 'app',
  extensions: [signInPageExtension, scmAuthExtension],
});

export default createApp({
  features: [
    rhdhThemeModule,
    navModule,
    appModule,
    catalogPlugin,
    scaffolderPlugin,
    userSettingsPlugin,
    x2aPlugin,
    x2aTranslationsModule,
  ],
});
