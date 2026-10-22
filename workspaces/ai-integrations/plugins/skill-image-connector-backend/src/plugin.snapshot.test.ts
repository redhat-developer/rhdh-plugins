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

import type { SchedulerService } from '@backstage/backend-plugin-api';
import {
  mockCredentials,
  mockServices,
  startTestBackend,
} from '@backstage/backend-test-utils';
import { validateSnapshot } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import request from 'supertest';
import type { ConnectorTestConfig } from './testUtils';
import {
  resolvedDigest,
  pinnedRef,
  startConnector as startSharedConnector,
} from './testUtils';
import { skillImageConnectorPlugin } from './plugin';
import { discoverQuayRepositorySnapshot } from './services/QuayDiscovery';
import {
  cleanupSkillImageExtraction,
  fetchAndExtractSkillImage,
  NonSkillImageError,
} from './services/SkillImageService';
import { fetchManifest } from './services/OciClient';

jest.mock('./services/OciClient', () => ({
  ...jest.requireActual<typeof import('./services/OciClient')>(
    './services/OciClient',
  ),
  fetchManifest: jest.fn(),
}));

jest.mock('./services/QuayDiscovery', () => ({
  discoverQuayRepositorySnapshot: jest.fn(),
}));
jest.mock('./services/SkillImageService', () => ({
  ...jest.requireActual<typeof import('./services/SkillImageService')>(
    './services/SkillImageService',
  ),
  cleanupStaleExtractionDirs: jest.fn().mockResolvedValue(undefined),
  cleanupSkillImageExtraction: jest.fn().mockResolvedValue(undefined),
  fetchAndExtractSkillImage: jest.fn(),
}));

const logger = mockServices.logger.mock();
const fetchImage = jest.mocked(fetchAndExtractSkillImage);
const discover = jest.mocked(discoverQuayRepositorySnapshot);
const resolveManifest = jest.mocked(fetchManifest);
const extracted = {
  skillImageYaml: `metadata:\n  display-name: Test Skill\n  name: test-skill\n  description: A test\nspec:\n  prompt: Do things`,
  skillsMd: '# Test Skill',
  skillImageYamlPath: '/unused/skillimage.yaml',
  skillsMdPath: '/unused/SKILLS.md',
};
beforeEach(() => {
  jest.resetAllMocks();
  logger.child.mockReturnValue(logger);
  jest.mocked(cleanupSkillImageExtraction).mockResolvedValue(undefined);
  fetchImage.mockImplementation(async () => ({ ...extracted }));
  resolveManifest.mockResolvedValue({
    manifest: {
      schemaVersion: 2,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        digest: resolvedDigest,
        size: 0,
      },
      layers: [],
    },
    digest: resolvedDigest,
  });
});

const startConnector = (settings: ConnectorTestConfig) =>
  startSharedConnector(settings, logger, skillImageConnectorPlugin);

describe('GET /skills/:sourceId — snapshot endpoint', () => {
  it('returns 404 for unknown source IDs', async () => {
    const { server } = await startConnector({
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const response = await request(server)
      .get('/api/skill-image-connector/skills/nonexistent')
      .set('Authorization', mockCredentials.service.header());
    expect(response.status).toBe(404);
    expect(response.body.error).toContain('Unknown source');
  });

  it('returns 404 for URL-encoded unknown source IDs', async () => {
    const { server } = await startConnector({
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const encoded = encodeURIComponent('source/with spaces');
    const response = await request(server)
      .get(`/api/skill-image-connector/skills/${encoded}`)
      .set('Authorization', mockCredentials.service.header());
    expect(response.status).toBe(404);
  });

  it('serves snapshot for the backward-compatible default source', async () => {
    const { server } = await startConnector({
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const response = await request(server)
      .get('/api/skill-image-connector/skills/default')
      .set('Authorization', mockCredentials.service.header());
    expect(response.status).toBe(200);
    expect(response.body.source).toEqual({ id: 'default', type: 'oci' });
    expect(response.body.schemaVersion).toBe('1');
    expect(response.body.status).toBe('ready');
  });

  it('returns valid v1 SkillSnapshot that passes runtime validation', async () => {
    const { server } = await startConnector({
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const response = await request(server)
      .get('/api/skill-image-connector/skills/default')
      .set('Authorization', mockCredentials.service.header());
    expect(response.status).toBe(200);
    const validation = validateSnapshot(response.body);
    expect(validation).toEqual({ valid: true, errors: [] });
  });

  it('contains normalized records without raw YAML, Markdown, or local paths', async () => {
    const { server } = await startConnector({
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const response = await request(server)
      .get('/api/skill-image-connector/skills/default')
      .set('Authorization', mockCredentials.service.header());
    expect(response.status).toBe(200);
    const body = response.body;
    const json = JSON.stringify(body);
    // Must not contain raw YAML or Markdown content
    expect(json).not.toContain('skillImageYaml');
    expect(json).not.toContain('skillsMd');
    // Must not contain local file paths
    expect(json).not.toContain('/tmp/');
    expect(json).not.toContain('skillimage.yaml');
    // Must contain normalized record fields
    expect(body.skills.length).toBeGreaterThan(0);
    const record = body.skills[0];
    expect(record.key).toBeDefined();
    expect(record.name).toBeDefined();
    expect(record.sourceUri).toBeDefined();
    expect(record.digest).toBeDefined();
  });

  it('/images endpoint still returns raw content for backward compatibility', async () => {
    const { server } = await startConnector({
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const response = await request(server)
      .get('/api/skill-image-connector/images')
      .set('Authorization', mockCredentials.user.header());
    expect(response.status).toBe(200);
    expect(response.body.images).toHaveLength(1);
    expect(response.body.images[0].skillImageYaml).toBeDefined();
    expect(response.body.images[0].skillsMd).toBeDefined();
  });

  it.each(['not: [valid YAML', 'metadata: {}'])(
    'keeps extracted raw content ready when normalization rejects %p',
    async skillImageYaml => {
      const imageRef = 'quay.io/org/skill:v1';
      fetchImage.mockResolvedValue({ ...extracted, skillImageYaml });
      const { server } = await startConnector({ images: [{ imageRef }] });

      const raw = await request(server)
        .get('/api/skill-image-connector/images')
        .set('Authorization', mockCredentials.user.header());
      expect(raw.status).toBe(200);
      expect(raw.body).toEqual({
        status: 'ready',
        failedImages: [],
        images: [{ imageRef, skillImageYaml, skillsMd: extracted.skillsMd }],
      });

      const snapshot = await request(server)
        .get('/api/skill-image-connector/skills/default')
        .set('Authorization', mockCredentials.service.header());
      expect(snapshot.status).toBe(200);
      expect(snapshot.body.status).toBe('partial');
      expect(snapshot.body.skills).toEqual([]);
      expect(snapshot.body.failedSkillKeys).toEqual([imageRef]);
      expect(validateSnapshot(snapshot.body)).toEqual({
        valid: true,
        errors: [],
      });
    },
  );
});

describe('snapshot status semantics', () => {
  it('returns ready with empty arrays for successful empty discovery', async () => {
    discover.mockResolvedValue({ imageRefs: [], complete: true, usable: true });
    const { server } = await startConnector({
      quayDiscovery: { organization: 'empty-org', tag: 'v1' },
    });
    const response = await request(server)
      .get('/api/skill-image-connector/skills/default')
      .set('Authorization', mockCredentials.service.header());
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ready');
    expect(response.body.skills).toEqual([]);
    expect(response.body.failedSkillKeys).toEqual([]);
    expect(response.body.observedAt).not.toBeNull();
  });

  it('returns ready when all discovered images are confirmed non-skills', async () => {
    discover.mockResolvedValue({
      imageRefs: ['quay.io/org/container:v1'],
      complete: true,
      usable: true,
    });
    fetchImage.mockRejectedValue(new NonSkillImageError('not a skill'));
    const { server } = await startConnector({
      quayDiscovery: { organization: 'org', tag: 'v1' },
    });
    const response = await request(server)
      .get('/api/skill-image-connector/skills/default')
      .set('Authorization', mockCredentials.service.header());
    expect(response.status).toBe(200);
    // Confirmed non-skills do not make discovery incomplete
    expect(response.body.status).toBe('ready');
    expect(response.body.skills).toEqual([]);
    expect(response.body.failedSkillKeys).toEqual([]);
  });

  it('returns failed when discovery fails and no images are configured', async () => {
    discover.mockRejectedValue(new Error('Network error'));
    const { server } = await startConnector({
      quayDiscovery: { organization: 'org', tag: 'v1' },
    });
    const response = await request(server)
      .get('/api/skill-image-connector/skills/default')
      .set('Authorization', mockCredentials.service.header());
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('failed');
    expect(response.headers['x-skilldocs-revision']).toMatch(/^[1-9][0-9]*$/);
    expect(response.body.skills).toEqual([]);
    expect(response.body.observedAt).not.toBeNull();
  });

  it('returns partial when one tag fails while others succeed', async () => {
    const goodRef = 'quay.io/org/good-skill:v1';
    const badRef = 'quay.io/org/bad-skill:v1';
    discover.mockResolvedValue({
      imageRefs: [goodRef, badRef],
      complete: true,
      usable: true,
    });
    fetchImage.mockImplementation(async ref => {
      if (ref === pinnedRef(badRef)) {
        throw new Error('Retrieval failed');
      }
      return { ...extracted };
    });
    const { server } = await startConnector({
      maxRetries: 0,
      quayDiscovery: { organization: 'org', tag: 'v1' },
    });
    const response = await request(server)
      .get('/api/skill-image-connector/skills/default')
      .set('Authorization', mockCredentials.service.header());
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('partial');
    // Has successful records
    expect(response.headers['x-skilldocs-revision']).toMatch(/^[1-9][0-9]*$/);
    expect(response.body.skills.length).toBeGreaterThanOrEqual(1);
    // Has failed key in stable format
    expect(response.body.failedSkillKeys).toContain('quay.io/org/bad-skill:v1');
    // Successful and failed keys are disjoint
    const successKeys = response.body.skills.map((r: { key: string }) => r.key);
    for (const fk of response.body.failedSkillKeys) {
      expect(successKeys).not.toContain(fk);
    }
  });

  it('uses stable <registry>/<repository>:<tag> format for failed keys', async () => {
    const imageRef = 'quay.io/org/skill:v1';
    fetchImage.mockRejectedValue(new Error('Fetch error'));
    const { server } = await startConnector({
      maxRetries: 0,
      images: [{ imageRef }],
    });
    const response = await request(server)
      .get('/api/skill-image-connector/skills/default')
      .set('Authorization', mockCredentials.service.header());
    expect(response.status).toBe(200);
    expect(response.body.failedSkillKeys).toContain(imageRef);
  });
});

describe('source configuration', () => {
  it('serves source-scoped snapshots with explicit source IDs', async () => {
    const { server } = await startTestBackend({
      features: [
        skillImageConnectorPlugin,
        mockServices.rootLogger.factory(),
        logger.factory,
        mockServices.scheduler.factory({
          includeInitialDelayedTasksOnStartup: true,
        }),
        mockServices.rootConfig.factory({
          data: {
            app: { baseUrl: 'http://localhost:3000' },
            backend: { baseUrl: 'http://localhost:7007' },
            skillImageConnector: {
              sources: [
                {
                  id: 'my-source',
                  allowedRegistries: ['quay.io'],
                  images: [{ imageRef: 'quay.io/org/skill:v1' }],
                },
              ],
            },
          },
        }),
      ],
    });
    const response = await request(server)
      .get('/api/skill-image-connector/skills/my-source')
      .set('Authorization', mockCredentials.service.header());
    expect(response.status).toBe(200);
    expect(response.body.source).toEqual({ id: 'my-source', type: 'oci' });

    // Default source should not exist when sources[] is used
    const notFound = await request(server)
      .get('/api/skill-image-connector/skills/default')
      .set('Authorization', mockCredentials.service.header());
    expect(notFound.status).toBe(404);
  });

  it('rejects duplicate source IDs', async () => {
    await expect(
      startTestBackend({
        features: [
          skillImageConnectorPlugin,
          mockServices.rootLogger.factory(),
          logger.factory,
          mockServices.scheduler.factory({
            includeInitialDelayedTasksOnStartup: true,
          }),
          mockServices.rootConfig.factory({
            data: {
              app: { baseUrl: 'http://localhost:3000' },
              backend: { baseUrl: 'http://localhost:7007' },
              skillImageConnector: {
                sources: [
                  {
                    id: 'same-id',
                    allowedRegistries: ['quay.io'],
                    images: [{ imageRef: 'quay.io/org/skill:v1' }],
                  },
                  {
                    id: 'same-id',
                    allowedRegistries: ['quay.io'],
                    images: [{ imageRef: 'quay.io/org/skill2:v1' }],
                  },
                ],
              },
            },
          }),
        ],
      }),
    ).rejects.toThrow("Duplicate source ID 'same-id'");
  });

  it('rejects sources without an id', async () => {
    await expect(
      startTestBackend({
        features: [
          skillImageConnectorPlugin,
          mockServices.rootLogger.factory(),
          logger.factory,
          mockServices.scheduler.factory({
            includeInitialDelayedTasksOnStartup: true,
          }),
          mockServices.rootConfig.factory({
            data: {
              app: { baseUrl: 'http://localhost:3000' },
              backend: { baseUrl: 'http://localhost:7007' },
              skillImageConnector: {
                sources: [
                  {
                    allowedRegistries: ['quay.io'],
                    images: [{ imageRef: 'quay.io/org/skill:v1' }],
                  },
                ],
              },
            },
          }),
        ],
      }),
    ).rejects.toThrow('id is required');
  });
});

describe('same-digest tag aliases', () => {
  it('keeps separate records for tags resolving to the same digest', async () => {
    const ref1 = 'quay.io/org/skill:latest';
    const ref2 = 'quay.io/org/skill:v1';
    discover.mockResolvedValue({
      imageRefs: [ref1, ref2],
      complete: true,
      usable: true,
    });
    // Both resolve to the same digest
    resolveManifest.mockResolvedValue({
      manifest: {
        schemaVersion: 2,
        config: {
          mediaType: 'application/vnd.oci.image.config.v1+json',
          digest: resolvedDigest,
          size: 0,
        },
        layers: [],
      },
      digest: resolvedDigest,
    });
    const { server } = await startConnector({
      quayDiscovery: { organization: 'org' },
    });
    const response = await request(server)
      .get('/api/skill-image-connector/skills/default')
      .set('Authorization', mockCredentials.service.header());
    expect(response.status).toBe(200);
    // Both extractions should be present (tags are separate records)
    const keys = response.body.skills.map((r: { key: string }) => r.key);
    // Two different keys for two different tags
    expect(keys).toHaveLength(2);
    expect(keys).toContain('quay.io/org/skill:latest');
    expect(keys).toContain('quay.io/org/skill:v1');
  });
});

describe('bare-digest policy', () => {
  it('reports partial when a bare-digest extraction exceeds the retained content budget', async () => {
    const digestRef = `quay.io/org/skill@${resolvedDigest}`;
    const { server } = await startConnector({
      images: [{ imageRef: digestRef }],
      maxAggregateContentSizeBytes: 1,
    });
    const response = await request(server)
      .get('/api/skill-image-connector/skills/default')
      .set('Authorization', mockCredentials.service.header());
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('partial');
    expect(response.body.skills).toEqual([]);
    expect(response.body.failedSkillKeys).toEqual([]);
    expect(validateSnapshot(response.body)).toEqual({
      valid: true,
      errors: [],
    });
    const raw = await request(server)
      .get('/api/skill-image-connector/images')
      .set('Authorization', mockCredentials.user.header());
    expect(raw.body.images).toEqual([]);
    expect(raw.body.failedImages).toEqual([digestRef]);
    expect(cleanupSkillImageExtraction).toHaveBeenCalledTimes(1);
  });

  it('excludes bare-digest references from normalized snapshots', async () => {
    // Bare-digest ref: no tag, so no acquisition metadata
    const digestRef = `quay.io/org/skill@${resolvedDigest}`;
    fetchImage.mockImplementation(async () => ({
      ...extracted,
      // No acquisition metadata for bare-digest refs
    }));
    const { server } = await startConnector({
      images: [{ imageRef: digestRef }],
    });
    const response = await request(server)
      .get('/api/skill-image-connector/skills/default')
      .set('Authorization', mockCredentials.service.header());
    expect(response.status).toBe(200);
    // Bare-digest refs should not appear in normalized snapshot
    // Their exclusion is a deliberate policy, not a failure
    expect(response.body.skills).toEqual([]);
    expect(response.body.failedSkillKeys).toEqual([]);
    // But they should still appear in /images for raw compat
    const imagesResponse = await request(server)
      .get('/api/skill-image-connector/images')
      .set('Authorization', mockCredentials.user.header());
    expect(imagesResponse.body.images).toHaveLength(1);
  });
});

describe('controlled refresh lifecycle', () => {
  type Task = Parameters<SchedulerService['scheduleTask']>[0];
  async function startScheduled(settings: ConnectorTestConfig) {
    const tasks: Task[] = [];
    const scheduler = mockServices.scheduler.mock({
      scheduleTask: async task => {
        tasks.push(task);
      },
    });
    const backend = await startSharedConnector(
      settings,
      logger,
      skillImageConnectorPlugin,
      scheduler.factory,
    );
    return { server: backend.server, tasks, stop: () => backend.stop() };
  }

  it('revisions partial observations without allowing cleanup and preserves identical acknowledgment retries', async () => {
    const { server, tasks, stop } = await startScheduled({
      maxRetries: 0,
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const authorization = mockCredentials.service.header({
      onBehalfOf: mockCredentials.service('plugin:catalog'),
      targetPluginId: 'skill-image-connector',
    });
    const get = () =>
      request(server)
        .get('/api/skill-image-connector/skills/default')
        .set('Authorization', authorization);
    const acknowledge = (revision: string) =>
      request(server)
        .post('/api/skill-image-connector/skilldocs/default/reconcile')
        .set('Authorization', authorization)
        .send({ revision, retainedDigests: [] });
    try {
      await tasks[0].fn(new AbortController().signal);
      const ready = await get();
      expect(ready.body.status).toBe('ready');
      const readyRevision = ready.headers['x-skilldocs-revision'];
      expect((await acknowledge(readyRevision)).status).toBe(204);

      fetchImage.mockRejectedValueOnce(
        new Error('temporary acquisition failure'),
      );
      await tasks[0].fn(new AbortController().signal);
      const partial = await get();
      expect(partial.body.status).toBe('partial');
      const partialRevision = partial.headers['x-skilldocs-revision'];
      expect(BigInt(partialRevision)).toBeGreaterThan(BigInt(readyRevision));
      expect((await acknowledge(partialRevision)).status).toBe(409);
      expect((await acknowledge(readyRevision)).status).toBe(204);

      const documentation = await request(server)
        .get(
          `/api/skill-image-connector/skilldocs/default/${ready.body.skills[0].digest}`,
        )
        .set('Authorization', authorization);
      expect(documentation.status).toBe(200);
      expect(documentation.text).toBe(extracted.skillsMd);
    } finally {
      await stop();
    }
  });
  it('keeps overlapping source acquisitions independent during refresh and shutdown', async () => {
    const imageRef = 'quay.io/org/shared:v1';
    const a1 = {
      ...extracted,
      skillsMd: '# A first',
      skillImageYamlPath: '/a1/skillimage.yaml',
      skillsMdPath: '/a1/SKILL.md',
    };
    const b1 = {
      ...extracted,
      skillsMd: '# B first',
      skillImageYamlPath: '/b1/skillimage.yaml',
      skillsMdPath: '/b1/SKILL.md',
    };
    const a2 = {
      ...extracted,
      skillsMd: '# A second',
      skillImageYamlPath: '/a2/skillimage.yaml',
      skillsMdPath: '/a2/SKILL.md',
    };
    fetchImage
      .mockResolvedValueOnce(a1)
      .mockResolvedValueOnce(b1)
      .mockResolvedValueOnce(a2)
      .mockRejectedValueOnce(new Error('B unavailable'));
    const { server, tasks, stop } = await startScheduled({
      maxRetries: 0,
      sources: [
        { id: 'a', allowedRegistries: ['quay.io'], images: [{ imageRef }] },
        { id: 'b', allowedRegistries: ['quay.io'], images: [{ imageRef }] },
      ],
    });
    const raw = () =>
      request(server)
        .get('/api/skill-image-connector/images')
        .set('Authorization', mockCredentials.user.header());
    try {
      await tasks[0].fn(new AbortController().signal);
      await tasks[1].fn(new AbortController().signal);
      await tasks[0].fn(new AbortController().signal);
      const cleaned = jest
        .mocked(cleanupSkillImageExtraction)
        .mock.calls.map(([value]) => value.skillsMd);
      expect(cleaned).toEqual(['# A first']);
      const first = await raw();
      expect(first.body.images).toEqual([
        {
          imageRef,
          skillImageYaml: extracted.skillImageYaml,
          skillsMd: '# A second',
        },
      ]);
      await tasks[1].fn(new AbortController().signal);
      const second = await raw();
      expect(second.body.images).toEqual(first.body.images);
      expect(second.body.failedImages).toEqual([]);
      expect(
        jest
          .mocked(cleanupSkillImageExtraction)
          .mock.calls.map(([value]) => value.skillsMd),
      ).toEqual(['# A first', '# B first']);
    } finally {
      await stop();
    }
    expect(
      jest
        .mocked(cleanupSkillImageExtraction)
        .mock.calls.map(([value]) => value.skillsMd),
    ).toEqual(['# A first', '# B first', '# A second']);
  });

  it('cleans up each source extraction on shutdown even when its image ref is deduplicated', async () => {
    const imageRef = 'quay.io/org/shared:v1';
    fetchImage
      .mockResolvedValueOnce({ ...extracted, skillsMd: '# A' })
      .mockResolvedValueOnce({ ...extracted, skillsMd: '# B' });
    const { server, tasks, stop } = await startScheduled({
      sources: [
        { id: 'a', allowedRegistries: ['quay.io'], images: [{ imageRef }] },
        { id: 'b', allowedRegistries: ['quay.io'], images: [{ imageRef }] },
      ],
    });
    try {
      await tasks[0].fn(new AbortController().signal);
      await tasks[1].fn(new AbortController().signal);
      const response = await request(server)
        .get('/api/skill-image-connector/images')
        .set('Authorization', mockCredentials.user.header());
      expect(response.body.images).toHaveLength(1);
      expect(response.body.images[0].skillsMd).toBe('# A');
    } finally {
      await stop();
    }
    expect(
      jest
        .mocked(cleanupSkillImageExtraction)
        .mock.calls.map(([value]) => value.skillsMd)
        .sort(),
    ).toEqual(['# A', '# B']);
  });

  it('registers the default local startup and periodic schedule', async () => {
    const { tasks, stop } = await startScheduled({
      allowedRegistries: ['quay.io'],
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    try {
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toMatchObject({
        frequency: { minutes: 10 },
        timeout: { milliseconds: 600000 },
        initialDelay: { seconds: 0 },
        scope: 'local',
      });
    } finally {
      await stop();
    }
  });

  it('passes standard cron, timeout and initial delay settings to Backstage', async () => {
    const { tasks, stop } = await startScheduled({
      allowedRegistries: ['quay.io'],
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
      schedule: {
        frequency: { cron: '*/5 * * * *' },
        timeout: { minutes: 3 },
        initialDelay: { seconds: 20 },
      },
    });
    try {
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toMatchObject({
        frequency: { cron: '*/5 * * * *' },
        timeout: { minutes: 3 },
        initialDelay: { seconds: 20 },
        scope: 'local',
      });
      expect(fetchImage).not.toHaveBeenCalled();
      await tasks[0].fn(new AbortController().signal);
      expect(fetchImage).toHaveBeenCalledTimes(1);
    } finally {
      await stop();
    }
  });

  it('serves loading, then atomically replaces the previous snapshot on a later refresh', async () => {
    const { server, tasks, stop } = await startScheduled({
      allowedRegistries: ['quay.io'],
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
      schedule: {
        frequency: { minutes: 15 },
        timeout: { minutes: 10 },
        initialDelay: { seconds: 0 },
      },
    });
    const get = () =>
      request(server)
        .get('/api/skill-image-connector/skills/default')
        .set('Authorization', mockCredentials.service.header());
    let release: () => void = () => undefined;
    try {
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toMatchObject({
        frequency: { minutes: 15 },
        initialDelay: { seconds: 0 },
        scope: 'local',
      });
      const loading = await get();
      expect(loading.body).toMatchObject({
        status: 'loading',
        observedAt: null,
        skills: [],
        failedSkillKeys: [],
      });
      await tasks[0].fn(new AbortController().signal);
      const first = await get();
      expect(first.body.status).toBe('ready');
      expect(first.body.skills).toHaveLength(1);
      let entered: () => void = () => undefined;
      const started = new Promise<void>(resolve => {
        entered = resolve;
      });
      const gate = new Promise<void>(resolve => {
        release = resolve;
      });
      fetchImage.mockImplementation(async () => {
        entered();
        await gate;
        return {
          ...extracted,
          skillImageYaml: extracted.skillImageYaml.replace(
            'Test Skill',
            'Updated Skill',
          ),
        };
      });
      const running = tasks[0].fn(new AbortController().signal);
      await started;
      try {
        const during = await get();
        expect(during.body).toEqual(first.body);
        const raw = await request(server)
          .get('/api/skill-image-connector/images')
          .set('Authorization', mockCredentials.user.header());
        expect(raw.body.status).toBe('ready');
        expect(raw.body.images[0].skillImageYaml).toBe(
          extracted.skillImageYaml,
        );
      } finally {
        release();
        await running;
      }
      const updated = await get();
      expect(updated.body.status).toBe('ready');
      expect(updated.body.skills[0].name).toBe('Updated Skill');
      expect(validateSnapshot(updated.body)).toEqual({
        valid: true,
        errors: [],
      });
    } finally {
      release();
      await stop();
    }
  });
  it('passes isolated source origin settings and lets a second source finish while the first is pending', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    let entered: () => void = () => undefined;
    const started = new Promise<void>(resolve => {
      entered = resolve;
    });
    fetchImage.mockImplementation(async ref => {
      if (ref.includes('/first:')) {
        entered();
        await gate;
      }
      return { ...extracted };
    });
    const { server, tasks, stop } = await startScheduled({
      allowedOrigins: ['https://global.example.com'],
      sources: [
        {
          id: 'first',
          allowedRegistries: ['quay.io'],
          allowedOrigins: ['https://first.example.com'],
          images: [{ imageRef: 'quay.io/org/first:v1' }],
        },
        {
          id: 'second',
          allowedRegistries: ['quay.io'],
          allowedOrigins: ['https://second.example.com'],
          images: [{ imageRef: 'quay.io/org/second:v1' }],
        },
      ],
    });
    const running = tasks[0].fn(new AbortController().signal);
    try {
      await started;
      await tasks[1].fn(new AbortController().signal);
      const second = await request(server)
        .get('/api/skill-image-connector/skills/second')
        .set('Authorization', mockCredentials.service.header());
      expect(second.body.status).toBe('ready');
      const first = await request(server)
        .get('/api/skill-image-connector/skills/first')
        .set('Authorization', mockCredentials.service.header());
      expect(first.body.status).toBe('loading');
      const options = fetchImage.mock.calls.map(call => call[5]);
      expect(options.map(option => option?.allowedOrigins)).toEqual([
        ['https://first.example.com'],
        ['https://second.example.com'],
      ]);
      expect(options.every(Object.isFrozen)).toBe(true);
    } finally {
      release();
      await running;
      await stop();
    }
  });
});

describe('incomplete discovery publication', () => {
  it.each([{ imageRefs: [] }, { imageRefs: ['quay.io/org/skill:v1'] }])(
    'publishes partial with retained candidates $imageRefs',
    async ({ imageRefs }) => {
      discover.mockResolvedValue({ imageRefs, complete: false, usable: true });
      const { server } = await startConnector({
        quayDiscovery: { organization: 'org' },
      });
      const response = await request(server)
        .get('/api/skill-image-connector/skills/default')
        .set('Authorization', mockCredentials.service.header());
      expect(response.body.status).toBe('partial');
      expect(response.body.skills).toHaveLength(imageRefs.length);
      expect(validateSnapshot(response.body)).toEqual({
        valid: true,
        errors: [],
      });
    },
  );
});
