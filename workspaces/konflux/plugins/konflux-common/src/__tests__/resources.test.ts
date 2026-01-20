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

import { getApplicationFromResource } from '../resources';
import {
  K8sResourceCommonWithClusterInfo,
  ApplicationResource,
  PipelineRunResource,
  ReleaseResource,
} from '../types';
import { PipelineRunLabel } from '../pipeline-runs';

describe('resources', () => {
  describe('getApplicationFromResource', () => {
    it('should return undefined when resource is null', () => {
      const result = getApplicationFromResource(null);
      expect(result).toBeUndefined();
    });

    it('should return undefined when resource is undefined', () => {
      const result = getApplicationFromResource(undefined);
      expect(result).toBeUndefined();
    });

    it('should return metadata.name for Application kind', () => {
      const resource: ApplicationResource = {
        apiVersion: 'v1',
        kind: 'Application',
        metadata: {
          name: 'app1',
          namespace: 'namespace1',
        },
        cluster: { name: 'cluster1' },
        subcomponent: { name: 'sub1' },
      };

      const result = getApplicationFromResource(resource);
      expect(result).toBe('app1');
    });

    it('should return undefined for Application kind when metadata.name is missing', () => {
      const resource: ApplicationResource = {
        apiVersion: 'v1',
        kind: 'Application',
        metadata: {
          namespace: 'namespace1',
        },
        cluster: { name: 'cluster1' },
        subcomponent: { name: 'sub1' },
      };

      const result = getApplicationFromResource(resource);
      expect(result).toBeUndefined();
    });

    it('should return label value for PipelineRun kind when label exists', () => {
      const resource: PipelineRunResource = {
        apiVersion: 'v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'plr1',
          namespace: 'namespace1',
          labels: {
            [PipelineRunLabel.APPLICATION]: 'app1',
          },
        },
        cluster: { name: 'cluster1' },
        subcomponent: { name: 'sub1' },
      };

      const result = getApplicationFromResource(resource);
      expect(result).toBe('app1');
    });

    it('should return spec.application for PipelineRun kind when label is missing', () => {
      const resource: PipelineRunResource = {
        apiVersion: 'v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'plr1',
          namespace: 'namespace1',
        },
        spec: {
          application: 'app1',
        },
        cluster: { name: 'cluster1' },
        subcomponent: { name: 'sub1' },
      };

      const result = getApplicationFromResource(resource);
      expect(result).toBe('app1');
    });

    it('should prefer label over spec.application for PipelineRun kind', () => {
      const resource: PipelineRunResource = {
        apiVersion: 'v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'plr1',
          namespace: 'namespace1',
          labels: {
            [PipelineRunLabel.APPLICATION]: 'app-from-label',
          },
        },
        spec: {
          application: 'app-from-spec',
        },
        cluster: { name: 'cluster1' },
        subcomponent: { name: 'sub1' },
      };

      const result = getApplicationFromResource(resource);
      expect(result).toBe('app-from-label');
    });

    it('should return undefined for PipelineRun kind when both label and spec.application are missing', () => {
      const resource: PipelineRunResource = {
        apiVersion: 'v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'plr1',
          namespace: 'namespace1',
        },
        cluster: { name: 'cluster1' },
        subcomponent: { name: 'sub1' },
      };

      const result = getApplicationFromResource(resource);
      expect(result).toBeUndefined();
    });

    it('should return label value for Release kind when label exists', () => {
      const resource: ReleaseResource = {
        apiVersion: 'v1alpha1',
        kind: 'Release',
        metadata: {
          name: 'release1',
          namespace: 'namespace1',
          labels: {
            [PipelineRunLabel.APPLICATION]: 'app1',
          },
        },
        cluster: { name: 'cluster1' },
        subcomponent: { name: 'sub1' },
      };

      const result = getApplicationFromResource(resource);
      expect(result).toBe('app1');
    });

    it('should return spec.application for Release kind when label is missing', () => {
      const resource: ReleaseResource = {
        apiVersion: 'v1alpha1',
        kind: 'Release',
        metadata: {
          name: 'release1',
          namespace: 'namespace1',
        },
        spec: {
          application: 'app1',
        },
        cluster: { name: 'cluster1' },
        subcomponent: { name: 'sub1' },
      };

      const result = getApplicationFromResource(resource);
      expect(result).toBe('app1');
    });

    it('should prefer label over spec.application for Release kind', () => {
      const resource: ReleaseResource = {
        apiVersion: 'v1alpha1',
        kind: 'Release',
        metadata: {
          name: 'release1',
          namespace: 'namespace1',
          labels: {
            [PipelineRunLabel.APPLICATION]: 'app-from-label',
          },
        },
        spec: {
          application: 'app-from-spec',
        },
        cluster: { name: 'cluster1' },
        subcomponent: { name: 'sub1' },
      };

      const result = getApplicationFromResource(resource);
      expect(result).toBe('app-from-label');
    });

    it('should return spec.application for Component kind', () => {
      const resource: K8sResourceCommonWithClusterInfo = {
        apiVersion: 'v1',
        kind: 'Component',
        metadata: {
          name: 'comp1',
          namespace: 'namespace1',
        },
        spec: {
          application: 'app1',
        },
        cluster: { name: 'cluster1' },
        subcomponent: { name: 'sub1' },
      };

      const result = getApplicationFromResource(resource);
      expect(result).toBe('app1');
    });

    it('should return undefined for Component kind when spec.application is missing', () => {
      const resource: K8sResourceCommonWithClusterInfo = {
        apiVersion: 'v1',
        kind: 'Component',
        metadata: {
          name: 'comp1',
          namespace: 'namespace1',
        },
        cluster: { name: 'cluster1' },
        subcomponent: { name: 'sub1' },
      };

      const result = getApplicationFromResource(resource);
      expect(result).toBeUndefined();
    });

    it('should return spec.application for unknown resource kind', () => {
      const resource: K8sResourceCommonWithClusterInfo = {
        apiVersion: 'v1',
        kind: 'UnknownResource',
        metadata: {
          name: 'unknown1',
          namespace: 'namespace1',
        },
        spec: {
          application: 'app1',
        },
        cluster: { name: 'cluster1' },
        subcomponent: { name: 'sub1' },
      };

      const result = getApplicationFromResource(resource);
      expect(result).toBe('app1');
    });

    it('should handle PipelineRun with empty labels object', () => {
      const resource: PipelineRunResource = {
        apiVersion: 'v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'plr1',
          namespace: 'namespace1',
          labels: {},
        },
        spec: {
          application: 'app1',
        },
        cluster: { name: 'cluster1' },
        subcomponent: { name: 'sub1' },
      };

      const result = getApplicationFromResource(resource);
      expect(result).toBe('app1');
    });

    it('should handle PipelineRun with undefined labels', () => {
      const resource: PipelineRunResource = {
        apiVersion: 'v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'plr1',
          namespace: 'namespace1',
        },
        spec: {
          application: 'app1',
        },
        cluster: { name: 'cluster1' },
        subcomponent: { name: 'sub1' },
      };

      const result = getApplicationFromResource(resource);
      expect(result).toBe('app1');
    });

    it('should handle spec.application as non-string value', () => {
      const resource: K8sResourceCommonWithClusterInfo = {
        apiVersion: 'v1',
        kind: 'Component',
        metadata: {
          name: 'comp1',
          namespace: 'namespace1',
        },
        spec: {
          application: 123 as any,
        },
        cluster: { name: 'cluster1' },
        subcomponent: { name: 'sub1' },
      };

      const result = getApplicationFromResource(resource);
      expect(result).toBe(123);
    });

    it('should handle Application with undefined metadata', () => {
      const resource: ApplicationResource = {
        apiVersion: 'v1',
        kind: 'Application',
        cluster: { name: 'cluster1' },
        subcomponent: { name: 'sub1' },
      };

      const result = getApplicationFromResource(resource);
      expect(result).toBeUndefined();
    });

    it('should handle PipelineRun with label value as empty string', () => {
      const resource: PipelineRunResource = {
        apiVersion: 'v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'plr1',
          namespace: 'namespace1',
          labels: {
            [PipelineRunLabel.APPLICATION]: '',
          },
        },
        spec: {
          application: 'app1',
        },
        cluster: { name: 'cluster1' },
        subcomponent: { name: 'sub1' },
      };

      const result = getApplicationFromResource(resource);
      expect(result).toBe('app1');
    });
  });
});
