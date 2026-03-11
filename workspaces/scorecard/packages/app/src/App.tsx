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
import { convertLegacyAppOptions } from '@backstage/core-compat-api';
import { SignInPage } from '@backstage/core-components';
import { githubAuthApiRef, gitlabAuthApiRef } from '@backstage/core-plugin-api';
import { getThemes } from '@red-hat-developer-hub/backstage-plugin-theme';
import scorecardPlugin, {
  scorecardTranslationsModule,
  createScorecardCatalogModule,
} from '@red-hat-developer-hub/backstage-plugin-scorecard/alpha';

import catalogPlugin from '@backstage/plugin-catalog/alpha';
import scaffolderPlugin from '@backstage/plugin-scaffolder/alpha';
import userSettingsPlugin from '@backstage/plugin-user-settings/alpha';
import rbac from '@backstage-community/plugin-rbac/alpha';

/*
 * Custom sign-in page (legacy component). SignInPageBlueprint and ThemeBlueprint
 * are deprecated; sign-in and themes are provided via convertLegacyAppOptions.
 */
const customSignInPage = (props: React.ComponentProps<typeof SignInPage>) => (
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
    ]}
  />
);

/*
 * Legacy options: themes (RHDH light/dark) and SignInPage.
 * Replaces deprecated SignInPageBlueprint and ThemeBlueprint modules.
 */
const legacyConvertedOptions = convertLegacyAppOptions({
  themes: getThemes(),
  components: {
    SignInPage: customSignInPage as React.ComponentType<any>,
  },
});

/*
 * Scorecard: entity kinds that show the Scorecard tab on the catalog entity page.
 * Catalog module attaches to catalogPlugin for these kinds only.
 */
const scorecardEntityKinds = ['component', 'service', 'template'];
const scorecardCatalogModule = createScorecardCatalogModule({
  entityKinds: scorecardEntityKinds,
});

const scorecard = [
  scorecardCatalogModule,
  scorecardTranslationsModule,
  scorecardPlugin,
];

/*
 * app: Backstage app using the New Frontend System (NFS).
 * Sign-in and themes use legacy options (convertLegacyAppOptions).
 */
const app = createApp({
  features: [
    legacyConvertedOptions,
    ...scorecard,
    catalogPlugin,
    scaffolderPlugin,
    userSettingsPlugin,
    rbac,
  ],
});

export default app.createRoot();
