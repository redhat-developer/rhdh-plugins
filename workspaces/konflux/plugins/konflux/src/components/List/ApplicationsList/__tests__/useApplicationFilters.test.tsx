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
import { useApplicationFilters } from '../useApplicationFilters';
import { ApplicationResource } from '@red-hat-developer-hub/backstage-plugin-konflux-common';

describe('useApplicationFilters', () => {
  const createMockApplication = (
    name: string,
    subcomponent: string,
    cluster: string,
  ): ApplicationResource => ({
    apiVersion: 'v1',
    apiGroup: 'appstudio.redhat.com',
    kind: 'Application',
    metadata: {
      name,
      namespace: 'test-namespace',
    },
    subcomponent: { name: subcomponent },
    cluster: { name: cluster },
  });

  it('should return empty arrays when applications is undefined', () => {
    const { result } = renderHook(() =>
      useApplicationFilters({
        applications: undefined,
        hasSubcomponents: true,
      }),
    );

    expect(result.current.uniqueSubcomponents).toEqual([]);
    expect(result.current.uniqueClusters).toEqual([]);
  });

  it('should return empty arrays when applications is empty', () => {
    const { result } = renderHook(() =>
      useApplicationFilters({
        applications: [],
        hasSubcomponents: true,
      }),
    );

    expect(result.current.uniqueSubcomponents).toEqual([]);
    expect(result.current.uniqueClusters).toEqual([]);
  });

  it('should extract unique subcomponents and clusters', () => {
    const applications = [
      createMockApplication('app1', 'subcomp1', 'cluster1'),
      createMockApplication('app2', 'subcomp1', 'cluster2'),
      createMockApplication('app3', 'subcomp2', 'cluster1'),
    ];

    const { result } = renderHook(() =>
      useApplicationFilters({
        applications,
        hasSubcomponents: true,
      }),
    );

    expect(result.current.uniqueSubcomponents).toEqual([
      'subcomp1',
      'subcomp2',
    ]);
    expect(result.current.uniqueClusters).toEqual(['cluster1', 'cluster2']);
  });

  it('should remove duplicates and sort results', () => {
    const applications = [
      createMockApplication('app1', 'subcomp2', 'cluster2'),
      createMockApplication('app2', 'subcomp1', 'cluster1'),
      createMockApplication('app3', 'subcomp2', 'cluster1'),
      createMockApplication('app4', 'subcomp1', 'cluster2'),
    ];

    const { result } = renderHook(() =>
      useApplicationFilters({
        applications,
        hasSubcomponents: true,
      }),
    );

    expect(result.current.uniqueSubcomponents).toEqual([
      'subcomp1',
      'subcomp2',
    ]);
    expect(result.current.uniqueClusters).toEqual(['cluster1', 'cluster2']);
  });

  it('should return empty subcomponents when hasSubcomponents is false', () => {
    const applications = [
      createMockApplication('app1', 'subcomp1', 'cluster1'),
      createMockApplication('app2', 'subcomp2', 'cluster2'),
    ];

    const { result } = renderHook(() =>
      useApplicationFilters({
        applications,
        hasSubcomponents: false,
      }),
    );

    expect(result.current.uniqueSubcomponents).toEqual([]);
    expect(result.current.uniqueClusters).toEqual(['cluster1', 'cluster2']);
  });

  it('should handle applications with missing subcomponent names', () => {
    const applications = [
      createMockApplication('app1', '', 'cluster1'),
      createMockApplication('app2', 'subcomp1', 'cluster2'),
    ];

    const { result } = renderHook(() =>
      useApplicationFilters({
        applications,
        hasSubcomponents: true,
      }),
    );

    expect(result.current.uniqueSubcomponents).toEqual(['subcomp1']);
    expect(result.current.uniqueClusters).toEqual(['cluster1', 'cluster2']);
  });

  it('should handle applications with missing cluster names', () => {
    const applications = [
      createMockApplication('app1', 'subcomp1', ''),
      createMockApplication('app2', 'subcomp2', 'cluster1'),
    ];

    const { result } = renderHook(() =>
      useApplicationFilters({
        applications,
        hasSubcomponents: true,
      }),
    );

    expect(result.current.uniqueSubcomponents).toEqual([
      'subcomp1',
      'subcomp2',
    ]);
    expect(result.current.uniqueClusters).toEqual(['cluster1']);
  });
});
