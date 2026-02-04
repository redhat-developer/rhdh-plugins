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
  SignInPageBlueprint,
  createFrontendModule,
  githubAuthApiRef,
  gitlabAuthApiRef,
} from '@backstage/frontend-plugin-api';
import { SignInPage } from '@backstage/core-components';

// Import the new frontend system plugin for bulk-import
import bulkImportPlugin from '@red-hat-developer-hub/backstage-plugin-bulk-import/alpha';

// Create sign-in page extension with GitHub and GitLab providers
const signInPageExtension = SignInPageBlueprint.make({
  params: {
    loader: async () => props => (
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
    ),
  },
});

// Wrap in a module to make it a FrontendFeature
const signInModule = createFrontendModule({
  pluginId: 'app',
  extensions: [signInPageExtension],
});

/**
 * app-next: A Backstage app using the New Frontend System (NFS)
 *
 * This app is used to test the migrated bulk-import plugin with:
 * - createFrontendPlugin
 * - PageBlueprint
 * - NavItemBlueprint
 * - ApiBlueprint
 * - SignInPageBlueprint
 *
 * To run: yarn start:nfs
 */
const app = createApp({
  features: [
    // The bulk-import plugin for the new frontend system
    bulkImportPlugin,
    // Sign-in module with GitHub and GitLab providers
    signInModule,
  ],
});

// Export the app root element (not a component)
// In NFS, createRoot() returns a React element, not a component
export default app.createRoot();
