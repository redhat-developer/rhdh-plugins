/*
 * Copyright The Backstage Authors
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

import type { ReactNode } from 'react';

import { createDevApp } from '@backstage/dev-utils';
import { mockApis, TestApiProvider } from '@backstage/test-utils';
import { configApiRef } from '@backstage/core-plugin-api';

import { getAllThemes } from '@red-hat-developer-hub/backstage-plugin-theme';

import {
  extensionsPlugin,
  ExtensionsFullPageRouter,
  ExtensionsTabbedPageRouter,
} from '../src/plugin';
import { extensionsTranslations } from '../src/alpha';
import { extensionsApiRef, dynamicPluginsInfoApiRef } from '../src/api';
import { MockExtensionsApi } from './__data__/mockExtensions';

const mockDynamicPluginsInfo = {
  listLoadedPlugins: async () => [],
};

const mockExtensionsConfig = mockApis.config({
  data: {
    extensions: {
      installation: {
        enabled: true,
        saveToSingleFile: {
          file: 'override.yaml',
        },
      },
    },
  },
});

const ExtensionsWrapper = ({ children }: { children: ReactNode }) => (
  <TestApiProvider
    apis={[
      [extensionsApiRef, new MockExtensionsApi()],
      [dynamicPluginsInfoApiRef, mockDynamicPluginsInfo],
      [configApiRef, mockExtensionsConfig],
    ]}
  >
    {children}
  </TestApiProvider>
);

createDevApp()
  .registerPlugin(extensionsPlugin)
  .addTranslationResource(extensionsTranslations)
  .setAvailableLanguages(['en', 'de', 'es', 'fr', 'it', 'ja'])
  .setDefaultLanguage('en')
  .addThemes(getAllThemes())
  .addPage({
    element: (
      <ExtensionsWrapper>
        <ExtensionsFullPageRouter />
      </ExtensionsWrapper>
    ),
    title: 'Full Page',
    path: '/full-page-router',
  })
  .addPage({
    element: (
      <ExtensionsWrapper>
        <ExtensionsTabbedPageRouter />
      </ExtensionsWrapper>
    ),
    title: 'Tabbed Page',
    path: '/tabbed-page-router',
  })
  .render();
