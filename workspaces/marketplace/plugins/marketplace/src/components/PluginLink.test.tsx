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

import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';

import {
  MarketplaceApi,
  MarketplacePlugin,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import { marketplaceApiRef } from '../api';
import { rootRouteRef } from '../routes';
import { PluginLink } from './PluginLink';

const testPlugin: MarketplacePlugin = {
  apiVersion: 'extensions.backstage.io/v1alpha1',
  kind: 'Plugin',
  metadata: {
    namespace: 'default',
    name: 'test-plugin',
    title: 'APIs with Test plugin',
    description: 'Test plugin.',
  },
  spec: {
    owner: 'test-group',
    packages: ['package-a', 'package-b'],
  },
};

const apis = [[marketplaceApiRef, {} as MarketplaceApi]] as const;

describe('PluginLink', () => {
  it('should render a link', async () => {
    const { getByRole } = await renderInTestApp(
      <TestApiProvider apis={apis}>
        <PluginLink plugin={testPlugin} />
      </TestApiProvider>,
      {
        mountedRoutes: {
          '/marketplace': rootRouteRef,
        },
      },
    );
    expect(getByRole('link')).toBeInTheDocument();
    expect(getByRole('link')).toHaveAttribute(
      'href',
      '/marketplace/plugins/default/test-plugin',
    );
    expect(getByRole('link')).toHaveTextContent('APIs with Test plugin');
  });
});
