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
  coreExtensionData,
  createExtension,
  createExtensionInput,
  createFrontendModule,
} from '@backstage/frontend-plugin-api';
import {
  appDrawerContentDataRef,
  appHeaderDataRef,
} from '@red-hat-developer-hub/backstage-plugin-app-react';

import { AppLayout } from './AppLayout';

/**
 * Override of the Backstage `app/layout` extension that renders the RHDH
 * {@link AppLayout}: all headers contributed via `AppHeaderBlueprint` on
 * top, and the sidebar, the page content and the app drawer side by side
 * below them.
 *
 * Extension ID: `app/layout`. `AppHeaderBlueprint` attaches to the
 * `headers` input and `AppDrawerContentBlueprint` to the `drawers` input,
 * both from `@red-hat-developer-hub/backstage-plugin-app-react`, so plugins
 * only need to declare their headers and drawers.
 *
 * @public
 */
export const appLayoutExtension = createExtension({
  name: 'layout',
  attachTo: { id: 'app/root', input: 'children' },
  inputs: {
    nav: createExtensionInput([coreExtensionData.reactElement], {
      singleton: true,
    }),
    content: createExtensionInput([coreExtensionData.reactElement], {
      singleton: true,
    }),
    headers: createExtensionInput([appHeaderDataRef]),
    drawers: createExtensionInput([appDrawerContentDataRef]),
  },
  output: [coreExtensionData.reactElement],
  factory({ inputs }) {
    const headers = inputs.headers.map(h => h.get(appHeaderDataRef));
    const drawers = inputs.drawers.map(d => d.get(appDrawerContentDataRef));
    return [
      coreExtensionData.reactElement(
        <AppLayout
          headers={headers}
          drawers={drawers}
          nav={inputs.nav.get(coreExtensionData.reactElement)}
          content={inputs.content.get(coreExtensionData.reactElement)}
        />,
      ),
    ];
  },
});

/**
 * Frontend module that provides the RHDH app layout with the app headers and
 * the app drawer. Registers the `app/layout` override that accepts header
 * and drawer contributions via inputs.
 *
 * @public
 */
export const appLayoutModule = createFrontendModule({
  pluginId: 'app',
  extensions: [appLayoutExtension],
});
