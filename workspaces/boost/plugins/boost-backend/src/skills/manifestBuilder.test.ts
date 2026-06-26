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
  buildDeploymentManifest,
  validateRfc1123Label,
} from './manifestBuilder';

describe('manifestBuilder', () => {
  describe('buildDeploymentManifest', () => {
    const baseParams = {
      deploymentId: 'skill-test-12345',
      skillId: 'test-skill',
      image: 'registry.example.com/runtime:latest',
      namespace: 'boost-skills',
      name: 'skill-test-skill',
    };

    it('generates a valid K8s Deployment manifest', () => {
      const manifest = buildDeploymentManifest(baseParams) as Record<
        string,
        unknown
      >;

      expect(manifest.apiVersion).toBe('apps/v1');
      expect(manifest.kind).toBe('Deployment');
    });

    it('sets correct metadata', () => {
      const manifest = buildDeploymentManifest(baseParams) as {
        metadata: {
          name: string;
          namespace: string;
          labels: Record<string, string>;
        };
      };

      expect(manifest.metadata.name).toBe('skill-test-skill');
      expect(manifest.metadata.namespace).toBe('boost-skills');
      expect(manifest.metadata.labels['app.kubernetes.io/name']).toBe(
        'skill-test-skill',
      );
      expect(manifest.metadata.labels['app.kubernetes.io/managed-by']).toBe(
        'boost',
      );
      expect(manifest.metadata.labels['boost.redhat.com/skill-id']).toBe(
        'test-skill',
      );
      expect(manifest.metadata.labels['boost.redhat.com/deployment-id']).toBe(
        'skill-test-12345',
      );
    });

    it('includes OCI init container', () => {
      const manifest = buildDeploymentManifest(baseParams) as {
        spec: {
          template: {
            spec: {
              initContainers: Array<{
                name: string;
                image: string;
                command: string[];
              }>;
            };
          };
        };
      };

      const initContainers = manifest.spec.template.spec.initContainers;
      expect(initContainers).toHaveLength(1);
      expect(initContainers[0].name).toBe('oci-init');
      expect(initContainers[0].image).toBe(
        'registry.example.com/runtime:latest',
      );
      expect(initContainers[0].command).toEqual([
        'cp',
        '-r',
        '/skill/.',
        '/shared/skill',
      ]);
    });

    it('includes skill-agent container with correct image', () => {
      const manifest = buildDeploymentManifest(baseParams) as {
        spec: {
          template: {
            spec: {
              containers: Array<{
                name: string;
                image: string;
                env: Array<{ name: string; value: string }>;
              }>;
            };
          };
        };
      };

      const containers = manifest.spec.template.spec.containers;
      expect(containers).toHaveLength(1);
      expect(containers[0].name).toBe('skill-agent');
      expect(containers[0].image).toBe('registry.example.com/runtime:latest');
      expect(containers[0].env).toContainEqual({
        name: 'SKILL_ID',
        value: 'test-skill',
      });
    });

    it('uses default resource values when not specified', () => {
      const manifest = buildDeploymentManifest(baseParams) as {
        spec: {
          template: {
            spec: {
              containers: Array<{
                resources: {
                  requests: { cpu: string; memory: string };
                  limits: { cpu: string; memory: string };
                };
              }>;
            };
          };
        };
      };

      const resources = manifest.spec.template.spec.containers[0].resources;
      expect(resources.requests.cpu).toBe('100m');
      expect(resources.requests.memory).toBe('256Mi');
      expect(resources.limits.cpu).toBe('500m');
      expect(resources.limits.memory).toBe('512Mi');
    });

    it('accepts separate requests and limits', () => {
      const manifest = buildDeploymentManifest({
        ...baseParams,
        resources: {
          requests: { cpu: '200m', memory: '512Mi' },
          limits: { cpu: '1', memory: '1Gi' },
        },
      }) as {
        spec: {
          template: {
            spec: {
              containers: Array<{
                resources: {
                  requests: { cpu: string; memory: string };
                  limits: { cpu: string; memory: string };
                };
              }>;
            };
          };
        };
      };

      const resources = manifest.spec.template.spec.containers[0].resources;
      expect(resources.requests.cpu).toBe('200m');
      expect(resources.requests.memory).toBe('512Mi');
      expect(resources.limits.cpu).toBe('1');
      expect(resources.limits.memory).toBe('1Gi');
    });

    it('includes shared volume between init and main containers', () => {
      const manifest = buildDeploymentManifest(baseParams) as {
        spec: {
          template: {
            spec: {
              volumes: Array<{ name: string; emptyDir: object }>;
              initContainers: Array<{
                volumeMounts: Array<{ name: string; mountPath: string }>;
              }>;
              containers: Array<{
                volumeMounts: Array<{
                  name: string;
                  mountPath: string;
                  readOnly: boolean;
                }>;
              }>;
            };
          };
        };
      };

      const spec = manifest.spec.template.spec;
      expect(spec.volumes).toContainEqual({
        name: 'shared-skill',
        emptyDir: {},
      });
      expect(spec.initContainers[0].volumeMounts[0].name).toBe('shared-skill');
      expect(spec.containers[0].volumeMounts[0].name).toBe('shared-skill');
      expect(spec.containers[0].volumeMounts[0].readOnly).toBe(true);
    });

    it('sets selector matchLabels', () => {
      const manifest = buildDeploymentManifest(baseParams) as {
        spec: {
          selector: { matchLabels: Record<string, string> };
        };
      };

      expect(manifest.spec.selector.matchLabels['app.kubernetes.io/name']).toBe(
        'skill-test-skill',
      );
    });
  });

  describe('validateRfc1123Label', () => {
    it('accepts valid labels', () => {
      expect(() => validateRfc1123Label('my-skill', 'test')).not.toThrow();
      expect(() => validateRfc1123Label('abc123', 'test')).not.toThrow();
      expect(() => validateRfc1123Label('a', 'test')).not.toThrow();
      expect(() => validateRfc1123Label('a-b-c-d', 'test')).not.toThrow();
    });

    it('rejects labels starting with hyphen', () => {
      expect(() => validateRfc1123Label('-invalid', 'test')).toThrow(
        'RFC 1123',
      );
    });

    it('rejects labels ending with hyphen', () => {
      expect(() => validateRfc1123Label('invalid-', 'test')).toThrow(
        'RFC 1123',
      );
    });

    it('rejects labels with uppercase', () => {
      expect(() => validateRfc1123Label('Invalid', 'test')).toThrow('RFC 1123');
    });

    it('rejects labels with underscores', () => {
      expect(() => validateRfc1123Label('my_skill', 'test')).toThrow(
        'RFC 1123',
      );
    });

    it('rejects empty string', () => {
      expect(() => validateRfc1123Label('', 'test')).toThrow('RFC 1123');
    });

    it('rejects labels longer than 63 characters', () => {
      const long = 'a'.repeat(64);
      expect(() => validateRfc1123Label(long, 'test')).toThrow('RFC 1123');
    });

    it('accepts label of exactly 63 characters', () => {
      const exact = 'a'.repeat(63);
      expect(() => validateRfc1123Label(exact, 'test')).not.toThrow();
    });

    it('includes field name in error message', () => {
      expect(() => validateRfc1123Label('BAD', 'skillId')).toThrow('skillId');
    });
  });
});
