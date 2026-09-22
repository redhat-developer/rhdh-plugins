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
 * See the License for the permissions and limitations under the License.
 */

import { SidebarPage } from '@backstage/core-components';
import {
  coreExtensionData,
  createExtension,
  createExtensionInput,
  createFrontendModule,
} from '@backstage/frontend-plugin-api';
import { PageMainContainer } from '@red-hat-developer-hub/backstage-plugin-theme';

/**
 * Replaces the default `app/layout` so all non-sidebar content (PluginHeader,
 * Containers, routes) lives under one PatternFly-aligned main well.
 */
const AppLayout = createExtension({
  name: 'layout',
  attachTo: { id: 'app/root', input: 'children' },
  inputs: {
    nav: createExtensionInput([coreExtensionData.reactElement], {
      singleton: true,
    }),
    content: createExtensionInput([coreExtensionData.reactElement], {
      singleton: true,
    }),
  },
  output: [coreExtensionData.reactElement],
  factory: ({ inputs }) => [
    coreExtensionData.reactElement(
      <SidebarPage>
        {inputs.nav.get(coreExtensionData.reactElement)}
        <PageMainContainer>
          {inputs.content.get(coreExtensionData.reactElement)}
        </PageMainContainer>
      </SidebarPage>,
    ),
  ],
});

export const appLayoutModule = createFrontendModule({
  pluginId: 'app',
  extensions: [AppLayout],
});
