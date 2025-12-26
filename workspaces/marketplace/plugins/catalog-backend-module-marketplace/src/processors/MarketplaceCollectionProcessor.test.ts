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
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import { MarketplaceCollectionProcessor } from './MarketplaceCollectionProcessor';

const testCollection: MarketplaceCollection = {
  apiVersion: 'extensions.backstage.io/v1alpha1',
  kind: MarketplaceKind.Collection,
  metadata: {
    name: 'test-collection',
    title: 'Test Collection',
    description: 'A list of awesome plugin!',
  },
  spec: {
    type: 'curated',
    plugins: ['plugin-a', 'plugin-b'],
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

describe('MarketplaceCollectionProcessor', () => {
  describe('getProcessorName', () => {
    it('should return processor name', () => {
      const processor = new MarketplaceCollectionProcessor();

      expect(processor.getProcessorName()).toBe(
        'MarketplaceCollectionProcessor',
      );
    });
  });

  describe('validateEntityKind', () => {
    it('should return validate the entity', async () => {
      const processor = new MarketplaceCollectionProcessor();

      expect(
        await processor.validateEntityKind({ ...testCollection, kind: 'test' }),
      ).toBe(false);
      expect(await processor.validateEntityKind(testCollection)).toBe(true);
    });
  });

  describe('postProcessEntity', () => {
    it('should emits bi-directional relations for each plugin', async () => {
      const processor = new MarketplaceCollectionProcessor();

      const emit = jest.fn();
      await processor.postProcessEntity(testCollection, null as any, emit);
      expect(emit).toHaveBeenCalledTimes(4);

      expect(emit).toHaveBeenCalledWith(
        getRelation(
          'partOf',
          MarketplaceKind.Collection,
          'test-collection',
          MarketplaceKind.Plugin,
          'plugin-a',
        ),
      );
      expect(emit).toHaveBeenCalledWith(
        getRelation(
          'hasPart',
          MarketplaceKind.Plugin,
          'plugin-a',
          MarketplaceKind.Collection,
          'test-collection',
        ),
      );
      expect(emit).toHaveBeenCalledWith(
        getRelation(
          'partOf',
          MarketplaceKind.Collection,
          'test-collection',
          MarketplaceKind.Plugin,
          'plugin-b',
        ),
      );
      expect(emit).toHaveBeenCalledWith(
        getRelation(
          'hasPart',
          MarketplaceKind.Plugin,
          'plugin-b',
          MarketplaceKind.Collection,
          'test-collection',
        ),
      );
    });

    it('should emit no relation when plugins is undefined', async () => {
      const processor = new MarketplaceCollectionProcessor();

      const emit = jest.fn();
      await processor.postProcessEntity(
        {
          ...testCollection,
          spec: { ...testCollection.spec, plugins: undefined },
        },
        null as any,
        emit,
      );

      expect(emit).toHaveBeenCalledTimes(0);
    });

    it('should emit no relation when plugins is empty', async () => {
      const processor = new MarketplaceCollectionProcessor();

      const emit = jest.fn();
      await processor.postProcessEntity(
        {
          ...testCollection,
          spec: { ...testCollection.spec, plugins: [] },
        },
        null as any,
        emit,
      );

      expect(emit).toHaveBeenCalledTimes(0);
    });

    it('should emit an owner relation without plugins', async () => {
      const processor = new MarketplaceCollectionProcessor();

      const emit = jest.fn();
      await processor.postProcessEntity(
        {
          ...testCollection,
          spec: {
            ...testCollection.spec,
            plugins: undefined,
            owner: 'owner-group',
          },
        },
        null as any,
        emit,
      );

      expect(emit).toHaveBeenCalledTimes(1);
      expect(emit).toHaveBeenCalledWith({
        type: 'relation',
        relation: {
          type: 'ownedBy',
          source: {
            kind: MarketplaceKind.Collection,
            namespace: 'default',
            name: 'test-collection',
          },
          target: {
            kind: 'Group',
            namespace: 'default',
            name: 'owner-group',
          },
        },
      });
    });
  });
});
