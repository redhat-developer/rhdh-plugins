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
  rosPluginReadPermission,
  rosApplyPermission,
  rosClusterSpecificPermission,
  rosClusterProjectPermission,
  costPluginReadPermission,
  costClusterSpecificPermission,
  costClusterProjectPermission,
} from './permissions';

describe('permissions', () => {
  describe('generic plugin permissions', () => {
    it('ros.plugin uses dot separator (unchanged)', () => {
      expect(rosPluginReadPermission.name).toBe('ros.plugin');
      expect(rosPluginReadPermission.attributes.action).toBe('read');
    });

    it('ros.apply uses dot separator (unchanged)', () => {
      expect(rosApplyPermission.name).toBe('ros.apply');
      expect(rosApplyPermission.attributes.action).toBe('update');
    });

    it('cost.plugin uses dot separator (unchanged)', () => {
      expect(costPluginReadPermission.name).toBe('cost.plugin');
      expect(costPluginReadPermission.attributes.action).toBe('read');
    });
  });

  describe('cluster-specific permissions use slash separator', () => {
    it('ros cluster permission with simple name', () => {
      const perm = rosClusterSpecificPermission('demolab');
      expect(perm.name).toBe('ros/demolab');
    });

    it('cost cluster permission with simple name', () => {
      const perm = costClusterSpecificPermission('demolab');
      expect(perm.name).toBe('cost/demolab');
    });

    it('ros cluster permission with dotted cluster name', () => {
      const perm = rosClusterSpecificPermission('my.cluster.name');
      expect(perm.name).toBe('ros/my.cluster.name');
    });

    it('cost cluster permission with dotted cluster name', () => {
      const perm = costClusterSpecificPermission('my.cluster.name');
      expect(perm.name).toBe('cost/my.cluster.name');
    });

    it('cluster name with spaces is preserved', () => {
      const perm = rosClusterSpecificPermission('OpenShift on AWS');
      expect(perm.name).toBe('ros/OpenShift on AWS');
    });
  });

  describe('cluster-project permissions use slash separator', () => {
    it('ros cluster-project with simple names', () => {
      const perm = rosClusterProjectPermission('demolab', 'thanos');
      expect(perm.name).toBe('ros/demolab/thanos');
    });

    it('cost cluster-project with simple names', () => {
      const perm = costClusterProjectPermission('demolab', 'thanos');
      expect(perm.name).toBe('cost/demolab/thanos');
    });

    it('ros cluster-project with dotted cluster name', () => {
      const perm = rosClusterProjectPermission('my.cluster.name', 'my-project');
      expect(perm.name).toBe('ros/my.cluster.name/my-project');
    });

    it('cost cluster-project with dotted cluster name', () => {
      const perm = costClusterProjectPermission(
        'my.cluster.name',
        'my-project',
      );
      expect(perm.name).toBe('cost/my.cluster.name/my-project');
    });

    it('dotted cluster name is unambiguous with slash separator', () => {
      const perm = rosClusterProjectPermission('my.cluster', 'project');
      expect(perm.name).toBe('ros/my.cluster/project');

      const parts = perm.name.split('/');
      expect(parts[0]).toBe('ros');
      expect(parts[1]).toBe('my.cluster');
      expect(parts[2]).toBe('project');
    });

    it('project name with dots is preserved', () => {
      const perm = costClusterProjectPermission(
        'prod.cluster',
        'app.v2.backend',
      );
      expect(perm.name).toBe('cost/prod.cluster/app.v2.backend');

      const parts = perm.name.split('/');
      expect(parts[0]).toBe('cost');
      expect(parts[1]).toBe('prod.cluster');
      expect(parts[2]).toBe('app.v2.backend');
    });
  });
});
