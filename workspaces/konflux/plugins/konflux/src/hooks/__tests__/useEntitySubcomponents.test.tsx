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

import { renderHook } from '@testing-library/react';
import { Entity } from '@backstage/catalog-model';
import { useEntitySubcomponents } from '../useEntitySubcomponents';
import { useRelatedEntities } from '@backstage/plugin-catalog-react';

jest.mock('@backstage/plugin-catalog-react', () => ({
  ...jest.requireActual('@backstage/plugin-catalog-react'),
  useRelatedEntities: jest.fn(),
}));

const mockUseRelatedEntities = useRelatedEntities as jest.MockedFunction<
  typeof useRelatedEntities
>;

describe('useEntitySubcomponents', () => {
  const mockEntity: Entity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'main-entity',
      namespace: 'default',
    },
  };

  const createMockEntity = (
    name: string,
    hasPartOfRelation: boolean = true,
  ): Entity => ({
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name,
      namespace: 'default',
    },
    relations: hasPartOfRelation
      ? [{ type: 'partOf', targetRef: 'component:default/main-entity' }]
      : [],
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return original entity when entities is undefined', () => {
    mockUseRelatedEntities.mockReturnValue({
      entities: undefined,
      loading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useEntitySubcomponents(mockEntity));

    expect(result.current.subcomponentEntities).toEqual([mockEntity]);
    expect(result.current.subcomponentNames).toEqual(['main-entity']);
  });

  it('should return original entity when entities array is empty', () => {
    mockUseRelatedEntities.mockReturnValue({
      entities: [],
      loading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useEntitySubcomponents(mockEntity));

    expect(result.current.subcomponentEntities).toEqual([mockEntity]);
    expect(result.current.subcomponentNames).toEqual(['main-entity']);
  });

  it('should filter out guest entity', () => {
    const subcomponent1 = createMockEntity('sub1', true);
    const guestEntity = createMockEntity('guest', true);
    const subcomponent2 = createMockEntity('sub2', true);

    mockUseRelatedEntities.mockReturnValue({
      entities: [subcomponent1, guestEntity, subcomponent2],
      loading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useEntitySubcomponents(mockEntity));

    expect(result.current.subcomponentEntities).toEqual([
      subcomponent1,
      subcomponent2,
    ]);
    expect(result.current.subcomponentNames).toEqual(['sub1', 'sub2']);
  });

  it('should filter out entities without partOf relation', () => {
    const subcomponent1 = createMockEntity('sub1', true);
    const subcomponent2 = createMockEntity('sub2', false);
    const subcomponent3 = createMockEntity('sub3', true);

    mockUseRelatedEntities.mockReturnValue({
      entities: [subcomponent1, subcomponent2, subcomponent3],
      loading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useEntitySubcomponents(mockEntity));

    expect(result.current.subcomponentEntities).toEqual([
      subcomponent1,
      subcomponent3,
    ]);
    expect(result.current.subcomponentNames).toEqual(['sub1', 'sub3']);
  });

  it('should return original entity when all entities are filtered out', () => {
    const guestEntity = createMockEntity('guest', true);
    const noRelationEntity = createMockEntity('no-relation', false);

    mockUseRelatedEntities.mockReturnValue({
      entities: [guestEntity, noRelationEntity],
      loading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useEntitySubcomponents(mockEntity));

    expect(result.current.subcomponentEntities).toEqual([mockEntity]);
    expect(result.current.subcomponentNames).toEqual(['main-entity']);
  });

  it('should return filtered entities when they match criteria', () => {
    const subcomponent1 = createMockEntity('sub1', true);
    const subcomponent2 = createMockEntity('sub2', true);

    mockUseRelatedEntities.mockReturnValue({
      entities: [subcomponent1, subcomponent2],
      loading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useEntitySubcomponents(mockEntity));

    expect(result.current.subcomponentEntities).toEqual([
      subcomponent1,
      subcomponent2,
    ]);
    expect(result.current.subcomponentNames).toEqual(['sub1', 'sub2']);
  });

  it('should pass through loading state', () => {
    mockUseRelatedEntities.mockReturnValue({
      entities: undefined,
      loading: true,
      error: undefined,
    });

    const { result } = renderHook(() => useEntitySubcomponents(mockEntity));

    expect(result.current.loading).toBe(true);
  });

  it('should pass through error state', () => {
    const mockError = new Error('Test error');
    mockUseRelatedEntities.mockReturnValue({
      entities: undefined,
      loading: false,
      error: mockError,
    });

    const { result } = renderHook(() => useEntitySubcomponents(mockEntity));

    expect(result.current.error).toBe(mockError);
  });

  it('should handle entities with undefined relations', () => {
    const subcomponent1 = createMockEntity('sub1', true);
    const entityWithoutRelations: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'no-relations',
        namespace: 'default',
      },
      relations: undefined,
    };

    mockUseRelatedEntities.mockReturnValue({
      entities: [subcomponent1, entityWithoutRelations],
      loading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useEntitySubcomponents(mockEntity));

    expect(result.current.subcomponentEntities).toEqual([subcomponent1]);
    expect(result.current.subcomponentNames).toEqual(['sub1']);
  });

  it('should return empty names array when entities is undefined', () => {
    mockUseRelatedEntities.mockReturnValue({
      entities: undefined,
      loading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useEntitySubcomponents(mockEntity));

    // When entities is undefined, it falls back to original entity
    expect(result.current.subcomponentNames).toEqual(['main-entity']);
  });

  it('should call useRelatedEntities with correct parameters', () => {
    mockUseRelatedEntities.mockReturnValue({
      entities: [],
      loading: false,
      error: undefined,
    });

    renderHook(() => useEntitySubcomponents(mockEntity));

    expect(mockUseRelatedEntities).toHaveBeenCalledWith(mockEntity, {});
  });
});
