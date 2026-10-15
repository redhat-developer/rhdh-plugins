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
  mockCredentials,
  mockServices,
  startTestBackend,
} from '@backstage/backend-test-utils';
import { validateSnapshot } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import request from 'supertest';
import type { Config } from '../config';
import { skillImageConnectorPlugin } from './plugin';
import { discoverQuayRepositories } from './services/QuayDiscovery';
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
  discoverQuayRepositories: jest.fn(),
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
const discover = jest.mocked(discoverQuayRepositories);
const resolveManifest = jest.mocked(fetchManifest);
const resolvedDigest = `sha256:${'a'.repeat(64)}`;
const pinnedRef = (ref: string) => `${ref}@${resolvedDigest}`;
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

async function startConnector(
  settings: NonNullable<Config['skillImageConnector']>,
) {
  return startTestBackend({
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
          skillImageConnector: { allowedRegistries: ['quay.io'], ...settings },
        },
      }),
    ],
  });
}

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
});

describe('snapshot status semantics', () => {
  it('returns ready with empty arrays for successful empty discovery', async () => {
    discover.mockResolvedValue([]);
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
    discover.mockResolvedValue(['quay.io/org/container:v1']);
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
    expect(response.body.skills).toEqual([]);
    expect(response.body.observedAt).not.toBeNull();
  });

  it('returns partial when one tag fails while others succeed', async () => {
    const goodRef = 'quay.io/org/good-skill:v1';
    const badRef = 'quay.io/org/bad-skill:v1';
    discover.mockResolvedValue([goodRef, badRef]);
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
    discover.mockResolvedValue([ref1, ref2]);
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

describe('scheduling', () => {
  it('uses Backstage scheduler with configurable refresh interval', async () => {
    const { server } = await startConnector({
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
      refreshIntervalMinutes: 15,
    });
    // Verify the plugin started and scheduled the refresh task
    const response = await request(server)
      .get('/api/skill-image-connector/skills/default')
      .set('Authorization', mockCredentials.service.header());
    expect(response.status).toBe(200);
    // The plugin logs the refresh interval during init
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('refresh every 15 minute(s)'),
    );
  });

  it('uses default 10-minute refresh interval when not configured', async () => {
    const { server } = await startConnector({
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const response = await request(server)
      .get('/api/skill-image-connector/skills/default')
      .set('Authorization', mockCredentials.service.header());
    expect(response.status).toBe(200);
    // Default interval is 10 minutes
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('refresh every 10 minute(s)'),
    );
  });
});
