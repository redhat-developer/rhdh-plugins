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
  createFrontendModule,
  createFrontendPlugin,
} from '@backstage/frontend-plugin-api';
import { SignInPageBlueprint } from '@backstage/plugin-app-react';
import { SignInPage } from '@backstage/core-components';
import { githubAuthApiRef } from '@backstage/core-plugin-api';
import { rhdhThemeModule } from '@red-hat-developer-hub/backstage-plugin-theme/alpha';
import {
  globalHeaderModule,
  globalHeaderTranslationsModule,
  GlobalHeaderMenuItemBlueprint,
  GlobalHeaderMenuItem,
} from '@red-hat-developer-hub/backstage-plugin-global-header/alpha';
import { navModule } from './modules/nav';

const signInModule = createFrontendModule({
  pluginId: 'app',
  extensions: [
    SignInPageBlueprint.make({
      params: {
        loader: async () => props =>
          (
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
              ]}
            />
          ),
      },
    }),
  ],
});

const CustomHelpMenuItem = ({ handleClose }: { handleClose?: () => void }) => (
  <GlobalHeaderMenuItem
    to="https://backstage.io/docs"
    title="Backstage Docs"
    icon="menu_book"
    onClick={handleClose}
  />
);

const headerExamplesPlugin = createFrontendPlugin({
  pluginId: 'header-examples',
  extensions: [
    GlobalHeaderMenuItemBlueprint.make({
      name: 'custom-help-docs',
      params: {
        target: 'help',
        component: CustomHelpMenuItem,
        priority: 50,
      },
    }),
  ],
});

export default createApp({
  features: [
    rhdhThemeModule,
    navModule,
    signInModule,
    globalHeaderModule,
    globalHeaderTranslationsModule,
    headerExamplesPlugin,
  ],
});
