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

import { waitFor } from '@testing-library/react';
import { createFrontendPlugin } from '@backstage/frontend-plugin-api';
import { renderTestApp } from '@backstage/frontend-test-utils';

import {
  searchExtension,
  spacerExtension,
} from '../defaults/toolbarExtensions';
import { globalHeaderModule } from './globalHeaderModule';

jest.mock('../components/SearchComponent/SearchComponent', () => ({
  SearchComponent: () => <span>Search</span>,
}));

const toolbarPlugin = createFrontendPlugin({
  pluginId: 'global-header',
  extensions: [searchExtension, spacerExtension],
});

describe('globalHeaderModule', () => {
  it.each([
    { searchEnabled: false, flexGrow: '1' },
    { searchEnabled: true, flexGrow: '0' },
  ])(
    'sets spacer wrapper growth to $flexGrow with search enabled: $searchEnabled',
    async ({ searchEnabled, flexGrow }) => {
      const { container } = renderTestApp({
        features: [globalHeaderModule, toolbarPlugin],
        config: {
          app: {
            extensions: [
              { 'gh-component:global-header/search': searchEnabled },
              { 'gh-component:global-header/spacer': true },
            ],
          },
        },
      });

      const spacer = await waitFor(
        () => {
          const element = container.querySelector(
            '#global-header div[style*="min-width: 8px"]',
          );
          expect(element).toBeInTheDocument();
          return element;
        },
        { timeout: 4000 },
      );

      expect(spacer?.parentElement).toHaveStyle({ flexGrow });
    },
  );
});
