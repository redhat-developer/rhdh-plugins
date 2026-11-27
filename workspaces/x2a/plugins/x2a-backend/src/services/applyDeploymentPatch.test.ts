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

import type { V1Job } from '@kubernetes/client-node';
import { applyDeploymentPatch } from './applyDeploymentPatch';

const generatedJob = (): V1Job => ({
  apiVersion: 'batch/v1',
  kind: 'Job',
  metadata: {
    name: 'generated',
    labels: { generated: 'yes', team: 'x2a' },
    annotations: { generated: 'yes' },
  },
  spec: {
    backoffLimit: 3,
    ttlSecondsAfterFinished: 86400,
    template: {
      metadata: { labels: { generated: 'yes' } },
      spec: {
        restartPolicy: 'Never',
        serviceAccountName: 'generated-sa',
        nodeSelector: { 'kubernetes.io/os': 'linux' },
        containers: [
          {
            name: 'x2a',
            image: 'x2a:latest',
            imagePullPolicy: 'IfNotPresent',
            command: ['x2a', 'run'],
            args: ['generated'],
            env: [{ name: 'PHASE', value: 'init' }],
            envFrom: [{ secretRef: { name: 'generated-secret' } }],
            volumeMounts: [
              { name: 'workspace', mountPath: '/workspace' },
              { name: 'rules', mountPath: '/rules' },
            ],
            resources: {
              requests: { cpu: '500m', memory: '1Gi' },
              limits: { cpu: '1', memory: '2Gi' },
            },
          },
        ],
        volumes: [
          { name: 'workspace', emptyDir: {} },
          { name: 'rules', configMap: { name: 'rules' } },
        ],
        tolerations: [{ key: 'generated', operator: 'Exists' }],
      },
    },
  },
});

describe('applyDeploymentPatch', () => {
  it('returns the exact merged Job for a representative patch', () => {
    const result = applyDeploymentPatch(generatedJob(), {
      metadata: {
        labels: { team: 'platform', custom: 'yes' },
        annotations: { custom: 'yes' },
      },
      spec: {
        backoffLimit: 0,
        template: {
          metadata: { labels: { template: 'yes' } },
          spec: {
            serviceAccountName: null,
            nodeSelector: { custom: 'node' },
            tolerations: [{ key: 'custom', operator: 'Equal', value: 'yes' }],
            hostAliases: [{ ip: '127.0.0.1', hostnames: ['custom.local'] }],
            initContainers: [{ name: 'init', image: 'init:latest' }],
            imagePullSecrets: [{ name: 'pull-secret' }],
            containers: [
              {
                name: 'x2a',
                image: 'custom:latest',
                command: ['custom-command'],
                args: ['custom-arg'],
                env: [
                  { name: 'PHASE', value: 'replaced' },
                  { name: 'CUSTOM', value: 'yes' },
                ],
                envFrom: [{ configMapRef: { name: 'custom-config' } }],
                volumeMounts: [
                  {
                    name: 'workspace',
                    mountPath: '/workspace',
                    readOnly: true,
                  },
                  { name: 'custom-volume', mountPath: '/custom' },
                ],
                ports: [{ containerPort: 8080, protocol: 'UDP' }],
                resources: {
                  requests: { cpu: '250m' },
                  limits: { memory: '512Mi' },
                },
              },
              { name: 'sidecar', image: 'sidecar:latest' },
            ],
            volumes: [
              {
                name: 'rules',
                configMap: null,
                secret: { secretName: 'custom-rules' },
              },
              { name: 'custom-volume', emptyDir: {} },
            ],
          },
        },
      },
    });

    const expected: V1Job = {
      apiVersion: 'batch/v1',
      kind: 'Job',
      metadata: {
        name: 'generated',
        labels: { generated: 'yes', team: 'platform', custom: 'yes' },
        annotations: { generated: 'yes', custom: 'yes' },
      },
      spec: {
        backoffLimit: 0,
        ttlSecondsAfterFinished: 86400,
        template: {
          metadata: { labels: { generated: 'yes', template: 'yes' } },
          spec: {
            restartPolicy: 'Never',
            nodeSelector: { 'kubernetes.io/os': 'linux', custom: 'node' },
            tolerations: [{ key: 'custom', operator: 'Equal', value: 'yes' }],
            hostAliases: [{ ip: '127.0.0.1', hostnames: ['custom.local'] }],
            initContainers: [{ name: 'init', image: 'init:latest' }],
            imagePullSecrets: [{ name: 'pull-secret' }],
            containers: [
              {
                name: 'x2a',
                image: 'custom:latest',
                imagePullPolicy: 'IfNotPresent',
                command: ['custom-command'],
                args: ['custom-arg'],
                env: [
                  { name: 'PHASE', value: 'replaced' },
                  { name: 'CUSTOM', value: 'yes' },
                ],
                envFrom: [{ configMapRef: { name: 'custom-config' } }],
                volumeMounts: [
                  {
                    name: 'workspace',
                    mountPath: '/workspace',
                    readOnly: true,
                  },
                  { name: 'rules', mountPath: '/rules' },
                  { name: 'custom-volume', mountPath: '/custom' },
                ],
                ports: [{ containerPort: 8080, protocol: 'UDP' }],
                resources: {
                  requests: { cpu: '250m', memory: '1Gi' },
                  limits: { cpu: '1', memory: '512Mi' },
                },
              },
              { name: 'sidecar', image: 'sidecar:latest' },
            ],
            volumes: [
              { name: 'workspace', emptyDir: {} },
              { name: 'rules', secret: { secretName: 'custom-rules' } },
              { name: 'custom-volume', emptyDir: {} },
            ],
          },
        },
      },
    };

    expect(result).toEqual(expected);
  });

  it('merges common keyed lists and metadata', () => {
    const result = applyDeploymentPatch(generatedJob(), {
      metadata: {
        labels: { team: 'platform', custom: 'yes' },
        annotations: { custom: 'yes' },
      },
      spec: {
        template: {
          spec: {
            containers: [
              {
                name: 'x2a',
                env: [{ name: 'CUSTOM_SETTING', value: 'example' }],
                volumeMounts: [
                  { name: 'custom-config', mountPath: '/etc/custom-config' },
                ],
              },
              { name: 'sidecar', image: 'helper:latest' },
            ],
            volumes: [
              { name: 'custom-config', configMap: { name: 'custom-config' } },
            ],
          },
        },
      },
    });

    expect(result.metadata?.labels).toEqual({
      generated: 'yes',
      team: 'platform',
      custom: 'yes',
    });
    expect(result.metadata?.annotations).toEqual({
      generated: 'yes',
      custom: 'yes',
    });
    expect(result.spec?.template.spec?.containers).toEqual([
      expect.objectContaining({
        name: 'x2a',
        image: 'x2a:latest',
        command: ['x2a', 'run'],
        env: [
          { name: 'PHASE', value: 'init' },
          { name: 'CUSTOM_SETTING', value: 'example' },
        ],
        volumeMounts: [
          { name: 'workspace', mountPath: '/workspace' },
          { name: 'rules', mountPath: '/rules' },
          { name: 'custom-config', mountPath: '/etc/custom-config' },
        ],
      }),
      { name: 'sidecar', image: 'helper:latest' },
    ]);
    expect(result.spec?.template.spec?.volumes).toEqual([
      { name: 'workspace', emptyDir: {} },
      { name: 'rules', configMap: { name: 'rules' } },
      { name: 'custom-config', configMap: { name: 'custom-config' } },
    ]);
  });

  it('overrides generated scalar and object fields recursively', () => {
    const result = applyDeploymentPatch(generatedJob(), {
      spec: {
        backoffLimit: 0,
        template: {
          spec: {
            restartPolicy: 'OnFailure',
            serviceAccountName: 'custom-sa',
            nodeSelector: { 'kubernetes.io/os': 'linux', custom: 'node' },
            containers: [
              {
                name: 'x2a',
                image: 'custom-x2a:latest',
                imagePullPolicy: 'Always',
                resources: {
                  requests: { cpu: '1', memory: '2Gi' },
                  limits: { memory: '4Gi' },
                },
              },
            ],
          },
        },
      },
    });

    expect(result.spec?.backoffLimit).toBe(0);
    expect(result.spec?.template.spec?.restartPolicy).toBe('OnFailure');
    expect(result.spec?.template.spec?.serviceAccountName).toBe('custom-sa');
    expect(result.spec?.template.spec?.nodeSelector).toEqual({
      'kubernetes.io/os': 'linux',
      custom: 'node',
    });
    expect(result.spec?.template.spec?.containers?.[0].image).toBe(
      'custom-x2a:latest',
    );
    expect(result.spec?.template.spec?.containers?.[0].imagePullPolicy).toBe(
      'Always',
    );
    expect(result.spec?.template.spec?.containers?.[0].resources).toEqual({
      requests: { cpu: '1', memory: '2Gi' },
      limits: { cpu: '1', memory: '4Gi' },
    });
  });

  it('merges env entries by name and lets the patch override generated values', () => {
    const result = applyDeploymentPatch(generatedJob(), {
      spec: {
        template: {
          spec: {
            containers: [
              {
                name: 'x2a',
                env: [{ name: 'PHASE', value: 'replacement' }],
              },
            ],
          },
        },
      },
    });

    expect(result.spec?.template.spec?.containers?.[0].env).toEqual([
      { name: 'PHASE', value: 'replacement' },
    ]);
  });

  it('merges volume mounts by mountPath, matching Kubernetes SMP behavior', () => {
    const result = applyDeploymentPatch(generatedJob(), {
      spec: {
        template: {
          spec: {
            containers: [
              {
                name: 'x2a',
                volumeMounts: [
                  { name: 'replacement-name', mountPath: '/workspace' },
                ],
              },
            ],
          },
        },
      },
    });

    expect(result.spec?.template.spec?.containers?.[0].volumeMounts).toEqual([
      { name: 'replacement-name', mountPath: '/workspace' },
      { name: 'rules', mountPath: '/rules' },
    ]);
  });

  it('merges volumes by name and overrides their source', () => {
    const result = applyDeploymentPatch(generatedJob(), {
      spec: {
        template: {
          spec: {
            volumes: [
              {
                name: 'rules',
                configMap: null,
                secret: { secretName: 'custom-rules' },
              },
            ],
          },
        },
      },
    });

    expect(result.spec?.template.spec?.volumes).toEqual([
      { name: 'workspace', emptyDir: {} },
      { name: 'rules', secret: { secretName: 'custom-rules' } },
    ]);
  });

  it.each([
    { field: 'command', patch: ['replacement'] },
    { field: 'args', patch: ['replacement'] },
    {
      field: 'envFrom',
      patch: [{ configMapRef: { name: 'replacement' } }],
    },
  ])('replaces the atomic container array $field', ({ field, patch }) => {
    const result = applyDeploymentPatch(generatedJob(), {
      spec: {
        template: {
          spec: { containers: [{ name: 'x2a', [field]: patch }] },
        },
      },
    });

    const containerField = field as 'command' | 'args' | 'envFrom';
    expect(
      result.spec?.template.spec?.containers?.[0]?.[containerField],
    ).toEqual(patch);
  });

  it('replaces other generated arrays, including tolerations', () => {
    const result = applyDeploymentPatch(generatedJob(), {
      spec: {
        template: {
          spec: {
            tolerations: [{ key: 'custom', operator: 'Equal', value: 'yes' }],
          },
        },
      },
    });

    expect(result.spec?.template.spec?.tolerations).toEqual([
      { key: 'custom', operator: 'Equal', value: 'yes' },
    ]);
  });

  it('supports other common keyed list merge rules', () => {
    const job = generatedJob();
    job.spec!.template.spec!.initContainers = [{ name: 'init', image: 'old' }];
    job.spec!.template.spec!.imagePullSecrets = [{ name: 'generated-pull' }];
    job.spec!.template.spec!.containers![0].ports = [
      { containerPort: 8080, protocol: 'TCP' },
    ];

    const result = applyDeploymentPatch(job, {
      spec: {
        template: {
          spec: {
            initContainers: [{ name: 'init', image: 'new' }],
            imagePullSecrets: [{ name: 'custom-pull' }],
            containers: [
              {
                name: 'x2a',
                ports: [{ containerPort: 8080, protocol: 'UDP' }],
              },
            ],
          },
        },
      },
    });

    expect(result.spec?.template.spec?.initContainers).toEqual([
      { name: 'init', image: 'new' },
    ]);
    expect(result.spec?.template.spec?.imagePullSecrets).toEqual([
      { name: 'generated-pull' },
      { name: 'custom-pull' },
    ]);
    expect(result.spec?.template.spec?.containers?.[0].ports).toEqual([
      { containerPort: 8080, protocol: 'UDP' },
    ]);
  });

  it('deletes a generated field when the patch value is null', () => {
    const result = applyDeploymentPatch(generatedJob(), {
      metadata: { annotations: null },
      spec: { template: { spec: { serviceAccountName: null } } },
    });

    expect(result.metadata?.annotations).toBeUndefined();
    expect(result.spec?.template.spec?.serviceAccountName).toBeUndefined();
  });

  it('does not mutate the generated Job or deployment patch', () => {
    const job = generatedJob();
    const patch = {
      spec: {
        template: {
          spec: {
            containers: [
              { name: 'x2a', env: [{ name: 'CUSTOM', value: 'yes' }] },
            ],
          },
        },
      },
    };
    const originalJob = structuredClone(job);
    const originalPatch = structuredClone(patch);

    applyDeploymentPatch(job, patch);

    expect(job).toEqual(originalJob);
    expect(patch).toEqual(originalPatch);
  });

  it.each([
    { description: 'a non-finite number', value: Number.NaN },
    { description: 'an infinite number', value: Number.POSITIVE_INFINITY },
    {
      description: 'a timestamp object',
      value: new Date('2024-01-01T00:00:00Z'),
    },
    { description: 'a set object', value: new Set(['value']) },
    { description: 'binary data', value: Buffer.from('value') },
  ])('rejects $description in the patch', ({ value }) => {
    expect(() =>
      applyDeploymentPatch(generatedJob(), {
        metadata: { annotations: { custom: value } },
      }),
    ).toThrow('metadata.annotations.custom: expected a JSON-compatible value');
  });

  it.each([
    {
      description: 'containers',
      patch: {
        spec: {
          template: {
            spec: { containers: [{ name: 'x2a' }, { name: 'x2a' }] },
          },
        },
      },
      path: 'containers.name=x2a',
    },
    {
      description: 'environment variables',
      patch: {
        spec: {
          template: {
            spec: {
              containers: [
                {
                  name: 'x2a',
                  env: [{ name: 'A' }, { name: 'A' }],
                },
              ],
            },
          },
        },
      },
      path: 'env.name=A',
    },
    {
      description: 'volume mounts',
      patch: {
        spec: {
          template: {
            spec: {
              containers: [
                {
                  name: 'x2a',
                  volumeMounts: [
                    { mountPath: '/same' },
                    { mountPath: '/same' },
                  ],
                },
              ],
            },
          },
        },
      },
      path: 'volumeMounts.mountPath=/same',
    },
  ])('rejects duplicate keys in $description', ({ patch, path }) => {
    expect(() => applyDeploymentPatch(generatedJob(), patch)).toThrow(
      `${path}: duplicate`,
    );
  });

  it('rejects keyed-list entries without their merge key', () => {
    expect(() =>
      applyDeploymentPatch(generatedJob(), {
        spec: { template: { spec: { containers: [{ image: 'invalid' }] } } },
      }),
    ).toThrow('containers.0: expected a string or number name');
  });

  it('rejects unsupported Strategic Merge Patch directives', () => {
    expect(() =>
      applyDeploymentPatch(generatedJob(), {
        metadata: { labels: { $patch: 'delete' } },
      }),
    ).toThrow(
      'metadata.labels.$patch: unsupported Strategic Merge Patch directive',
    );
  });

  it('rejects a non-object deployment patch', () => {
    expect(() => applyDeploymentPatch(generatedJob(), null)).toThrow(
      'deploymentPatch must be a plain object',
    );
    expect(() => applyDeploymentPatch(generatedJob(), [])).toThrow(
      'deploymentPatch must be a plain object',
    );
  });
});
