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

import {
  MarketplaceCollection,
  MarketplaceKind,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { MarketplaceCollectionProcessor } from './MarketplaceCollectionProcessor';

const pluginListEntity: MarketplaceCollection = {
  apiVersion: 'marketplace.backstage.io/v1alpha1',
  metadata: {
    name: 'testplugin',
    title: 'APIs with Test plugin',
    description: 'Test plugin.',
  },
  kind: MarketplaceKind.Collection,
  spec: {
    owner: 'test-group',
    plugins: ['plugin-a', 'plugin-b', 'plugin-c'],
  },
};

describe('MarketplaceCollectionProcessor', () => {
  it('should return processor name', () => {
    const processor = new MarketplaceCollectionProcessor();

    expect(processor.getProcessorName()).toBe('MarketplaceCollectionProcessor');
  });

  it('should return pluginList', async () => {
    const processor = new MarketplaceCollectionProcessor();

    const emit = jest.fn();
    await processor.postProcessEntity(
      {
        ...pluginListEntity,
        spec: { ...pluginListEntity.spec, plugins: undefined },
      },
      null as any,
      emit,
    );

    expect(emit).toHaveBeenCalledTimes(1);
  });

  it('should return validate the entity', async () => {
    const processor = new MarketplaceCollectionProcessor();

    expect(
      await processor.validateEntityKind({ ...pluginListEntity, kind: 'test' }),
    ).toBe(false);
    expect(await processor.validateEntityKind(pluginListEntity)).toBe(true);
  });

  it('should return pluginList entity with relation', async () => {
    const processor = new MarketplaceCollectionProcessor();

    const emit = jest.fn();
    await processor.postProcessEntity(pluginListEntity, null as any, emit);
    expect(emit).toHaveBeenCalledTimes(7);
    expect(emit).toHaveBeenCalledWith({
      type: 'relation',
      relation: {
        source: {
          kind: MarketplaceKind.Collection,
          namespace: 'default',
          name: 'testplugin',
        },
        type: 'ownedBy',
        target: { kind: 'Group', namespace: 'default', name: 'test-group' },
      },
    });
    const getPluginHasPartOfPluginListRelation = (pluginName: string) => ({
      source: {
        kind: 'Plugin',
        namespace: 'default',
        name: pluginName,
      },
      type: 'hasPart',
      target: {
        kind: MarketplaceKind.Collection,
        namespace: 'default',
        name: 'testplugin',
      },
    });
    expect(emit).toHaveBeenCalledWith({
      type: 'relation',
      relation: getPluginHasPartOfPluginListRelation('plugin-a'),
    });
    expect(emit).toHaveBeenCalledWith({
      type: 'relation',
      relation: getPluginHasPartOfPluginListRelation('plugin-b'),
    });
  });
});
