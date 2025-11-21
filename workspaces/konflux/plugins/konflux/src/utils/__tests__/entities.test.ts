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

import { Entity } from '@backstage/catalog-model';
import { getEntityDisplayName } from '../entities';

const createMockEntity = (name: string, title?: string): Entity => ({
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name,
    namespace: 'default',
    title,
  },
  relations: [],
});

// return subcomponentName if entities array is empty
// return subcomponentName if entities array does not contain subcomponentName
// return entity.metadata.title if entity has metadata.title
// fallback to subcomponentName if entity does not have metadata.title

describe('entities', () => {
  describe('getEntityDisplayName', () => {
    it('return subcomponentName if entities array is empty', () => {
      const result = getEntityDisplayName('sub1', []);
      expect(result).toBe('sub1');
    });

    it('return subcomponentName if entities array does not contain subcomponentName', () => {
      const entity1 = createMockEntity('entity1');
      const entity2 = createMockEntity('entity2');
      const entity3 = createMockEntity('entity3');

      const result = getEntityDisplayName('sub1', [entity1, entity2, entity3]);

      expect(result).toBe('sub1');
    });

    it('return entity.metadata.title if entity has metadata.title', () => {
      const entity1 = createMockEntity('entity1', 'Entity 1');
      const entity2 = createMockEntity('entity2');
      const entity3 = createMockEntity('entity3');

      const result = getEntityDisplayName('entity1', [
        entity1,
        entity2,
        entity3,
      ]);

      expect(result).toBe('Entity 1');
    });

    it('fallback to subcomponentName if entity does not have metadata.title', () => {
      const entity1 = createMockEntity('entity1');
      const entity2 = createMockEntity('entity2');
      const entity3 = createMockEntity('entity3');

      const result = getEntityDisplayName('entity1', [
        entity1,
        entity2,
        entity3,
      ]);

      expect(result).toBe('entity1');
    });

    it('should fallback to subcomponentName when entity.metadata.title is empty string', () => {
      const entity1 = createMockEntity('entity1', '');
      const entity2 = createMockEntity('entity2');

      const result = getEntityDisplayName('entity1', [entity1, entity2]);

      expect(result).toBe('entity1');
    });
  });
});
