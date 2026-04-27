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
  githubAuthApiRef,
  gitlabAuthApiRef,
} from '@backstage/frontend-plugin-api';
import { SignInPage } from '@backstage/core-components';
import {
  SignInPageBlueprint,
  type SignInPageProps,
} from '@backstage/plugin-app-react';
import { rhdhThemeModule } from '@red-hat-developer-hub/backstage-plugin-theme/alpha';

import { navModule } from './modules/nav';

// Import the new frontend system plugin for bulk-import
import bulkImportPlugin, {
  bulkImportTranslationsModule,
} from '@red-hat-developer-hub/backstage-plugin-bulk-import/alpha';

// Import core Backstage plugins (NFS versions)
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import scaffolderPlugin from '@backstage/plugin-scaffolder/alpha';
import userSettingsPlugin from '@backstage/plugin-user-settings/alpha';

// Create sign-in page extension with GitHub and GitLab providers
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
 * NFS app: A Backstage app using the New Frontend System (NFS)
 *
 * This app is used to test the migrated bulk-import plugin with:
 * - createFrontendPlugin
 * - PageBlueprint
 * - NavItemBlueprint
 * - ApiBlueprint
 * - SignInPageBlueprint
 *
 * To run: yarn start (NFS) or yarn start:legacy (legacy app)
 */
const app = createApp({
  features: [
    // Core Backstage plugins (order determines sidebar: Catalog, Create, Bulk Import, Settings)
    catalogPlugin,
    scaffolderPlugin,
    bulkImportPlugin,
    userSettingsPlugin,
    // Sign-in module with GitHub and GitLab providers
    signInModule,
    // RHDH themes
    rhdhThemeModule,
    // Translations module (language selector configured via app-config.yaml)
    bulkImportTranslationsModule,
    // Custom sidebar with logo
    navModule,
  ],
});

// Export the app root element (not a component)
// In NFS, createRoot() returns a React element, not a component
export default app.createRoot();
