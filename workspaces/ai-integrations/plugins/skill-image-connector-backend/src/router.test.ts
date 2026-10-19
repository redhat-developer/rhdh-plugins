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

import type { LoggerService } from '@backstage/backend-plugin-api';
import type { SkillSnapshot } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import {
  createLoadingSnapshot,
  validOciSnapshotReady,
  ociSource,
} from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import express from 'express';
import request from 'supertest';
import { createRouter } from './router';
import type { SkillImageExtraction } from './services/types';

const mockLogger: LoggerService = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnThis(),
};

describe('createRouter', () => {
  let app: express.Express;
  let extractions: Map<string, SkillImageExtraction>;

  beforeAll(async () => {
    extractions = new Map();
    extractions.set('quay.io/org/repo:v1', {
      skillImageYamlPath: '/tmp/skill-image-xx/skillimage.yaml',
      skillsMdPath: '/tmp/skill-image-xx/SKILLS.md',
      skillImageYaml: 'name: test',
      skillsMd: '# Test',
    });
    const router = await createRouter(mockLogger, extractions);
    app = express();
    app.use(router);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /health', () => {
    it('returns 200 with status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /images', () => {
    it('returns extracted image list', async () => {
      const res = await request(app).get('/images');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ready');
      expect(res.body.failedImages).toEqual([]);
      expect(res.body.images).toHaveLength(1);
      expect(res.body.images[0]).toEqual({
        imageRef: 'quay.io/org/repo:v1',
        skillImageYaml: 'name: test',
        skillsMd: '# Test',
      });
    });

    it('reports loading while images are being processed', async () => {
      const router = await createRouter(
        mockLogger,
        new Map(),
        () => 'loading',
        () => ['quay.io/org/failed:v1'],
      );
      const loadingApp = express();
      loadingApp.use(router);

      const res = await request(loadingApp).get('/images');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'loading',
        failedImages: ['quay.io/org/failed:v1'],
        images: [],
      });
    });
  });

  describe('GET /skills/:sourceId', () => {
    it('returns 404 for unknown source IDs', async () => {
      const router = await createRouter(
        mockLogger,
        new Map(),
        () => 'ready',
        () => [],
        new Map(),
      );
      const testApp = express();
      testApp.use(router);

      const res = await request(testApp).get('/skills/unknown-source');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Unknown source: unknown-source' });
    });

    it('returns 404 when no snapshots map is provided', async () => {
      const res = await request(app).get('/skills/any-source');
      expect(res.status).toBe(404);
    });

    it('returns snapshot for known source ID', async () => {
      const snapshots = new Map<string, SkillSnapshot>();
      snapshots.set('quay-public', validOciSnapshotReady);

      const router = await createRouter(
        mockLogger,
        new Map(),
        () => 'ready',
        () => [],
        snapshots,
      );
      const testApp = express();
      testApp.use(router);

      const res = await request(testApp).get('/skills/quay-public');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(validOciSnapshotReady);
      expect(res.body.source.id).toBe('quay-public');
      expect(res.body.source.type).toBe('oci');
      expect(res.body.schemaVersion).toBe('1');
    });

    it('returns loading snapshot before first refresh', async () => {
      const snapshots = new Map<string, SkillSnapshot>();
      const loadingSnapshot = createLoadingSnapshot(ociSource);
      snapshots.set(ociSource.id, loadingSnapshot);

      const router = await createRouter(
        mockLogger,
        new Map(),
        () => 'loading',
        () => [],
        snapshots,
      );
      const testApp = express();
      testApp.use(router);

      const res = await request(testApp).get(`/skills/${ociSource.id}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('loading');
      expect(res.body.observedAt).toBeNull();
      expect(res.body.skills).toEqual([]);
      expect(res.body.failedSkillKeys).toEqual([]);
    });

    it.each(['source/with special chars', 'team%', 'team%2Fprod'])(
      'handles URL-encoded source ID %p as one path segment',
      async sourceId => {
        const snapshot = createLoadingSnapshot({
          id: sourceId,
          type: 'oci',
        });
        const snapshots = new Map<string, SkillSnapshot>();
        snapshots.set(sourceId, snapshot);

        const router = await createRouter(
          mockLogger,
          new Map(),
          () => 'loading',
          () => [],
          snapshots,
        );
        const testApp = express();
        testApp.use(router);

        const encodedId = encodeURIComponent(sourceId);
        const res = await request(testApp).get(`/skills/${encodedId}`);
        expect(res.status).toBe(200);
        expect(res.body.source.id).toBe(sourceId);
      },
    );
  });

  describe('GET /skilldocs/:sourceId/:digest', () => {
    const validDigest = `sha256:${'a'.repeat(64)}`;
    const otherDigest = `sha256:${'b'.repeat(64)}`;
    const markdownContent = '# Hello Skill\n\nThis is a skill document.';
    const otherMarkdownContent = '# Other Skill\n\nDifferent content.';

    function buildSkillDocsApp(opts?: {
      snapshots?: Map<string, SkillSnapshot>;
      getSkillDocContent?: (
        sourceId: string,
        digest: string,
      ) => string | undefined;
    }) {
      const snaps =
        opts?.snapshots ??
        (() => {
          const m = new Map<string, SkillSnapshot>();
          m.set('quay-public', validOciSnapshotReady);
          return m;
        })();

      return createRouter(
        mockLogger,
        new Map(),
        () => 'ready',
        () => [],
        snaps,
        opts?.getSkillDocContent,
      ).then(router => {
        const testApp = express();
        testApp.use(router);
        return testApp;
      });
    }

    it('returns 200 with text/markdown and ETag for valid source and digest', async () => {
      const testApp = await buildSkillDocsApp({
        getSkillDocContent: (sourceId, digest) => {
          if (sourceId === 'quay-public' && digest === validDigest) {
            return markdownContent;
          }
          return undefined;
        },
      });

      const res = await request(testApp).get(
        `/skilldocs/quay-public/${validDigest}`,
      );
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/markdown/);
      expect(res.headers.etag).toBe(`"${validDigest}"`);
      expect(res.text).toBe(markdownContent);
    });

    it('returns 404 for unknown source ID', async () => {
      const testApp = await buildSkillDocsApp({
        getSkillDocContent: () => undefined,
      });

      const res = await request(testApp).get(
        `/skilldocs/unknown-source/${validDigest}`,
      );
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Unknown source');
    });

    it('returns 404 for unknown digest in a known source', async () => {
      const testApp = await buildSkillDocsApp({
        getSkillDocContent: () => undefined,
      });

      const res = await request(testApp).get(
        `/skilldocs/quay-public/${validDigest}`,
      );
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Content not available');
    });

    it('returns 404 when content is not yet available (loading)', async () => {
      const snapshots = new Map<string, SkillSnapshot>();
      snapshots.set(ociSource.id, createLoadingSnapshot(ociSource));

      const testApp = await buildSkillDocsApp({
        snapshots,
        getSkillDocContent: () => undefined,
      });

      const res = await request(testApp).get(
        `/skilldocs/${ociSource.id}/${validDigest}`,
      );
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Content not available');
    });

    it('returns 304 for matching If-None-Match', async () => {
      const testApp = await buildSkillDocsApp({
        getSkillDocContent: (sourceId, digest) => {
          if (sourceId === 'quay-public' && digest === validDigest) {
            return markdownContent;
          }
          return undefined;
        },
      });

      const res = await request(testApp)
        .get(`/skilldocs/quay-public/${validDigest}`)
        .set('If-None-Match', `"${validDigest}"`);
      expect(res.status).toBe(304);
      expect(res.text).toBe('');
    });

    it('returns 304 for weak ETag match in If-None-Match', async () => {
      const testApp = await buildSkillDocsApp({
        getSkillDocContent: () => markdownContent,
      });

      const res = await request(testApp)
        .get(`/skilldocs/quay-public/${validDigest}`)
        .set('If-None-Match', `W/"${validDigest}"`);
      expect(res.status).toBe(304);
    });

    it('returns 404 for malformed digest', async () => {
      const testApp = await buildSkillDocsApp({
        getSkillDocContent: () => markdownContent,
      });

      const res = await request(testApp).get(
        '/skilldocs/quay-public/sha256:tooshort',
      );
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Invalid digest format');
    });

    it('returns 404 for digest with uppercase hex', async () => {
      const testApp = await buildSkillDocsApp({
        getSkillDocContent: () => markdownContent,
      });

      const uppercaseDigest = `sha256:${'A'.repeat(64)}`;
      const res = await request(testApp).get(
        `/skilldocs/quay-public/${uppercaseDigest}`,
      );
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Invalid digest format');
    });

    it.each(['', '.', '..'])(
      'returns 404 for blank/dot/dot-dot source ID %p',
      async sourceId => {
        const testApp = await buildSkillDocsApp({
          getSkillDocContent: () => markdownContent,
        });

        const encodedId = encodeURIComponent(sourceId);
        // Blank sourceId results in a different route; dot/dot-dot are rejected
        const path =
          sourceId === ''
            ? `/skilldocs//${validDigest}`
            : `/skilldocs/${encodedId}/${validDigest}`;
        const res = await request(testApp).get(path);
        expect(res.status).toBe(404);
      },
    );

    it.each(['source/with special chars', 'team%', 'team%2Fprod'])(
      'handles URL-encoded source ID %p as one path segment',
      async sourceId => {
        const snapshot = createLoadingSnapshot({
          id: sourceId,
          type: 'oci',
        });
        const snapshots = new Map<string, SkillSnapshot>();
        snapshots.set(sourceId, snapshot);

        const testApp = await buildSkillDocsApp({
          snapshots,
          getSkillDocContent: (sid, digest) => {
            if (sid === sourceId && digest === validDigest) {
              return markdownContent;
            }
            return undefined;
          },
        });

        const encodedId = encodeURIComponent(sourceId);
        const res = await request(testApp).get(
          `/skilldocs/${encodedId}/${validDigest}`,
        );
        expect(res.status).toBe(200);
        expect(res.text).toBe(markdownContent);
      },
    );

    it('same-digest tag aliases share content and ETag', async () => {
      // Both tags resolve to the same digest, so skilldocs returns the
      // same content and ETag for both.
      const testApp = await buildSkillDocsApp({
        getSkillDocContent: (_sourceId, digest) => {
          if (digest === validDigest) return markdownContent;
          return undefined;
        },
      });

      const res1 = await request(testApp).get(
        `/skilldocs/quay-public/${validDigest}`,
      );
      expect(res1.status).toBe(200);
      expect(res1.text).toBe(markdownContent);
      expect(res1.headers.etag).toBe(`"${validDigest}"`);

      // A second request with the same digest returns the same content
      const res2 = await request(testApp).get(
        `/skilldocs/quay-public/${validDigest}`,
      );
      expect(res2.status).toBe(200);
      expect(res2.text).toBe(markdownContent);
      expect(res2.headers.etag).toBe(res1.headers.etag);
    });

    it('isolates content between sources', async () => {
      const snapshots = new Map<string, SkillSnapshot>();
      snapshots.set('source-a', validOciSnapshotReady);
      snapshots.set(
        'source-b',
        createLoadingSnapshot({ id: 'source-b', type: 'oci' }),
      );

      const testApp = await buildSkillDocsApp({
        snapshots,
        getSkillDocContent: (sourceId, digest) => {
          if (sourceId === 'source-a' && digest === validDigest) {
            return markdownContent;
          }
          if (sourceId === 'source-b' && digest === otherDigest) {
            return otherMarkdownContent;
          }
          return undefined;
        },
      });

      // source-a has validDigest but not otherDigest
      const resA = await request(testApp).get(
        `/skilldocs/source-a/${validDigest}`,
      );
      expect(resA.status).toBe(200);
      expect(resA.text).toBe(markdownContent);

      const resA2 = await request(testApp).get(
        `/skilldocs/source-a/${otherDigest}`,
      );
      expect(resA2.status).toBe(404);

      // source-b has otherDigest but not validDigest
      const resB = await request(testApp).get(
        `/skilldocs/source-b/${otherDigest}`,
      );
      expect(resB.status).toBe(200);
      expect(resB.text).toBe(otherMarkdownContent);

      const resB2 = await request(testApp).get(
        `/skilldocs/source-b/${validDigest}`,
      );
      expect(resB2.status).toBe(404);
    });

    it('returns 200 when If-None-Match does not match', async () => {
      const testApp = await buildSkillDocsApp({
        getSkillDocContent: () => markdownContent,
      });

      const res = await request(testApp)
        .get(`/skilldocs/quay-public/${validDigest}`)
        .set('If-None-Match', `"${otherDigest}"`);
      expect(res.status).toBe(200);
      expect(res.text).toBe(markdownContent);
    });

    it('does not return getSkillDocContent when no function provided', async () => {
      const testApp = await buildSkillDocsApp();

      const res = await request(testApp).get(
        `/skilldocs/quay-public/${validDigest}`,
      );
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Content not available');
    });
  });
});
