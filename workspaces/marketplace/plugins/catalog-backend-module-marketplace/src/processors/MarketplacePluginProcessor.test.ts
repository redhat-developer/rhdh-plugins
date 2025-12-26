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

import { MarketplacePlugin } from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import { MarketplacePluginProcessor } from './MarketplacePluginProcessor';

const testPlugin: MarketplacePlugin = {
  apiVersion: 'extensions.backstage.io/v1alpha1',
  kind: 'Plugin',
  metadata: {
    name: 'test-plugin',
    title: 'APIs with Test plugin',
    description: 'Test plugin.',
  },
  spec: {
    owner: 'test-group',
    packages: ['package-a', 'package-b'],
  },
};

const getRelation = (
  type: string,
  sourceKind: string,
  sourceName: string,
  targetKind: string,
  targetName: string,
) => ({
  type: 'relation',
  relation: {
    type,
    source: {
      kind: sourceKind,
      namespace: 'default',
      name: sourceName,
    },
    target: {
      kind: targetKind,
      namespace: 'default',
      name: targetName,
    },
  },
});

describe('MarketplacePluginProcessor', () => {
  it('should return processor name', () => {
    const processor = new MarketplacePluginProcessor();
    expect(processor.getProcessorName()).toBe('MarketplacePluginProcessor');
  });

  it('should return validate the entity', async () => {
    const processor = new MarketplacePluginProcessor();

    expect(
      await processor.validateEntityKind({ ...testPlugin, kind: 'test' }),
    ).toBe(false);
    expect(await processor.validateEntityKind(testPlugin)).toBe(true);
  });

  it('should emit plugin owner relation', async () => {
    const processor = new MarketplacePluginProcessor();
    const emit = jest.fn();

    await processor.postProcessEntity(
      {
        ...testPlugin,
        spec: {
          ...testPlugin.spec,
          packages: [],
        },
      },
      undefined as any,
      emit,
    );

    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(
      getRelation('ownedBy', 'Plugin', 'test-plugin', 'Group', 'test-group'),
    );
  });

  it('should emit plugin package relations', async () => {
    const processor = new MarketplacePluginProcessor();

    const emit = jest.fn();
    await processor.postProcessEntity(
      {
        ...testPlugin,
        spec: {
          ...testPlugin.spec,
          owner: undefined,
        },
      },
      null as any,
      emit,
    );

    expect(emit).toHaveBeenCalledTimes(4);
    expect(emit).toHaveBeenCalledWith(
      getRelation('hasPart', 'Plugin', 'test-plugin', 'Package', 'package-a'),
    );
    expect(emit).toHaveBeenCalledWith(
      getRelation('partOf', 'Package', 'package-a', 'Plugin', 'test-plugin'),
    );
    expect(emit).toHaveBeenCalledWith(
      getRelation('hasPart', 'Plugin', 'test-plugin', 'Package', 'package-b'),
    );
    expect(emit).toHaveBeenCalledWith(
      getRelation('partOf', 'Package', 'package-b', 'Plugin', 'test-plugin'),
    );
  });
});
