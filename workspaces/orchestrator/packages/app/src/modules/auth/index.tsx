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

import React from 'react';
import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { SignInPageBlueprint } from '@backstage/plugin-app-react';
import { githubAuthApiRef } from '@backstage/core-plugin-api';

export const authSignInPageModule = createFrontendModule({
  pluginId: 'app',
  extensions: [
    SignInPageBlueprint.make({
      params: {
        loader: async () => {
          const { SignInPage } = await import('@backstage/core-components');

          return props =>
            React.createElement(SignInPage, {
              ...props,
              providers: [
                {
                  id: 'github-auth-provider',
                  title: 'GitHub',
                  message: 'Sign in using GitHub',
                  apiRef: githubAuthApiRef,
                },
                'guest',
              ],
            });
        },
      },
    }),
  ],
});
