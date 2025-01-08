/*
 * Copyright 2025 The Backstage Authors
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
import { MarketplacePluginEntry } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { MarketplacePluginProcessor } from '../MarketplacePluginProcessor';

const pluginEntity: MarketplacePluginEntry = {
  apiVersion: 'marketplace.backstage.io/v1alpha1',
  metadata: {
    name: 'testplugin',
    title: 'APIs with Test plugin',
    description: 'Test plugin.',
  },
  kind: 'Plugin',
  spec: {
    owner: 'test-group',
  },
};
describe('MarketplacePluginProcessor', () => {
  it('should return processor name', () => {
    const processor = new MarketplacePluginProcessor();
    expect(processor.getProcessorName()).toBe('MarketplacePluginProcessor');
  });

  it('should return plugin entity with relation', async () => {
    const processor = new MarketplacePluginProcessor();
    const emit = jest.fn();

    await processor.postProcessEntity(pluginEntity, undefined as any, emit);

    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith({
      type: 'relation',
      relation: {
        source: { kind: 'Plugin', namespace: 'default', name: 'testplugin' },
        type: 'ownedBy',
        target: { kind: 'Group', namespace: 'default', name: 'test-group' },
      },
    });
  });

  it('should return validate the entity', async () => {
    const processor = new MarketplacePluginProcessor();

    expect(
      await processor.validateEntityKind({ ...pluginEntity, kind: 'test' }),
    ).toBe(false);
    expect(await processor.validateEntityKind(pluginEntity)).toBe(true);
  });
});
