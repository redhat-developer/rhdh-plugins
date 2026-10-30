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

/**
 * OCI skill TechDocs lifecycle tests — task 6.5.
 *
 * Covers independent multi-image storage, moving tag documentation
 * updates, same-digest alias documentation sharing, partial refresh
 * content retention, admission exhaustion, independent retention
 * settings, inventory-drain recovery, publication/cleanup races,
 * ETag and conditional requests, source isolation, provider outage
 * content retention, reconcile body validation, and revision header
 * presence.
 */

import type {
  BackendFeature,
  SchedulerService,
} from '@backstage/backend-plugin-api';
import {
  coreServices,
  createServiceFactory,
} from '@backstage/backend-plugin-api';
import { mockCredentials, mockServices } from '@backstage/backend-test-utils';
import request from 'supertest';
import type { ConnectorTestConfig } from './testUtils';
import {
  resolvedDigest,
  startConnector as sharedStartConnector,
} from './testUtils';
import { skillImageConnectorPlugin } from './plugin';
import { discoverQuayRepositorySnapshot } from './services/QuayDiscovery';
import {
  cleanupSkillImageExtraction,
  fetchAndExtractSkillImage,
} from './services/SkillImageService';
import { fetchManifest } from './services/OciClient';
import { MAX_RETAINED_DIGESTS } from './services/types';

const mockContentStores: Array<import('./services/ContentStore').ContentStore> =
  [];
function getContentStore() {
  return mockContentStores[mockContentStores.length - 1];
}

// Mock the ContentStore so that initialize() always operates in-memory,
// bypassing the better-sqlite3 native dependency required by durable mode.
jest.mock('./services/ContentStore', () => {
  const actual = jest.requireActual<typeof import('./services/ContentStore')>(
    './services/ContentStore',
  );
  return {
    ...actual,
    ContentStore: class extends actual.ContentStore {
      // Override initialize to always run in-memory mode
      async initialize(): Promise<void> {
        mockContentStores.push(this);
        return super.initialize();
      }
    },
  };
});

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

const skillYaml = `metadata:\n  display-name: Test Skill\n  name: test-skill\n  description: A test\nspec:\n  prompt: Do things`;
const extracted = {
  skillImageYaml: skillYaml,
  skillsMd: '# Test Skill\nDocumentation content',
  skillImageYamlPath: '/unused/skillimage.yaml',
  skillsMdPath: '/unused/SKILLS.md',
};

beforeEach(() => {
  mockContentStores.length = 0;
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

/**
 * A no-op database factory that satisfies the coreServices.database
 * dependency without requiring better-sqlite3 native bindings.
 * The ContentStore mock overrides initialize() to skip the database
 * argument, so this factory is never actually used for queries.
 */
const noOpDatabaseFactory = createServiceFactory({
  service: coreServices.database,
  deps: {},
  factory() {
    return {
      getClient: async () => {
        throw new Error('no-op database: should not be called');
      },
      migrations: { skip: true },
    };
  },
});

/**
 * Start a connector test backend with the ContentStore mock active.
 * Delegates to the shared startConnector, injecting noOpDatabaseFactory
 * via the extraFeatures parameter.
 */
function startConnector(
  settings: ConnectorTestConfig,
  scheduler: BackendFeature = mockServices.scheduler.factory({
    includeInitialDelayedTasksOnStartup: true,
  }),
) {
  return sharedStartConnector(
    settings,
    logger,
    skillImageConnectorPlugin,
    scheduler,
    [noOpDatabaseFactory],
  );
}

type Task = Parameters<SchedulerService['scheduleTask']>[0];

/**
 * Start a connector backend with a mock scheduler that captures scheduled
 * tasks, and return a base URL suitable for supertest.
 *
 * The Backstage test backend binds on IPv6 `::` by default. Supertest's
 * `request(server)` hardcodes `127.0.0.1`, which fails in IPv6-only
 * environments. We use a URL string with `localhost` instead.
 */
async function startScheduled(settings: ConnectorTestConfig) {
  const tasks: Task[] = [];
  const scheduler = mockServices.scheduler.mock({
    scheduleTask: async task => {
      tasks.push(task);
    },
  });
  const backend = await startConnector(settings, scheduler.factory);
  const addr = backend.server.address() as { port: number };
  const baseUrl = `http://localhost:${addr.port}`;
  return { baseUrl, tasks, stop: () => backend.stop() };
}

function serviceAuth() {
  return mockCredentials.service.header({
    onBehalfOf: mockCredentials.service('plugin:catalog'),
    targetPluginId: 'skill-image-connector',
  });
}

describe('multi-image documentation storage and retrieval', () => {
  it('stores and serves documentation independently for images with different digests', async () => {
    const annotatedMd = '# First skill\nFirst image documentation';
    const tarMd = '# Second skill\nSecond image documentation';
    fetchImage.mockImplementation(async imageRef => ({
      ...extracted,
      skillsMd: imageRef.includes('/annotated-skill:') ? annotatedMd : tarMd,
    }));

    const digest2 = `sha256:${'b'.repeat(64)}`;
    resolveManifest
      .mockResolvedValueOnce({
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
      })
      .mockResolvedValueOnce({
        manifest: {
          schemaVersion: 2,
          config: {
            mediaType: 'application/vnd.oci.image.config.v1+json',
            digest: digest2,
            size: 0,
          },
          layers: [],
        },
        digest: digest2,
      });

    const { baseUrl, tasks, stop } = await startScheduled({
      maxRetries: 0,
      images: [
        { imageRef: 'quay.io/org/annotated-skill:v1' },
        { imageRef: 'quay.io/org/tar-skill:v1' },
      ],
    });
    const authorization = serviceAuth();
    try {
      await tasks[0].fn(new AbortController().signal);

      const snapshot = await request(baseUrl)
        .get('/api/skill-image-connector/skills/default')
        .set('Authorization', authorization);
      expect(snapshot.body.status).toBe('ready');
      expect(snapshot.body.skills).toHaveLength(2);

      const doc1 = await request(baseUrl)
        .get(`/api/skill-image-connector/skilldocs/default/${resolvedDigest}`)
        .set('Authorization', authorization);
      expect(doc1.status).toBe(200);
      expect(doc1.text).toBe(annotatedMd);

      const doc2 = await request(baseUrl)
        .get(`/api/skill-image-connector/skilldocs/default/${digest2}`)
        .set('Authorization', authorization);
      expect(doc2.status).toBe(200);
      expect(doc2.text).toBe(tarMd);

      expect(doc1.text).not.toBe(doc2.text);
    } finally {
      await stop();
    }
  });
});

describe('moving tag updating TechDocs documentation', () => {
  it('serves updated documentation when a tag moves to a new digest', async () => {
    const oldDigest = resolvedDigest;
    const newDigest = `sha256:${'c'.repeat(64)}`;

    const { baseUrl, tasks, stop } = await startScheduled({
      maxRetries: 0,
      images: [{ imageRef: 'quay.io/org/skill:latest' }],
    });
    const authorization = serviceAuth();

    try {
      // First refresh: old digest
      await tasks[0].fn(new AbortController().signal);

      const oldDoc = await request(baseUrl)
        .get(`/api/skill-image-connector/skilldocs/default/${oldDigest}`)
        .set('Authorization', authorization);
      expect(oldDoc.status).toBe(200);
      expect(oldDoc.text).toBe(extracted.skillsMd);

      // Acknowledge the first revision
      const snapshot1 = await request(baseUrl)
        .get('/api/skill-image-connector/skills/default')
        .set('Authorization', authorization);
      const rev1 = snapshot1.headers['x-skilldocs-revision'];
      await request(baseUrl)
        .post('/api/skill-image-connector/skilldocs/default/reconcile')
        .set('Authorization', authorization)
        .send({ revision: rev1, retainedDigests: [oldDigest] });

      // Tag moves: new digest, new content
      const updatedMd = '# Updated Skill\nNew documentation';
      fetchImage.mockImplementation(async () => ({
        ...extracted,
        skillsMd: updatedMd,
      }));
      resolveManifest.mockResolvedValue({
        manifest: {
          schemaVersion: 2,
          config: {
            mediaType: 'application/vnd.oci.image.config.v1+json',
            digest: newDigest,
            size: 0,
          },
          layers: [],
        },
        digest: newDigest,
      });

      // Second refresh
      await tasks[0].fn(new AbortController().signal);

      const newDoc = await request(baseUrl)
        .get(`/api/skill-image-connector/skilldocs/default/${newDigest}`)
        .set('Authorization', authorization);
      expect(newDoc.status).toBe(200);
      expect(newDoc.text).toBe(updatedMd);

      // Old content is still served until cleanup
      const oldDocStill = await request(baseUrl)
        .get(`/api/skill-image-connector/skilldocs/default/${oldDigest}`)
        .set('Authorization', authorization);
      expect(oldDocStill.status).toBe(200);

      // Acknowledge new revision retaining only the new digest
      const snapshot2 = await request(baseUrl)
        .get('/api/skill-image-connector/skills/default')
        .set('Authorization', authorization);
      const rev2 = snapshot2.headers['x-skilldocs-revision'];
      await request(baseUrl)
        .post('/api/skill-image-connector/skilldocs/default/reconcile')
        .set('Authorization', authorization)
        .send({ revision: rev2, retainedDigests: [newDigest] });

      // Old content is now cleaned up
      const oldDocGone = await request(baseUrl)
        .get(`/api/skill-image-connector/skilldocs/default/${oldDigest}`)
        .set('Authorization', authorization);
      expect(oldDocGone.status).toBe(404);
    } finally {
      await stop();
    }
  });
});

describe('same-digest aliases sharing documentation', () => {
  it('serves the same Markdown for multiple tags sharing a digest', async () => {
    discover.mockResolvedValue({
      imageRefs: ['quay.io/org/skill:latest', 'quay.io/org/skill:v1'],
      complete: true,
      usable: true,
    });

    const { baseUrl, tasks, stop } = await startScheduled({
      maxRetries: 0,
      quayDiscovery: { organization: 'org' },
    });
    const authorization = serviceAuth();

    try {
      await tasks[0].fn(new AbortController().signal);

      const snapshot = await request(baseUrl)
        .get('/api/skill-image-connector/skills/default')
        .set('Authorization', authorization);
      expect(snapshot.body.status).toBe('ready');
      expect(snapshot.body.skills).toHaveLength(2);

      const digests = snapshot.body.skills.map(
        (s: { digest: string }) => s.digest,
      );
      expect(digests[0]).toBe(digests[1]);

      const doc = await request(baseUrl)
        .get(`/api/skill-image-connector/skilldocs/default/${resolvedDigest}`)
        .set('Authorization', authorization);
      expect(doc.status).toBe(200);
      expect(doc.text).toBe(extracted.skillsMd);
      expect(doc.headers.etag).toBe(`"${resolvedDigest}"`);
    } finally {
      await stop();
    }
  });
});

describe('partial refresh content retention', () => {
  it('retains content from previous refresh when some images fail', async () => {
    const { baseUrl, tasks, stop } = await startScheduled({
      maxRetries: 0,
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const authorization = serviceAuth();

    try {
      await tasks[0].fn(new AbortController().signal);
      const snapshot1 = await request(baseUrl)
        .get('/api/skill-image-connector/skills/default')
        .set('Authorization', authorization);
      expect(snapshot1.body.status).toBe('ready');
      const digest = snapshot1.body.skills[0].digest;

      const doc1 = await request(baseUrl)
        .get(`/api/skill-image-connector/skilldocs/default/${digest}`)
        .set('Authorization', authorization);
      expect(doc1.status).toBe(200);

      // Second refresh: failure
      fetchImage.mockRejectedValueOnce(new Error('temporary failure'));
      await tasks[0].fn(new AbortController().signal);

      const snapshot2 = await request(baseUrl)
        .get('/api/skill-image-connector/skills/default')
        .set('Authorization', authorization);
      expect(snapshot2.body.status).toBe('partial');

      // Content from the successful refresh is still available
      const doc2 = await request(baseUrl)
        .get(`/api/skill-image-connector/skilldocs/default/${digest}`)
        .set('Authorization', authorization);
      expect(doc2.status).toBe(200);
      expect(doc2.text).toBe(extracted.skillsMd);
    } finally {
      await stop();
    }
  });
});

describe('admission exhaustion across repeated partial refreshes', () => {
  it('rejects new content when retained bytes exhaust the budget', async () => {
    const digest2 = `sha256:${'d'.repeat(64)}`;
    resolveManifest.mockImplementation(async imageRef => ({
      manifest: {
        schemaVersion: 2,
        config: {
          mediaType: 'application/vnd.oci.image.config.v1+json',
          digest: resolvedDigest,
          size: 0,
        },
        layers: [],
      },
      digest: imageRef.repository.endsWith('/first') ? resolvedDigest : digest2,
    }));

    const longContent = 'x'.repeat(40);
    fetchImage.mockImplementation(async () => ({
      ...extracted,
      skillsMd: longContent,
    }));

    const { baseUrl, tasks, stop } = await startScheduled({
      maxRetries: 0,
      maxRetainedMarkdownSizeBytes: 50,
      images: [
        { imageRef: 'quay.io/org/first:v1' },
        { imageRef: 'quay.io/org/second:v1' },
      ],
    });
    const authorization = serviceAuth();

    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        await tasks[0].fn(new AbortController().signal);

        const snapshot = await request(baseUrl)
          .get('/api/skill-image-connector/skills/default')
          .set('Authorization', authorization);
        expect(snapshot.body.status).toBe('partial');
        expect(snapshot.body.skills).toHaveLength(1);

        const admitted = snapshot.body.skills[0];
        const doc = await request(baseUrl)
          .get(
            `/api/skill-image-connector/skilldocs/default/${admitted.digest}`,
          )
          .set('Authorization', authorization);
        expect(doc.status).toBe(200);
        expect(doc.text).toBe(longContent);

        expect(await getContentStore().getSourceStats('default')).toMatchObject(
          {
            digestCount: 1,
            totalBytes: 40,
          },
        );
      }

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Content admission rejected'),
      );
    } finally {
      await stop();
    }
  });
});

describe('independent extraction and retention settings', () => {
  it('uses separate byte budgets for extraction and retention', async () => {
    const bigContent = 'x'.repeat(50);
    fetchImage.mockImplementation(async () => ({
      ...extracted,
      skillsMd: bigContent,
    }));

    const { baseUrl, tasks, stop } = await startScheduled({
      maxRetries: 0,
      maxAggregateContentSizeBytes: 100_000,
      maxRetainedMarkdownSizeBytes: 30,
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const authorization = serviceAuth();

    try {
      await tasks[0].fn(new AbortController().signal);

      const snapshot = await request(baseUrl)
        .get('/api/skill-image-connector/skills/default')
        .set('Authorization', authorization);
      expect(snapshot.body.status).toBe('partial');

      // Content is still accessible from the in-memory extraction map
      // even though ContentStore admission rejected it — extraction and
      // retention budgets are independent.
      const doc = await request(baseUrl)
        .get(`/api/skill-image-connector/skilldocs/default/${resolvedDigest}`)
        .set('Authorization', authorization);
      expect(doc.status).toBe(200);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Content admission rejected'),
      );
    } finally {
      await stop();
    }
  });
});

describe('default and invalid retention values', () => {
  it('uses the default when maxRetainedMarkdownSizeBytes is not set', async () => {
    const { baseUrl, tasks, stop } = await startScheduled({
      maxRetries: 0,
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const authorization = serviceAuth();
    try {
      await tasks[0].fn(new AbortController().signal);
      const snapshot = await request(baseUrl)
        .get('/api/skill-image-connector/skills/default')
        .set('Authorization', authorization);
      expect(snapshot.body.status).toBe('ready');
      expect(snapshot.body.skills).toHaveLength(1);
    } finally {
      await stop();
    }
  });

  it('rejects zero maxRetainedMarkdownSizeBytes', async () => {
    await expect(
      startConnector({
        maxRetainedMarkdownSizeBytes: 0,
        images: [{ imageRef: 'quay.io/org/skill:v1' }],
      }),
    ).rejects.toThrow('must be a positive safe integer');
  });

  it('rejects negative maxRetainedMarkdownSizeBytes', async () => {
    await expect(
      startConnector({
        maxRetainedMarkdownSizeBytes: -1,
        images: [{ imageRef: 'quay.io/org/skill:v1' }],
      }),
    ).rejects.toThrow('must be a positive safe integer');
  });

  it('rejects non-integer maxRetainedMarkdownSizeBytes', async () => {
    await expect(
      startConnector({
        maxRetainedMarkdownSizeBytes: 1.5,
        images: [{ imageRef: 'quay.io/org/skill:v1' }],
      }),
    ).rejects.toThrow('must be a positive safe integer');
  });
});

describe('controlled inventory-drain from the actual digest ceiling', () => {
  it('rejects repeated new admissions at 1000 digests and recovers after a retained-only drain', async () => {
    const { baseUrl, tasks, stop } = await startScheduled({
      maxRetries: 0,
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const authorization = serviceAuth();
    const docUrl = (digest: string) =>
      `/api/skill-image-connector/skilldocs/default/${digest}`;
    const manifest = (digest: string) => ({
      manifest: {
        schemaVersion: 2 as const,
        config: {
          mediaType: 'application/vnd.oci.image.config.v1+json',
          digest,
          size: 0,
        },
        layers: [],
      },
      digest,
    });
    try {
      await tasks[0].fn(new AbortController().signal);
      // Seed real retained entries representing earlier refreshes, without mocking statistics or the ceiling.
      for (let i = 1; i < MAX_RETAINED_DIGESTS; i++) {
        await getContentStore().store(
          'default',
          `sha256:${i.toString(16).padStart(64, '0')}`,
          '# retained',
        );
      }
      expect(
        (await getContentStore().getSourceStats('default')).digestCount,
      ).toBe(1000);
      const replacement = `sha256:${'e'.repeat(64)}`;
      resolveManifest.mockResolvedValue(manifest(replacement));
      for (let i = 0; i < 3; i++) {
        await tasks[0].fn(new AbortController().signal);
        const snapshot = await request(baseUrl)
          .get('/api/skill-image-connector/skills/default')
          .set('Authorization', authorization);
        expect(snapshot.body.status).toBe('partial');
        expect(snapshot.body.skills).toEqual([]);
        expect(
          (await getContentStore().getSourceStats('default')).digestCount,
        ).toBe(1000);
        expect(
          await getContentStore().get('default', replacement),
        ).toBeUndefined();
        expect(
          (
            await request(baseUrl)
              .get(docUrl(resolvedDigest))
              .set('Authorization', authorization)
          ).status,
        ).toBe(200);
      }
      // Keep the same source enabled, return to retained-only input, then acknowledge that ready inventory.
      resolveManifest.mockResolvedValue(manifest(resolvedDigest));
      await tasks[0].fn(new AbortController().signal);
      const drained = await request(baseUrl)
        .get('/api/skill-image-connector/skills/default')
        .set('Authorization', authorization);
      expect(drained.body.status).toBe('ready');
      const ack = await request(baseUrl)
        .post('/api/skill-image-connector/skilldocs/default/reconcile')
        .set('Authorization', authorization)
        .send({
          revision: drained.headers['x-skilldocs-revision'],
          retainedDigests: [resolvedDigest],
        });
      expect(ack.status).toBe(204);
      expect(
        (await getContentStore().getSourceStats('default')).digestCount,
      ).toBe(1);
      expect(
        (
          await request(baseUrl)
            .get(docUrl(resolvedDigest))
            .set('Authorization', authorization)
        ).status,
      ).toBe(200);
      resolveManifest.mockResolvedValue(manifest(replacement));
      await tasks[0].fn(new AbortController().signal);
      const recovered = await request(baseUrl)
        .get('/api/skill-image-connector/skills/default')
        .set('Authorization', authorization);
      expect(recovered.body.status).toBe('ready');
      expect(recovered.body.skills[0].digest).toBe(replacement);
      expect(
        (await getContentStore().getSourceStats('default')).digestCount,
      ).toBe(2);
    } finally {
      await stop();
    }
  });
});

describe('acknowledgment authorization, superseded revisions, and idempotency', () => {
  it('rejects unauthorized callers', async () => {
    const { baseUrl, tasks, stop } = await startScheduled({
      maxRetries: 0,
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    try {
      await tasks[0].fn(new AbortController().signal);

      const unauthorized = await request(baseUrl)
        .post('/api/skill-image-connector/skilldocs/default/reconcile')
        .set('Authorization', mockCredentials.user.header())
        .send({ revision: '1', retainedDigests: [] });
      expect(unauthorized.status).toBe(403);
    } finally {
      await stop();
    }
  });

  it('rejects callers from wrong plugin', async () => {
    const { baseUrl, tasks, stop } = await startScheduled({
      maxRetries: 0,
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    try {
      await tasks[0].fn(new AbortController().signal);

      const wrongPlugin = await request(baseUrl)
        .post('/api/skill-image-connector/skilldocs/default/reconcile')
        .set(
          'Authorization',
          mockCredentials.service.header({
            onBehalfOf: mockCredentials.service('plugin:wrong-plugin'),
            targetPluginId: 'skill-image-connector',
          }),
        )
        .send({ revision: '1', retainedDigests: [] });
      expect(wrongPlugin.status).toBe(403);
    } finally {
      await stop();
    }
  });

  it('returns 409 for superseded revisions', async () => {
    const { baseUrl, tasks, stop } = await startScheduled({
      maxRetries: 0,
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const authorization = serviceAuth();

    try {
      await tasks[0].fn(new AbortController().signal);
      const snap1 = await request(baseUrl)
        .get('/api/skill-image-connector/skills/default')
        .set('Authorization', authorization);
      const rev1 = snap1.headers['x-skilldocs-revision'];

      await tasks[0].fn(new AbortController().signal);
      const snap2 = await request(baseUrl)
        .get('/api/skill-image-connector/skills/default')
        .set('Authorization', authorization);
      const rev2 = snap2.headers['x-skilldocs-revision'];
      expect(BigInt(rev2)).toBeGreaterThan(BigInt(rev1));

      const ack2 = await request(baseUrl)
        .post('/api/skill-image-connector/skilldocs/default/reconcile')
        .set('Authorization', authorization)
        .send({ revision: rev2, retainedDigests: [] });
      expect(ack2.status).toBe(204);

      const ack1 = await request(baseUrl)
        .post('/api/skill-image-connector/skilldocs/default/reconcile')
        .set('Authorization', authorization)
        .send({ revision: rev1, retainedDigests: [] });
      expect(ack1.status).toBe(409);
    } finally {
      await stop();
    }
  });

  it('preserves idempotent retry for the same revision and retain set', async () => {
    const { baseUrl, tasks, stop } = await startScheduled({
      maxRetries: 0,
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const authorization = serviceAuth();

    try {
      await tasks[0].fn(new AbortController().signal);
      const snap = await request(baseUrl)
        .get('/api/skill-image-connector/skills/default')
        .set('Authorization', authorization);
      const revision = snap.headers['x-skilldocs-revision'];

      const ack1 = await request(baseUrl)
        .post('/api/skill-image-connector/skilldocs/default/reconcile')
        .set('Authorization', authorization)
        .send({ revision, retainedDigests: [resolvedDigest] });
      expect(ack1.status).toBe(204);

      const ack2 = await request(baseUrl)
        .post('/api/skill-image-connector/skilldocs/default/reconcile')
        .set('Authorization', authorization)
        .send({ revision, retainedDigests: [resolvedDigest] });
      expect(ack2.status).toBe(204);

      const doc = await request(baseUrl)
        .get(`/api/skill-image-connector/skilldocs/default/${resolvedDigest}`)
        .set('Authorization', authorization);
      expect(doc.status).toBe(200);
    } finally {
      await stop();
    }
  });

  it('rejects same revision with different retain set as conflict', async () => {
    const { baseUrl, tasks, stop } = await startScheduled({
      maxRetries: 0,
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const authorization = serviceAuth();

    try {
      await tasks[0].fn(new AbortController().signal);
      const snap = await request(baseUrl)
        .get('/api/skill-image-connector/skills/default')
        .set('Authorization', authorization);
      const revision = snap.headers['x-skilldocs-revision'];

      const ack1 = await request(baseUrl)
        .post('/api/skill-image-connector/skilldocs/default/reconcile')
        .set('Authorization', authorization)
        .send({ revision, retainedDigests: [resolvedDigest] });
      expect(ack1.status).toBe(204);

      const ack2 = await request(baseUrl)
        .post('/api/skill-image-connector/skilldocs/default/reconcile')
        .set('Authorization', authorization)
        .send({ revision, retainedDigests: [] });
      expect(ack2.status).toBe(409);
    } finally {
      await stop();
    }
  });
});

describe('publication and cleanup race safety', () => {
  it('serializes a new publication behind an in-flight acknowledgment cleanup', async () => {
    const { baseUrl, tasks, stop } = await startScheduled({
      maxRetries: 0,
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    let release!: () => void;
    const held = new Promise<void>(resolve => {
      release = resolve;
    });
    let entered!: () => void;
    const cleanupEntered = new Promise<void>(resolve => {
      entered = resolve;
    });
    let acquired!: () => void;
    const extractionComplete = new Promise<void>(resolve => {
      acquired = resolve;
    });
    let refresh: Promise<void> | undefined;
    let ack: Promise<request.Response> | undefined;
    const newDigest = `sha256:${'f'.repeat(64)}`;
    try {
      await tasks[0].fn(new AbortController().signal);
      const snapshot = await request(baseUrl)
        .get('/api/skill-image-connector/skills/default')
        .set('Authorization', serviceAuth());
      const original = getContentStore().acknowledgeAndCleanup.bind(
        getContentStore(),
      );
      jest
        .spyOn(getContentStore(), 'acknowledgeAndCleanup')
        .mockImplementationOnce(async (...args) => {
          entered();
          await held;
          return original(...args);
        });
      ack = request(baseUrl)
        .post('/api/skill-image-connector/skilldocs/default/reconcile')
        .set('Authorization', serviceAuth())
        .send({
          revision: snapshot.headers['x-skilldocs-revision'],
          retainedDigests: [resolvedDigest],
        })
        .then(response => response);
      await cleanupEntered;
      resolveManifest.mockResolvedValue({
        manifest: {
          schemaVersion: 2,
          config: {
            mediaType: 'application/vnd.oci.image.config.v1+json',
            digest: newDigest,
            size: 0,
          },
          layers: [],
        },
        digest: newDigest,
      });
      fetchImage.mockImplementation(async () => {
        acquired();
        return { ...extracted, skillsMd: '# New documentation' };
      });
      let published = false;
      refresh = Promise.resolve(tasks[0].fn(new AbortController().signal)).then(
        () => {
          published = true;
        },
      );
      await extractionComplete;
      // Allow the acquisition/normalization microtasks to reach the held publication lock.
      await new Promise<void>(resolve => setImmediate(resolve));
      expect(published).toBe(false);
      expect(await getContentStore().get('default', newDigest)).toBeUndefined();
      release();
      expect((await ack).status).toBe(204);
      await refresh;
      expect(await getContentStore().get('default', newDigest)).toBe(
        '# New documentation',
      );
      const doc = await request(baseUrl)
        .get(`/api/skill-image-connector/skilldocs/default/${newDigest}`)
        .set('Authorization', serviceAuth());
      expect(doc.status).toBe(200);
      expect(doc.text).toBe('# New documentation');
    } finally {
      release();
      await ack;
      await refresh;
      await stop();
    }
  });
});

describe('ETag and conditional requests on skill documentation', () => {
  it('returns 304 when If-None-Match matches the content ETag', async () => {
    const { baseUrl, tasks, stop } = await startScheduled({
      maxRetries: 0,
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const authorization = serviceAuth();

    try {
      await tasks[0].fn(new AbortController().signal);

      const first = await request(baseUrl)
        .get(`/api/skill-image-connector/skilldocs/default/${resolvedDigest}`)
        .set('Authorization', authorization);
      expect(first.status).toBe(200);
      expect(first.headers.etag).toBe(`"${resolvedDigest}"`);

      const second = await request(baseUrl)
        .get(`/api/skill-image-connector/skilldocs/default/${resolvedDigest}`)
        .set('Authorization', authorization)
        .set('If-None-Match', `"${resolvedDigest}"`);
      expect(second.status).toBe(304);
    } finally {
      await stop();
    }
  });
});

describe('source isolation in TechDocs', () => {
  it('isolates documentation between sources', async () => {
    const digestA = resolvedDigest;
    const digestB = `sha256:${'f'.repeat(64)}`;

    fetchImage
      .mockResolvedValueOnce({ ...extracted, skillsMd: '# Source A doc' })
      .mockResolvedValueOnce({ ...extracted, skillsMd: '# Source B doc' });

    resolveManifest
      .mockResolvedValueOnce({
        manifest: {
          schemaVersion: 2,
          config: {
            mediaType: 'application/vnd.oci.image.config.v1+json',
            digest: digestA,
            size: 0,
          },
          layers: [],
        },
        digest: digestA,
      })
      .mockResolvedValueOnce({
        manifest: {
          schemaVersion: 2,
          config: {
            mediaType: 'application/vnd.oci.image.config.v1+json',
            digest: digestB,
            size: 0,
          },
          layers: [],
        },
        digest: digestB,
      });

    const { baseUrl, tasks, stop } = await startScheduled({
      maxRetries: 0,
      sources: [
        {
          id: 'source-a',
          allowedRegistries: ['quay.io'],
          images: [{ imageRef: 'quay.io/org/skill-a:v1' }],
        },
        {
          id: 'source-b',
          allowedRegistries: ['quay.io'],
          images: [{ imageRef: 'quay.io/org/skill-b:v1' }],
        },
      ],
    });
    const authorization = serviceAuth();

    try {
      await tasks[0].fn(new AbortController().signal);
      await tasks[1].fn(new AbortController().signal);

      const docA = await request(baseUrl)
        .get(`/api/skill-image-connector/skilldocs/source-a/${digestA}`)
        .set('Authorization', authorization);
      expect(docA.status).toBe(200);
      expect(docA.text).toBe('# Source A doc');

      const docB = await request(baseUrl)
        .get(`/api/skill-image-connector/skilldocs/source-b/${digestB}`)
        .set('Authorization', authorization);
      expect(docB.status).toBe(200);
      expect(docB.text).toBe('# Source B doc');

      // Cross-source access returns 404
      expect(
        (
          await request(baseUrl)
            .get(`/api/skill-image-connector/skilldocs/source-a/${digestB}`)
            .set('Authorization', authorization)
        ).status,
      ).toBe(404);
      expect(
        (
          await request(baseUrl)
            .get(`/api/skill-image-connector/skilldocs/source-b/${digestA}`)
            .set('Authorization', authorization)
        ).status,
      ).toBe(404);
    } finally {
      await stop();
    }
  });
});

describe('provider outage with connector advancing', () => {
  it('retains all content when no acknowledgment arrives', async () => {
    const digest2 = `sha256:${'b'.repeat(64)}`;
    const digest3 = `sha256:${'c'.repeat(64)}`;

    const { baseUrl, tasks, stop } = await startScheduled({
      maxRetries: 0,
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const authorization = serviceAuth();

    try {
      await tasks[0].fn(new AbortController().signal);

      // Tag moves — second refresh without acknowledgment
      resolveManifest.mockResolvedValue({
        manifest: {
          schemaVersion: 2,
          config: {
            mediaType: 'application/vnd.oci.image.config.v1+json',
            digest: digest2,
            size: 0,
          },
          layers: [],
        },
        digest: digest2,
      });
      fetchImage.mockImplementation(async () => ({
        ...extracted,
        skillsMd: '# Updated',
      }));
      await tasks[0].fn(new AbortController().signal);

      // Tag moves again — third refresh still no acknowledgment
      resolveManifest.mockResolvedValue({
        manifest: {
          schemaVersion: 2,
          config: {
            mediaType: 'application/vnd.oci.image.config.v1+json',
            digest: digest3,
            size: 0,
          },
          layers: [],
        },
        digest: digest3,
      });
      fetchImage.mockImplementation(async () => ({
        ...extracted,
        skillsMd: '# Third version',
      }));
      await tasks[0].fn(new AbortController().signal);

      // All three digests served without acknowledgment
      for (const d of [resolvedDigest, digest2, digest3]) {
        const doc = await request(baseUrl)
          .get(`/api/skill-image-connector/skilldocs/default/${d}`)
          .set('Authorization', authorization);
        expect(doc.status).toBe(200);
      }
    } finally {
      await stop();
    }
  });
});

describe('reconcile body bounds', () => {
  it('rejects missing revision', async () => {
    const { baseUrl, tasks, stop } = await startScheduled({
      maxRetries: 0,
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const authorization = serviceAuth();
    try {
      await tasks[0].fn(new AbortController().signal);
      const res = await request(baseUrl)
        .post('/api/skill-image-connector/skilldocs/default/reconcile')
        .set('Authorization', authorization)
        .send({ retainedDigests: [] });
      expect(res.status).toBe(400);
    } finally {
      await stop();
    }
  });

  it('rejects non-array retainedDigests', async () => {
    const { baseUrl, tasks, stop } = await startScheduled({
      maxRetries: 0,
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const authorization = serviceAuth();
    try {
      await tasks[0].fn(new AbortController().signal);
      const res = await request(baseUrl)
        .post('/api/skill-image-connector/skilldocs/default/reconcile')
        .set('Authorization', authorization)
        .send({ revision: '1', retainedDigests: 'not-an-array' });
      expect(res.status).toBe(400);
    } finally {
      await stop();
    }
  });

  it('rejects duplicate digests in retainedDigests', async () => {
    const { baseUrl, tasks, stop } = await startScheduled({
      maxRetries: 0,
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const authorization = serviceAuth();
    try {
      await tasks[0].fn(new AbortController().signal);
      const res = await request(baseUrl)
        .post('/api/skill-image-connector/skilldocs/default/reconcile')
        .set('Authorization', authorization)
        .send({
          revision: '1',
          retainedDigests: [resolvedDigest, resolvedDigest],
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('duplicate');
    } finally {
      await stop();
    }
  });

  it('rejects unknown source', async () => {
    const { baseUrl, tasks, stop } = await startScheduled({
      maxRetries: 0,
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const authorization = serviceAuth();
    try {
      await tasks[0].fn(new AbortController().signal);
      const res = await request(baseUrl)
        .post('/api/skill-image-connector/skilldocs/nonexistent/reconcile')
        .set('Authorization', authorization)
        .send({ revision: '1', retainedDigests: [] });
      expect(res.status).toBe(404);
    } finally {
      await stop();
    }
  });
});

describe('X-Skilldocs-Revision header', () => {
  it('includes revision header on ready snapshots', async () => {
    const { baseUrl, tasks, stop } = await startScheduled({
      maxRetries: 0,
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const authorization = serviceAuth();
    try {
      await tasks[0].fn(new AbortController().signal);
      const snap = await request(baseUrl)
        .get('/api/skill-image-connector/skills/default')
        .set('Authorization', authorization);
      expect(snap.headers['x-skilldocs-revision']).toMatch(/^[1-9][0-9]*$/);
    } finally {
      await stop();
    }
  });

  it('includes revision header on partial snapshots', async () => {
    const { baseUrl, tasks, stop } = await startScheduled({
      maxRetries: 0,
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const authorization = serviceAuth();
    try {
      await tasks[0].fn(new AbortController().signal);
      fetchImage.mockRejectedValueOnce(new Error('fail'));
      await tasks[0].fn(new AbortController().signal);

      const snap = await request(baseUrl)
        .get('/api/skill-image-connector/skills/default')
        .set('Authorization', authorization);
      expect(snap.body.status).toBe('partial');
      expect(snap.headers['x-skilldocs-revision']).toMatch(/^[1-9][0-9]*$/);
    } finally {
      await stop();
    }
  });

  it('includes revision header when all images fail', async () => {
    fetchImage.mockRejectedValue(new Error('fail'));
    const { baseUrl, tasks, stop } = await startScheduled({
      maxRetries: 0,
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const authorization = serviceAuth();
    try {
      await tasks[0].fn(new AbortController().signal);
      const snap = await request(baseUrl)
        .get('/api/skill-image-connector/skills/default')
        .set('Authorization', authorization);
      // With images-only config (no quay discovery), discovery is
      // considered complete even when all extractions fail, so the
      // snapshot status is 'partial' (failedKeys > 0), not 'failed'.
      expect(snap.body.status).toBe('partial');
      expect(snap.headers['x-skilldocs-revision']).toMatch(/^[1-9][0-9]*$/);
    } finally {
      await stop();
    }
  });

  it('does not include revision header on loading snapshots', async () => {
    const { baseUrl, stop } = await startScheduled({
      maxRetries: 0,
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const authorization = serviceAuth();
    try {
      const snap = await request(baseUrl)
        .get('/api/skill-image-connector/skills/default')
        .set('Authorization', authorization);
      expect(snap.body.status).toBe('loading');
      expect(snap.headers['x-skilldocs-revision']).toBeUndefined();
    } finally {
      await stop();
    }
  });
});
