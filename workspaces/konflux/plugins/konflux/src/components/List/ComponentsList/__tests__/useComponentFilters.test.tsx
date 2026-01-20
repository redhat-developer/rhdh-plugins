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
import { useComponentFilters } from '../../ComponentsList/useComponentFilters';
import { ComponentResource } from '@red-hat-developer-hub/backstage-plugin-konflux-common';

describe('useComponentFilters', () => {
  const createMockComponent = (
    name: string,
    subcomponent: string,
    cluster: string,
    application: string,
  ): ComponentResource => ({
    apiVersion: 'v1',
    apiGroup: 'appstudio.redhat.com',
    kind: 'Component',
    metadata: {
      name,
      namespace: 'test-namespace',
    },
    spec: {
      application,
    },
    subcomponent: { name: subcomponent },
    cluster: { name: cluster },
  });

  it('should return empty arrays when components is undefined', () => {
    const { result } = renderHook(() =>
      useComponentFilters({
        components: undefined,
        hasSubcomponents: true,
      }),
    );

    expect(result.current.uniqueSubcomponents).toEqual([]);
    expect(result.current.uniqueClusters).toEqual([]);
    expect(result.current.uniqueApplications).toEqual([]);
  });

  it('should return empty arrays when components is empty', () => {
    const { result } = renderHook(() =>
      useComponentFilters({
        components: [],
        hasSubcomponents: true,
      }),
    );

    expect(result.current.uniqueSubcomponents).toEqual([]);
    expect(result.current.uniqueClusters).toEqual([]);
    expect(result.current.uniqueApplications).toEqual([]);
  });

  it('should extract unique subcomponents, clusters, and applications', () => {
    const components = [
      createMockComponent('comp1', 'subcomp1', 'cluster1', 'app1'),
      createMockComponent('comp2', 'subcomp1', 'cluster2', 'app2'),
      createMockComponent('comp3', 'subcomp2', 'cluster1', 'app1'),
    ];

    const { result } = renderHook(() =>
      useComponentFilters({
        components,
        hasSubcomponents: true,
      }),
    );

    expect(result.current.uniqueSubcomponents).toEqual([
      'subcomp1',
      'subcomp2',
    ]);
    expect(result.current.uniqueClusters).toEqual(['cluster1', 'cluster2']);
    expect(result.current.uniqueApplications).toEqual(['app1', 'app2']);
  });

  it('should remove duplicates and sort results', () => {
    const components = [
      createMockComponent('comp1', 'subcomp2', 'cluster2', 'app2'),
      createMockComponent('comp2', 'subcomp1', 'cluster1', 'app1'),
      createMockComponent('comp3', 'subcomp2', 'cluster1', 'app1'),
      createMockComponent('comp4', 'subcomp1', 'cluster2', 'app2'),
    ];

    const { result } = renderHook(() =>
      useComponentFilters({
        components,
        hasSubcomponents: true,
      }),
    );

    expect(result.current.uniqueSubcomponents).toEqual([
      'subcomp1',
      'subcomp2',
    ]);
    expect(result.current.uniqueClusters).toEqual(['cluster1', 'cluster2']);
    expect(result.current.uniqueApplications).toEqual(['app1', 'app2']);
  });

  it('should return empty subcomponents when hasSubcomponents is false', () => {
    const components = [
      createMockComponent('comp1', 'subcomp1', 'cluster1', 'app1'),
      createMockComponent('comp2', 'subcomp2', 'cluster2', 'app2'),
    ];

    const { result } = renderHook(() =>
      useComponentFilters({
        components,
        hasSubcomponents: false,
      }),
    );

    expect(result.current.uniqueSubcomponents).toEqual([]);
    expect(result.current.uniqueClusters).toEqual(['cluster1', 'cluster2']);
    expect(result.current.uniqueApplications).toEqual(['app1', 'app2']);
  });

  it('should handle components with missing application', () => {
    const components = [
      {
        ...createMockComponent('comp1', 'subcomp1', 'cluster1', 'app1'),
        spec: {},
      },
      createMockComponent('comp2', 'subcomp2', 'cluster2', 'app2'),
    ];

    const { result } = renderHook(() =>
      useComponentFilters({
        components: components as ComponentResource[],
        hasSubcomponents: true,
      }),
    );

    expect(result.current.uniqueSubcomponents).toEqual([
      'subcomp1',
      'subcomp2',
    ]);
    expect(result.current.uniqueClusters).toEqual(['cluster1', 'cluster2']);
    expect(result.current.uniqueApplications).toEqual(['app2']);
  });
});
