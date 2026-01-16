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

import { getSubcomponentApplications } from '../namespaces';
import { SubcomponentClusterConfig } from '@red-hat-developer-hub/backstage-plugin-konflux-common';

describe('namespaces', () => {
  const createMockConfig = (
    subcomponent: string,
    cluster: string,
    namespace: string,
    applications: string[],
  ): SubcomponentClusterConfig => ({
    subcomponent,
    cluster,
    namespace,
    applications,
  });

  describe('getSubcomponentApplications', () => {
    it('should return empty array when subcomponentConfigs is empty', () => {
      const result = getSubcomponentApplications('cluster1', 'namespace1', []);
      expect(result).toEqual([]);
    });

    it('should return applications for matching cluster and namespace', () => {
      const configs: SubcomponentClusterConfig[] = [
        createMockConfig('sub1', 'cluster1', 'namespace1', ['app1', 'app2']),
        createMockConfig('sub2', 'cluster2', 'namespace1', ['app3']),
        createMockConfig('sub1', 'cluster1', 'namespace2', ['app4']),
      ];

      const result = getSubcomponentApplications(
        'cluster1',
        'namespace1',
        configs,
      );

      expect(result).toEqual(['app1', 'app2']);
    });

    it('should return empty array when no config matches cluster and namespace', () => {
      const configs: SubcomponentClusterConfig[] = [
        createMockConfig('sub1', 'cluster1', 'namespace1', ['app1', 'app2']),
        createMockConfig('sub2', 'cluster2', 'namespace1', ['app3']),
        createMockConfig('sub1', 'cluster1', 'namespace2', ['app4']),
      ];

      const result = getSubcomponentApplications(
        'cluster3',
        'namespace1',
        configs,
      );

      expect(result).toEqual([]);
    });

    it('should return empty array when cluster matches but namespace does not', () => {
      const configs: SubcomponentClusterConfig[] = [
        createMockConfig('sub1', 'cluster1', 'namespace1', ['app1', 'app2']),
        createMockConfig('sub1', 'cluster1', 'namespace2', ['app3']),
      ];

      const result = getSubcomponentApplications(
        'cluster1',
        'namespace3',
        configs,
      );

      expect(result).toEqual([]);
    });

    it('should return empty array when namespace matches but cluster does not', () => {
      const configs: SubcomponentClusterConfig[] = [
        createMockConfig('sub1', 'cluster1', 'namespace1', ['app1', 'app2']),
        createMockConfig('sub2', 'cluster2', 'namespace1', ['app3']),
      ];

      const result = getSubcomponentApplications(
        'cluster3',
        'namespace1',
        configs,
      );

      expect(result).toEqual([]);
    });

    it('should return applications from multiple matching configs', () => {
      const configs: SubcomponentClusterConfig[] = [
        createMockConfig('sub1', 'cluster1', 'namespace1', ['app1', 'app2']),
        createMockConfig('sub1', 'cluster1', 'namespace1', ['app3', 'app4']),
        createMockConfig('sub2', 'cluster2', 'namespace1', ['app5']),
      ];

      const result = getSubcomponentApplications(
        'cluster1',
        'namespace1',
        configs,
      );

      expect(result).toEqual(['app1', 'app2', 'app3', 'app4']);
    });

    it('should return empty array when matching config has empty applications array', () => {
      const configs: SubcomponentClusterConfig[] = [
        createMockConfig('sub1', 'cluster1', 'namespace1', []),
        createMockConfig('sub1', 'cluster1', 'namespace2', ['app1']),
      ];

      const result = getSubcomponentApplications(
        'cluster1',
        'namespace1',
        configs,
      );

      expect(result).toEqual([]);
    });

    it('should return applications when multiple configs match with different applications', () => {
      const configs: SubcomponentClusterConfig[] = [
        createMockConfig('sub1', 'cluster1', 'namespace1', ['app1']),
        createMockConfig('sub1', 'cluster1', 'namespace1', ['app2', 'app3']),
        createMockConfig('sub1', 'cluster1', 'namespace1', ['app4']),
      ];

      const result = getSubcomponentApplications(
        'cluster1',
        'namespace1',
        configs,
      );

      expect(result).toEqual(['app1', 'app2', 'app3', 'app4']);
    });

    it('should remove duplicate applications across matching configs', () => {
      const configs: SubcomponentClusterConfig[] = [
        createMockConfig('sub1', 'cluster1', 'namespace1', ['app1', 'app2']),
        createMockConfig('sub1', 'cluster1', 'namespace1', ['app2', 'app3']),
      ];

      const result = getSubcomponentApplications(
        'cluster1',
        'namespace1',
        configs,
      );

      expect(result).toEqual(['app1', 'app2', 'app3']);
    });
  });
});
