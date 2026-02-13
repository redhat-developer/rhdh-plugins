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
import {
  getSubcomponentsWithFallback,
  getSubcomponentNames,
} from '../entities';

describe('entities', () => {
  describe('getSubcomponentsWithFallback', () => {
    const createMockEntity = (
      name: string,
      hasPartOfRelation: boolean = true,
      targetRef: string = 'component:default/main-entity',
    ): Entity => ({
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name,
        namespace: 'default',
      },
      relations: hasPartOfRelation ? [{ type: 'partOf', targetRef }] : [],
    });

    const mainEntity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'main-entity',
        namespace: 'default',
      },
    };

    it('should return main entity when relatedEntities is null', () => {
      const result = getSubcomponentsWithFallback(null, mainEntity);
      expect(result).toEqual([mainEntity]);
    });

    it('should return main entity when relatedEntities is undefined', () => {
      const result = getSubcomponentsWithFallback(undefined, mainEntity);
      expect(result).toEqual([mainEntity]);
    });

    it('should return main entity when relatedEntities is empty array', () => {
      const result = getSubcomponentsWithFallback([], mainEntity);
      expect(result).toEqual([mainEntity]);
    });

    it('should filter out guest entity', () => {
      const subcomponent1 = createMockEntity('sub1', true);
      const guestEntity = createMockEntity('guest', true);
      const subcomponent2 = createMockEntity('sub2', true);

      const result = getSubcomponentsWithFallback(
        [subcomponent1, guestEntity, subcomponent2],
        mainEntity,
      );

      expect(result).toEqual([subcomponent1, subcomponent2]);
      expect(result).not.toContain(guestEntity);
    });

    it('should filter out entities without partOf relation', () => {
      const subcomponent1 = createMockEntity('sub1', true);
      const subcomponent2 = createMockEntity('sub2', false);
      const subcomponent3 = createMockEntity('sub3', true);

      const result = getSubcomponentsWithFallback(
        [subcomponent1, subcomponent2, subcomponent3],
        mainEntity,
      );

      expect(result).toEqual([subcomponent1, subcomponent3]);
      expect(result).not.toContain(subcomponent2);
    });

    it('should filter out entities with different relation types', () => {
      const subcomponent1 = createMockEntity('sub1', true);
      const entityWithOtherRelation: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'sub2',
          namespace: 'default',
        },
        relations: [
          { type: 'dependsOn', targetRef: 'component:default/main-entity' },
        ],
      };

      const result = getSubcomponentsWithFallback(
        [subcomponent1, entityWithOtherRelation],
        mainEntity,
      );

      expect(result).toEqual([subcomponent1]);
      expect(result).not.toContain(entityWithOtherRelation);
    });

    it('should return main entity when all entities are filtered out', () => {
      const guestEntity = createMockEntity('guest', true);
      const noRelationEntity = createMockEntity('no-relation', false);

      const result = getSubcomponentsWithFallback(
        [guestEntity, noRelationEntity],
        mainEntity,
      );

      expect(result).toEqual([mainEntity]);
    });

    it('should return main entity when only guest entity exists', () => {
      const guestEntity = createMockEntity('guest', true);

      const result = getSubcomponentsWithFallback([guestEntity], mainEntity);

      expect(result).toEqual([mainEntity]);
    });

    it('should return valid subcomponents when they match criteria', () => {
      const subcomponent1 = createMockEntity('sub1', true);
      const subcomponent2 = createMockEntity('sub2', true);

      const result = getSubcomponentsWithFallback(
        [subcomponent1, subcomponent2],
        mainEntity,
      );

      expect(result).toEqual([subcomponent1, subcomponent2]);
      expect(result).not.toContain(mainEntity);
    });

    it('should handle entities with undefined relations', () => {
      const subcomponent1 = createMockEntity('sub1', true);
      const entityWithoutRelations: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'sub2',
          namespace: 'default',
        },
      };

      const result = getSubcomponentsWithFallback(
        [subcomponent1, entityWithoutRelations],
        mainEntity,
      );

      expect(result).toEqual([subcomponent1]);
      expect(result).not.toContain(entityWithoutRelations);
    });

    it('should handle entities with empty relations array', () => {
      const subcomponent1 = createMockEntity('sub1', true);
      const entityWithEmptyRelations: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'sub2',
          namespace: 'default',
        },
        relations: [],
      };

      const result = getSubcomponentsWithFallback(
        [subcomponent1, entityWithEmptyRelations],
        mainEntity,
      );

      expect(result).toEqual([subcomponent1]);
      expect(result).not.toContain(entityWithEmptyRelations);
    });

    it('should handle entities with multiple relations including partOf', () => {
      const subcomponentWithMultipleRelations: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'sub1',
          namespace: 'default',
        },
        relations: [
          { type: 'dependsOn', targetRef: 'component:default/other' },
          { type: 'partOf', targetRef: 'component:default/main-entity' },
          { type: 'ownedBy', targetRef: 'user:default/owner' },
        ],
      };

      const result = getSubcomponentsWithFallback(
        [subcomponentWithMultipleRelations],
        mainEntity,
      );

      expect(result).toEqual([subcomponentWithMultipleRelations]);
    });

    it('should handle entities with partOf relation to different target', () => {
      const subcomponent1 = createMockEntity('sub1', true);
      const entityWithDifferentTarget: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'sub2',
          namespace: 'default',
        },
        relations: [
          { type: 'partOf', targetRef: 'component:default/different-entity' },
        ],
      };

      const result = getSubcomponentsWithFallback(
        [subcomponent1, entityWithDifferentTarget],
        mainEntity,
      );

      expect(result).toEqual([subcomponent1, entityWithDifferentTarget]);
    });
  });

  describe('getSubcomponentNames', () => {
    const createMockEntity = (name: string): Entity => ({
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name,
        namespace: 'default',
      },
    });

    it('should return empty array when entities array is empty', () => {
      const result = getSubcomponentNames([]);
      expect(result).toEqual([]);
    });

    it('should extract names from single entity', () => {
      const entity = createMockEntity('sub1');
      const result = getSubcomponentNames([entity]);
      expect(result).toEqual(['sub1']);
    });

    it('should extract names from multiple entities', () => {
      const entity1 = createMockEntity('sub1');
      const entity2 = createMockEntity('sub2');
      const entity3 = createMockEntity('sub3');

      const result = getSubcomponentNames([entity1, entity2, entity3]);
      expect(result).toEqual(['sub1', 'sub2', 'sub3']);
    });

    it('should handle large arrays of entities', () => {
      const entities = Array.from({ length: 100 }, (_, i) =>
        createMockEntity(`sub${i}`),
      );

      const result = getSubcomponentNames(entities);
      expect(result).toHaveLength(100);
      expect(result[0]).toBe('sub0');
      expect(result[99]).toBe('sub99');
    });
  });
});
