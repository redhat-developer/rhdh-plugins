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

import {
  filterResourcesByApplication,
  createResourceWithClusterInfo,
} from '../kubernetes';
import {
  K8sResourceCommonWithClusterInfo,
  ApplicationResource,
  ComponentResource,
  ReleaseResource,
  PipelineRunResource,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import * as konfluxCommon from '@red-hat-developer-hub/backstage-plugin-konflux-common';

jest.mock('@red-hat-developer-hub/backstage-plugin-konflux-common', () => ({
  ...jest.requireActual(
    '@red-hat-developer-hub/backstage-plugin-konflux-common',
  ),
  getApplicationFromResource: jest.fn(),
}));

const mockGetApplicationFromResource =
  konfluxCommon.getApplicationFromResource as jest.MockedFunction<
    typeof konfluxCommon.getApplicationFromResource
  >;

describe('kubernetes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('filterResourcesByApplication', () => {
    const createMockApplication = (name: string): ApplicationResource => ({
      kind: 'Application',
      apiVersion: 'v1',
      metadata: {
        name,
        namespace: 'default',
      },
      cluster: { name: 'cluster1' },
      subcomponent: { name: 'sub1' },
    });

    const createMockComponent = (
      name: string,
      application: string,
    ): ComponentResource => ({
      kind: 'Component',
      apiVersion: 'v1',
      metadata: {
        name,
        namespace: 'default',
      },
      spec: {
        application,
      },
      cluster: { name: 'cluster1' },
      subcomponent: { name: 'sub1' },
    });

    const createMockRelease = (
      name: string,
      application?: string,
    ): ReleaseResource => ({
      kind: 'Release',
      apiVersion: 'v1',
      metadata: {
        name,
        namespace: 'default',
      },
      cluster: { name: 'cluster1' },
      ...(application && { application }),
      subcomponent: { name: 'sub1' },
    });

    const createMockPipelineRun = (
      name: string,
      application?: string,
    ): PipelineRunResource => ({
      kind: 'PipelineRun',
      apiVersion: 'v1',
      metadata: {
        name,
        namespace: 'default',
      },
      cluster: { name: 'cluster1' },
      ...(application && { application }),
      subcomponent: { name: 'sub1' },
    });

    it('should return items when items is empty', () => {
      const result = filterResourcesByApplication([], 'applications', ['app1']);
      expect(result).toEqual([]);
    });

    it('should return items when items is null or undefined', () => {
      expect(
        filterResourcesByApplication(null as any, 'applications', ['app1']),
      ).toBeNull();
      expect(
        filterResourcesByApplication(undefined as any, 'applications', [
          'app1',
        ]),
      ).toBeUndefined();
    });

    it('should return items when applicationNames is empty', () => {
      const items = [createMockApplication('app1')];
      const result = filterResourcesByApplication(items, 'applications', []);
      expect(result).toEqual(items);
    });

    it('should return items when applicationNames is null or undefined', () => {
      const items = [createMockApplication('app1')];
      expect(
        filterResourcesByApplication(items, 'applications', null as any),
      ).toEqual(items);
      expect(
        filterResourcesByApplication(items, 'applications', undefined as any),
      ).toEqual(items);
    });

    it('should filter applications by metadata.name', () => {
      const items = [
        createMockApplication('app1'),
        createMockApplication('app2'),
        createMockApplication('app3'),
      ];
      const result = filterResourcesByApplication(items, 'applications', [
        'app1',
        'app3',
      ]);
      expect(result).toHaveLength(2);
      expect(result[0].metadata?.name).toBe('app1');
      expect(result[1].metadata?.name).toBe('app3');
    });

    it('should filter components by spec.application', () => {
      const items = [
        createMockComponent('comp1', 'app1'),
        createMockComponent('comp2', 'app2'),
        createMockComponent('comp3', 'app1'),
      ];
      const result = filterResourcesByApplication(items, 'components', [
        'app1',
      ]);
      expect(result).toHaveLength(2);
      expect((result[0] as ComponentResource).spec?.application).toBe('app1');
      expect((result[1] as ComponentResource).spec?.application).toBe('app1');
    });

    it('should filter releases by application name from getApplicationFromResource', () => {
      const items = [
        createMockRelease('release1', 'app1'),
        createMockRelease('release2', 'app2'),
        createMockRelease('release3', 'app1'),
      ];

      mockGetApplicationFromResource
        .mockReturnValueOnce('app1')
        .mockReturnValueOnce('app2')
        .mockReturnValueOnce('app1');

      const result = filterResourcesByApplication(items, 'releases', ['app1']);
      expect(result).toHaveLength(2);
      expect(mockGetApplicationFromResource).toHaveBeenCalledTimes(3);
    });

    it('should filter pipelineruns by application name from getApplicationFromResource', () => {
      const items = [
        createMockPipelineRun('plr1', 'app1'),
        createMockPipelineRun('plr2', 'app2'),
        createMockPipelineRun('plr3', 'app1'),
      ];

      mockGetApplicationFromResource
        .mockReturnValueOnce('app1')
        .mockReturnValueOnce('app2')
        .mockReturnValueOnce('app1');

      const result = filterResourcesByApplication(items, 'pipelineruns', [
        'app1',
      ]);
      expect(result).toHaveLength(2);
      expect(mockGetApplicationFromResource).toHaveBeenCalledTimes(3);
    });

    it('should return all items for unknown resource type', () => {
      const items = [
        createMockApplication('app1'),
        createMockApplication('app2'),
      ];
      const result = filterResourcesByApplication(items, 'unknown-resource', [
        'app1',
      ]);
      expect(result).toEqual(items);
    });

    it('should handle applications with missing metadata.name', () => {
      const items = [
        createMockApplication('app1'),
        { ...createMockApplication('app2'), metadata: {} },
      ];
      const result = filterResourcesByApplication(items, 'applications', [
        'app1',
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].metadata?.name).toBe('app1');
    });

    it('should handle components with missing spec.application', () => {
      const items = [
        createMockComponent('comp1', 'app1'),
        { ...createMockComponent('comp2', 'app2'), spec: {} },
      ];
      const result = filterResourcesByApplication(items, 'components', [
        'app1',
      ]);
      expect(result).toHaveLength(1);
      expect((result[0] as ComponentResource).spec?.application).toBe('app1');
    });

    it('should handle releases with undefined application from getApplicationFromResource', () => {
      const items = [
        createMockRelease('release1', 'app1'),
        createMockRelease('release2', 'app2'),
      ];

      mockGetApplicationFromResource
        .mockReturnValueOnce('app1')
        .mockReturnValueOnce(undefined);

      const result = filterResourcesByApplication(items, 'releases', ['app1']);
      expect(result).toHaveLength(1);
      expect(result[0].metadata?.name).toBe('release1');
    });

    it('should handle case sensitivity in application names', () => {
      const items = [
        createMockApplication('App1'),
        createMockApplication('app1'),
      ];
      const result = filterResourcesByApplication(items, 'applications', [
        'app1',
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].metadata?.name).toBe('app1');
    });
  });

  describe('createResourceWithClusterInfo', () => {
    const createMockResource = (): K8sResourceCommonWithClusterInfo => ({
      kind: 'Application',
      apiVersion: 'v1',
      metadata: {
        name: 'test-resource',
        namespace: 'default',
      },
      cluster: { name: 'original-cluster' },
      subcomponent: { name: 'sub1' },
    });

    it('should create resource with cluster info', () => {
      const resource = createMockResource();
      const result = createResourceWithClusterInfo(
        resource,
        'cluster1',
        undefined,
        undefined,
      );

      expect(result.cluster).toEqual({
        name: 'cluster1',
        konfluxUI: undefined,
      });
      expect(result.metadata?.name).toBe('test-resource');
    });

    it('should include konfluxUI when provided', () => {
      const resource = createMockResource();
      const result = createResourceWithClusterInfo(
        resource,
        'cluster1',
        undefined,
        'https://konflux.example.com',
      );

      expect(result.cluster).toEqual({
        name: 'cluster1',
        konfluxUI: 'https://konflux.example.com',
      });
    });

    it('should include subcomponent when provided', () => {
      const resource = createMockResource();
      const result = createResourceWithClusterInfo(
        resource,
        'cluster1',
        'subcomponent1',
        undefined,
      );

      expect(result.subcomponent).toEqual({ name: 'subcomponent1' });
      expect(result.cluster.name).toBe('cluster1');
    });

    it('should not include subcomponent when undefined', () => {
      const resource = {
        kind: 'Application',
        apiVersion: 'v1',
        metadata: {
          name: 'test-resource',
          namespace: 'default',
        },
        cluster: { name: 'original-cluster' },
      } as K8sResourceCommonWithClusterInfo;
      const result = createResourceWithClusterInfo(
        resource,
        'cluster1',
        undefined,
        undefined,
      );

      expect(result.subcomponent).toBeUndefined();
    });

    it('should include both subcomponent and konfluxUI', () => {
      const resource = createMockResource();
      const result = createResourceWithClusterInfo(
        resource,
        'cluster1',
        'subcomponent1',
        'https://konflux.example.com',
      );

      expect(result.subcomponent).toEqual({ name: 'subcomponent1' });
      expect(result.cluster).toEqual({
        name: 'cluster1',
        konfluxUI: 'https://konflux.example.com',
      });
    });

    it('should override existing cluster info', () => {
      const resource = createMockResource();
      const result = createResourceWithClusterInfo(
        resource,
        'new-cluster',
        undefined,
        'https://new-konflux.example.com',
      );

      expect(result.cluster).toEqual({
        name: 'new-cluster',
        konfluxUI: 'https://new-konflux.example.com',
      });
      expect(result.cluster.name).not.toBe('original-cluster');
    });

    it('should preserve all other resource properties', () => {
      const resource = createMockResource();
      const result = createResourceWithClusterInfo(
        resource,
        'cluster1',
        'sub1',
        'https://konflux.example.com',
      );

      expect(result.kind).toBe('Application');
      expect(result.apiVersion).toBe('v1');
      expect(result.metadata?.name).toBe('test-resource');
      expect(result.metadata?.namespace).toBe('default');
    });

    it('should handle empty string subcomponent name', () => {
      const resource = {
        kind: 'Application',
        apiVersion: 'v1',
        metadata: {
          name: 'test-resource',
          namespace: 'default',
        },
        cluster: { name: 'original-cluster' },
      } as K8sResourceCommonWithClusterInfo;
      const result = createResourceWithClusterInfo(
        resource,
        'cluster1',
        '',
        undefined,
      );

      expect(result.subcomponent).toBeUndefined();
    });

    it('should handle empty string konfluxUI', () => {
      const resource = createMockResource();
      const result = createResourceWithClusterInfo(
        resource,
        'cluster1',
        undefined,
        '',
      );

      expect(result.cluster.konfluxUI).toBe('');
    });
  });
});
