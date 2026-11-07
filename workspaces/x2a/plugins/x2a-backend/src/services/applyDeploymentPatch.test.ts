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
  metadata: { name: 'generated', labels: { generated: 'yes' } },
  spec: {
    backoffLimit: 3,
    template: {
      spec: {
        restartPolicy: 'Never',
        containers: [
          {
            name: 'x2a',
            image: 'x2a:latest',
            env: [{ name: 'PHASE', value: 'init' }],
            volumeMounts: [{ name: 'workspace', mountPath: '/workspace' }],
          },
        ],
        volumes: [{ name: 'workspace', emptyDir: {} }],
      },
    },
  },
});

describe('applyDeploymentPatch', () => {
  it('adds named environment variables, volumes, mounts, and metadata', () => {
    const result = applyDeploymentPatch(generatedJob(), {
      metadata: { annotations: { custom: 'yes' } },
      spec: {
        template: {
          spec: {
            containers: [
              {
                name: 'x2a',
                env: [{ name: 'CUSTOM_SETTING', value: 'example' }],
                volumeMounts: [
                  { name: 'custom-config', mountPath: '/etc/custom' },
                ],
              },
            ],
            volumes: [
              { name: 'custom-config', configMap: { name: 'custom-config' } },
            ],
          },
        },
      },
    });

    expect(result.metadata?.labels).toEqual({ generated: 'yes' });
    expect(result.metadata?.annotations).toEqual({ custom: 'yes' });
    expect(result.spec?.backoffLimit).toBe(3);
    expect(result.spec?.template.spec?.containers).toHaveLength(1);
    expect(result.spec?.template.spec?.containers?.[0].env).toEqual([
      { name: 'PHASE', value: 'init' },
      { name: 'CUSTOM_SETTING', value: 'example' },
    ]);
    expect(result.spec?.template.spec?.volumes).toHaveLength(2);
  });

  it('does not treat a label key named env as a Kubernetes named list', () => {
    const result = applyDeploymentPatch(generatedJob(), {
      metadata: {
        labels: { env: 'custom' },
        annotations: { volumeMounts: 'custom' },
      },
    });

    expect(result.metadata?.labels).toEqual({
      generated: 'yes',
      env: 'custom',
    });
    expect(result.metadata?.annotations).toEqual({
      volumeMounts: 'custom',
    });
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

  it('adds a sidecar without changing the generated container', () => {
    const result = applyDeploymentPatch(generatedJob(), {
      spec: {
        template: {
          spec: {
            containers: [{ name: 'sidecar', image: 'helper:latest' }],
          },
        },
      },
    });

    expect(result.spec?.template.spec?.containers?.map(c => c.name)).toEqual([
      'x2a',
      'sidecar',
    ]);
    expect(result.spec?.template.spec?.containers?.[0].image).toBe(
      'x2a:latest',
    );
  });

  it('preserves identical generated values and appends named entries in order', () => {
    const result = applyDeploymentPatch(generatedJob(), {
      metadata: { labels: { generated: 'yes', custom: 'yes' } },
      spec: {
        template: {
          spec: {
            containers: [
              {
                name: 'x2a',
                env: [
                  { name: 'PHASE', value: 'init' },
                  { name: 'FIRST_CUSTOM', value: 'first' },
                  { name: 'SECOND_CUSTOM', value: 'second' },
                ],
              },
            ],
          },
        },
      },
    });

    expect(result.metadata?.labels).toEqual({
      generated: 'yes',
      custom: 'yes',
    });
    expect(result.spec?.template.spec?.containers?.[0].env).toEqual([
      { name: 'PHASE', value: 'init' },
      { name: 'FIRST_CUSTOM', value: 'first' },
      { name: 'SECOND_CUSTOM', value: 'second' },
    ]);
  });

  it('does not mutate the generated Job or deployment patch', () => {
    const job = generatedJob();
    const patch = {
      metadata: { annotations: { custom: 'yes' } },
      spec: {
        template: {
          spec: {
            containers: [
              { name: 'x2a', env: [{ name: 'CUSTOM_SETTING', value: 'yes' }] },
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

  it('rejects conflicts with a generated value and reports its path', () => {
    expect(() =>
      applyDeploymentPatch(generatedJob(), {
        spec: {
          template: {
            spec: {
              containers: [
                { name: 'x2a', env: [{ name: 'PHASE', value: 'migrate' }] },
              ],
            },
          },
        },
      }),
    ).toThrow(
      'Invalid x2a.kubernetes.deploymentPatch at spec.template.spec.containers[x2a].env[PHASE].value',
    );
  });

  it('rejects duplicate container names in the patch', () => {
    expect(() =>
      applyDeploymentPatch(generatedJob(), {
        spec: {
          template: {
            spec: { containers: [{ name: 'x2a' }, { name: 'x2a' }] },
          },
        },
      }),
    ).toThrow('containers[x2a]');
  });

  it.each([
    {
      description: 'a non-array container list',
      patch: { spec: { template: { spec: { containers: {} } } } },
      path: 'spec.template.spec.containers',
    },
    {
      description: 'a non-array environment list',
      patch: {
        spec: {
          template: {
            spec: { containers: [{ name: 'x2a', env: {} }] },
          },
        },
      },
      path: 'spec.template.spec.containers[x2a].env',
    },
    {
      description: 'a non-array volume list',
      patch: { spec: { template: { spec: { volumes: {} } } } },
      path: 'spec.template.spec.volumes',
    },
    {
      description: 'a non-array volume mount list',
      patch: {
        spec: {
          template: {
            spec: {
              containers: [{ name: 'x2a', volumeMounts: {} }],
            },
          },
        },
      },
      path: 'spec.template.spec.containers[x2a].volumeMounts',
    },
    {
      description: 'an unnamed container',
      patch: { spec: { template: { spec: { containers: [{}] } } } },
      path: 'spec.template.spec.containers.0',
    },
    {
      description: 'an unnamed volume',
      patch: { spec: { template: { spec: { volumes: [{}] } } } },
      path: 'spec.template.spec.volumes.0',
    },
    {
      description: 'an unnamed volume mount',
      patch: {
        spec: {
          template: {
            spec: {
              containers: [
                { name: 'x2a', volumeMounts: [{ mountPath: '/x' }] },
              ],
            },
          },
        },
      },
      path: 'spec.template.spec.containers[x2a].volumeMounts.0',
    },
    {
      description: 'an empty name on an environment variable',
      patch: {
        spec: {
          template: {
            spec: { containers: [{ name: 'x2a', env: [{ name: '' }] }] },
          },
        },
      },
      path: 'spec.template.spec.containers[x2a].env.0',
    },
    {
      description: 'duplicate environment variable names',
      patch: {
        spec: {
          template: {
            spec: {
              containers: [
                {
                  name: 'x2a',
                  env: [
                    { name: 'CUSTOM_SETTING', value: 'one' },
                    { name: 'CUSTOM_SETTING', value: 'two' },
                  ],
                },
              ],
            },
          },
        },
      },
      path: 'spec.template.spec.containers[x2a].env[CUSTOM_SETTING]',
    },
    {
      description: 'duplicate volume names',
      patch: {
        spec: {
          template: {
            spec: { volumes: [{ name: 'custom' }, { name: 'custom' }] },
          },
        },
      },
      path: 'spec.template.spec.volumes[custom]',
    },
    {
      description: 'duplicate volume mount names',
      patch: {
        spec: {
          template: {
            spec: {
              containers: [
                {
                  name: 'x2a',
                  volumeMounts: [
                    { name: 'custom', mountPath: '/one' },
                    { name: 'custom', mountPath: '/two' },
                  ],
                },
              ],
            },
          },
        },
      },
      path: 'spec.template.spec.containers[x2a].volumeMounts[custom]',
    },
  ])('rejects $description with a path-specific error', ({ patch, path }) => {
    expect(() => applyDeploymentPatch(generatedJob(), patch)).toThrow(path);
  });

  it.each([
    {
      description: 'the generated Job name',
      patch: { metadata: { name: 'replacement' } },
      path: 'metadata.name',
    },
    {
      description: 'a generated label',
      patch: { metadata: { labels: { generated: 'no' } } },
      path: 'metadata.labels.generated',
    },
    {
      description: 'the generated container image',
      patch: {
        spec: {
          template: {
            spec: { containers: [{ name: 'x2a', image: 'other:latest' }] },
          },
        },
      },
      path: 'spec.template.spec.containers[x2a].image',
    },
    {
      description: 'the generated restart policy',
      patch: { spec: { template: { spec: { restartPolicy: 'Always' } } } },
      path: 'spec.template.spec.restartPolicy',
    },
    {
      description: 'a generated volume mount path',
      patch: {
        spec: {
          template: {
            spec: {
              containers: [
                {
                  name: 'x2a',
                  volumeMounts: [{ name: 'workspace', mountPath: '/other' }],
                },
              ],
            },
          },
        },
      },
      path: 'spec.template.spec.containers[x2a].volumeMounts[workspace].mountPath',
    },
    {
      description: 'a generated volume source',
      patch: {
        spec: {
          template: {
            spec: {
              volumes: [{ name: 'workspace', emptyDir: null }],
            },
          },
        },
      },
      path: 'spec.template.spec.volumes[workspace].emptyDir',
    },
  ])('rejects a patch that changes $description', ({ patch, path }) => {
    expect(() => applyDeploymentPatch(generatedJob(), patch)).toThrow(path);
  });

  it('rejects replacing a generated non-named array', () => {
    const job = generatedJob();
    job.spec!.template.spec!.containers![0].command = ['run'];

    expect(() =>
      applyDeploymentPatch(job, {
        spec: {
          template: {
            spec: { containers: [{ name: 'x2a', command: ['replace'] }] },
          },
        },
      }),
    ).toThrow('spec.template.spec.containers[x2a].command');
  });

  it.each([
    {
      description: 'container arguments',
      patch: {
        spec: {
          template: {
            spec: { containers: [{ name: 'x2a', args: ['replacement'] }] },
          },
        },
      },
      path: 'spec.template.spec.containers[x2a].args',
    },
    {
      description: 'container envFrom',
      patch: {
        spec: {
          template: {
            spec: {
              containers: [
                {
                  name: 'x2a',
                  envFrom: [{ configMapRef: { name: 'replacement' } }],
                },
              ],
            },
          },
        },
      },
      path: 'spec.template.spec.containers[x2a].envFrom',
    },
    {
      description: 'container image pull policy',
      patch: {
        spec: {
          template: {
            spec: {
              containers: [{ name: 'x2a', imagePullPolicy: 'Always' }],
            },
          },
        },
      },
      path: 'spec.template.spec.containers[x2a].imagePullPolicy',
    },
    {
      description: 'container resources',
      patch: {
        spec: {
          template: {
            spec: {
              containers: [
                {
                  name: 'x2a',
                  resources: { requests: { cpu: 'replacement' } },
                },
              ],
            },
          },
        },
      },
      path: 'spec.template.spec.containers[x2a].resources.requests.cpu',
    },
    {
      description: 'job backoff limit',
      patch: { spec: { backoffLimit: 10 } },
      path: 'spec.backoffLimit',
    },
    {
      description: 'job TTL',
      patch: { spec: { ttlSecondsAfterFinished: 60 } },
      path: 'spec.ttlSecondsAfterFinished',
    },
  ])('rejects changing generated $description', ({ patch, path }) => {
    const job = generatedJob();
    const container = job.spec!.template.spec!.containers![0];
    container.args = ['generated'];
    container.command = ['run'];
    container.envFrom = [{ secretRef: { name: 'generated-secret' } }];
    container.imagePullPolicy = 'IfNotPresent';
    container.resources = {
      requests: { cpu: '500m', memory: '1Gi' },
      limits: { cpu: '1', memory: '2Gi' },
    };
    job.spec!.backoffLimit = 3;
    job.spec!.ttlSecondsAfterFinished = 86400;

    expect(() => applyDeploymentPatch(job, patch)).toThrow(path);
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
