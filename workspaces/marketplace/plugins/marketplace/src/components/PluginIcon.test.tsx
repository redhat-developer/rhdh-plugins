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

import { render } from '@testing-library/react';

import { MarketplacePlugin } from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import { PluginIcon } from './PluginIcon';

const testPlugin: MarketplacePlugin = {
  apiVersion: 'extensions.backstage.io/v1alpha1',
  kind: 'Plugin',
  metadata: {
    name: 'test-plugin',
    title: 'APIs with Test plugin',
    description: 'Test plugin.',
  },
  spec: {
    icon: 'https://backstage.io/icons/test-plugin.png',
    owner: 'test-group',
    packages: ['package-a', 'package-b'],
  },
};

describe('PluginIcon', () => {
  it('should render without error', () => {
    const { getByRole } = render(<PluginIcon plugin={testPlugin} size={40} />);
    expect(getByRole('img')).toBeInTheDocument();
    expect(getByRole('img').style.backgroundImage).toEqual(
      'url(https://backstage.io/icons/test-plugin.png)',
    );
  });

  it('should render no image when icon is missing', () => {
    const testPluginWithoutIcon = {
      ...testPlugin,
      spec: { ...testPlugin.spec, icon: undefined },
    };
    const { queryAllByRole } = render(
      <PluginIcon plugin={testPluginWithoutIcon} size={40} />,
    );
    expect(queryAllByRole('img')).toHaveLength(0);
  });
});
