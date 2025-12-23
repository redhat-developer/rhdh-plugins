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
import { useEntitiesKonfluxConfig } from '../useEntitiesKonfluxConfig';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useEntitySubcomponents } from '../useEntitySubcomponents';
import {
  KONFLUX_CLUSTER_CONFIG,
  KonfluxComponentClusterConfig,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import * as konfluxCommon from '@red-hat-developer-hub/backstage-plugin-konflux-common';

jest.mock('@backstage/plugin-catalog-react', () => ({
  ...jest.requireActual('@backstage/plugin-catalog-react'),
  useEntity: jest.fn(),
}));

jest.mock('../useEntitySubcomponents', () => ({
  useEntitySubcomponents: jest.fn(),
}));

jest.mock('@red-hat-developer-hub/backstage-plugin-konflux-common', () => ({
  ...jest.requireActual(
    '@red-hat-developer-hub/backstage-plugin-konflux-common',
  ),
  parseEntityKonfluxConfig: jest.fn(),
}));

const mockUseEntity = useEntity as jest.MockedFunction<typeof useEntity>;
const mockUseEntitySubcomponents =
  useEntitySubcomponents as jest.MockedFunction<typeof useEntitySubcomponents>;
const mockParseEntityKonfluxConfig =
  konfluxCommon.parseEntityKonfluxConfig as jest.MockedFunction<
    typeof konfluxCommon.parseEntityKonfluxConfig
  >;

describe('useEntitiesKonfluxConfig', () => {
  const mockEntity: Entity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test-entity',
      namespace: 'default',
    },
  };

  const createMockSubcomponent = (
    name: string,
    annotation?: string,
  ): Entity => ({
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name,
      namespace: 'default',
      annotations: annotation ? { [KONFLUX_CLUSTER_CONFIG]: annotation } : {},
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEntity.mockReturnValue({ entity: mockEntity });
  });

  it('should return null when parsing fails', () => {
    const subcomponent = createMockSubcomponent('sub1', 'invalid-yaml');
    mockUseEntitySubcomponents.mockReturnValue({
      subcomponentEntities: [subcomponent],
      subcomponentNames: ['sub1'],
      loading: false,
      error: undefined,
    });

    mockParseEntityKonfluxConfig.mockImplementation(() => {
      throw new Error('Parse error');
    });

    const { result } = renderHook(() => useEntitiesKonfluxConfig());

    expect(result.current).toBeNull();
  });

  it('should return null when parseEntityKonfluxConfig returns null', () => {
    const subcomponent = createMockSubcomponent('sub1', 'some-annotation');
    mockUseEntitySubcomponents.mockReturnValue({
      subcomponentEntities: [subcomponent],
      subcomponentNames: ['sub1'],
      loading: false,
      error: undefined,
    });

    mockParseEntityKonfluxConfig.mockReturnValue(null);

    const { result } = renderHook(() => useEntitiesKonfluxConfig());

    expect(result.current).toBeNull();
  });

  it('should return flattened subcomponent configs when parsing succeeds', () => {
    const mockClusterConfig: KonfluxComponentClusterConfig[] = [
      {
        cluster: 'cluster1',
        namespace: 'namespace1',
        applications: ['app1'],
      },
    ];

    const subcomponent = createMockSubcomponent('sub1', 'valid-yaml');
    mockUseEntitySubcomponents.mockReturnValue({
      subcomponentEntities: [subcomponent],
      subcomponentNames: ['sub1'],
      loading: false,
      error: undefined,
    });

    mockParseEntityKonfluxConfig.mockReturnValue(mockClusterConfig);

    const { result } = renderHook(() => useEntitiesKonfluxConfig());

    expect(result.current).toEqual([
      {
        subcomponent: 'sub1',
        cluster: 'cluster1',
        namespace: 'namespace1',
        applications: ['app1'],
      },
    ]);
  });

  it('should handle entities without annotations', () => {
    const subcomponent = createMockSubcomponent('sub1');
    mockUseEntitySubcomponents.mockReturnValue({
      subcomponentEntities: [subcomponent],
      subcomponentNames: ['sub1'],
      loading: false,
      error: undefined,
    });

    mockParseEntityKonfluxConfig.mockReturnValue(null);

    const { result } = renderHook(() => useEntitiesKonfluxConfig());

    expect(result.current).toBeNull();
  });

  it('should handle multiple entities', () => {
    const mockClusterConfig1: KonfluxComponentClusterConfig[] = [
      {
        cluster: 'cluster1',
        namespace: 'namespace1',
        applications: ['app1', 'app2'],
      },
    ];

    const mockClusterConfig2: KonfluxComponentClusterConfig[] = [
      {
        cluster: 'cluster2',
        namespace: 'namespace2',
        applications: ['app3'],
      },
    ];

    const subcomponent1 = createMockSubcomponent('sub1', 'yaml1');
    const subcomponent2 = createMockSubcomponent('sub2', 'yaml2');
    mockUseEntitySubcomponents.mockReturnValue({
      subcomponentEntities: [subcomponent1, subcomponent2],
      subcomponentNames: ['sub1', 'sub2'],
      loading: false,
      error: undefined,
    });

    mockParseEntityKonfluxConfig
      .mockReturnValueOnce(mockClusterConfig1)
      .mockReturnValueOnce(mockClusterConfig2);

    const { result } = renderHook(() => useEntitiesKonfluxConfig());

    expect(result.current).toEqual([
      {
        subcomponent: 'sub1',
        cluster: 'cluster1',
        namespace: 'namespace1',
        applications: ['app1', 'app2'],
      },
      {
        subcomponent: 'sub2',
        cluster: 'cluster2',
        namespace: 'namespace2',
        applications: ['app3'],
      },
    ]);
  });

  it('should skip entities where parsing returns null', () => {
    const mockClusterConfig: KonfluxComponentClusterConfig[] = [
      {
        cluster: 'cluster1',
        namespace: 'namespace1',
        applications: ['app1'],
      },
    ];

    const subcomponent1 = createMockSubcomponent('sub1', 'yaml1');
    const subcomponent2 = createMockSubcomponent('sub2', 'yaml2');
    mockUseEntitySubcomponents.mockReturnValue({
      subcomponentEntities: [subcomponent1, subcomponent2],
      subcomponentNames: ['sub1', 'sub2'],
      loading: false,
      error: undefined,
    });

    mockParseEntityKonfluxConfig
      .mockReturnValueOnce(mockClusterConfig)
      .mockReturnValueOnce(null);

    const { result } = renderHook(() => useEntitiesKonfluxConfig());

    expect(result.current).toEqual([
      {
        subcomponent: 'sub1',
        cluster: 'cluster1',
        namespace: 'namespace1',
        applications: ['app1'],
      },
    ]);
  });

  it('should handle empty subcomponentEntities array', () => {
    mockUseEntitySubcomponents.mockReturnValue({
      subcomponentEntities: [],
      subcomponentNames: [],
      loading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useEntitiesKonfluxConfig());

    expect(result.current).toBeNull();
  });

  it('should call parseEntityKonfluxConfig with correct annotation', () => {
    const annotationValue = 'test-annotation-value';
    const subcomponent = createMockSubcomponent('sub1', annotationValue);
    mockUseEntitySubcomponents.mockReturnValue({
      subcomponentEntities: [subcomponent],
      subcomponentNames: ['sub1'],
      loading: false,
      error: undefined,
    });

    mockParseEntityKonfluxConfig.mockReturnValue(null);

    renderHook(() => useEntitiesKonfluxConfig());

    expect(mockParseEntityKonfluxConfig).toHaveBeenCalledWith(annotationValue);
  });
});
