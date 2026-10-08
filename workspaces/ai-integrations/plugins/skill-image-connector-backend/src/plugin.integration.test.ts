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
import request from 'supertest';
import type { Config } from '../config';
import { skillImageConnectorPlugin } from './plugin';
import { discoverQuayRepositories } from './services/QuayDiscovery';
import {
  cleanupSkillImageExtraction,
  fetchAndExtractSkillImage,
} from './services/SkillImageService';
import { HttpResponseError } from './services/HttpClient';
import { fetchManifest, ManifestResponseError } from './services/OciClient';

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
  skillImageYaml: 'hé',
  skillsMd: 'abc',
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

describe('configured acquisition in the plugin', () => {
  it('keeps skill-image tags separate and excludes unsuccessful extraction', async () => {
    const aliases = ['quay.io/org/skill:latest', 'quay.io/org/skill:v1'];
    const nonSkill = 'quay.io/org/container:v1';
    discover.mockResolvedValue([...aliases, nonSkill]);
    fetchImage.mockImplementation(async ref => {
      if (ref === pinnedRef(nonSkill)) {
        throw new Error('Image does not contain the required skill files');
      }
      return { ...extracted };
    });
    const { server } = await startConnector({
      quayDiscovery: { organization: 'org' },
    });
    const response = await request(server)
      .get('/api/skill-image-connector/images')
      .set('Authorization', mockCredentials.user.header());
    expect(response.status).toBe(200);
    expect(response.body.images).toEqual(
      aliases.map(imageRef => ({
        imageRef,
        skillImageYaml: 'hé',
        skillsMd: 'abc',
      })),
    );
    expect(response.body.failedImages).toEqual([nonSkill]);
    expect(discover.mock.calls[0][0].tag).toBeUndefined();
    expect(logger.warn).not.toHaveBeenCalledWith(
      expect.stringContaining("'undefined'"),
    );
  });

  it('shares resolved overrides and enforces the retained UTF-8 byte budget across images', async () => {
    discover.mockResolvedValue(['quay.io/org/discovered:v1']);
    const limits = {
      fetchTimeoutMs: 60000,
      maxBlobSizeBytes: 1000,
      maxAggregateContentSizeBytes: 10,
      maxDiscoveryResponseSizeBytes: 100,
      maxImages: 100,
      maxRetries: 0,
      retryBaseDelayMs: 20,
    };
    const { server } = await startConnector({
      ...limits,
      images: [{ imageRef: 'quay.io/org/explicit:v1' }],
      quayDiscovery: { organization: 'org', tag: 'v1' },
    });
    const response = await request(server)
      .get('/api/skill-image-connector/images')
      .set('Authorization', mockCredentials.user.header());
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ready');
    expect(response.body.images).toHaveLength(1);
    expect(response.body.images[0]).toEqual({
      imageRef: 'quay.io/org/explicit:v1',
      skillImageYaml: 'hé',
      skillsMd: 'abc',
    });
    expect(response.body.failedImages).toEqual(['quay.io/org/discovered:v1']);
    expect(cleanupSkillImageExtraction).toHaveBeenCalledWith(
      {
        ...extracted,
        acquisition: {
          key: 'quay.io/org/discovered:v1',
          digest: resolvedDigest,
          sourceUri: `oci://quay.io/org/discovered@${resolvedDigest}`,
        },
      },
      expect.anything(),
    );
    expect(discover.mock.calls[0][3]).toEqual(limits);
    expect(fetchImage.mock.calls[0][5]).toEqual(limits);
    expect(fetchImage.mock.calls[1][5]).toBe(discover.mock.calls[0][3]);
  });

  it('enforces the retained byte budget when discovery finishes before an explicit image', async () => {
    const explicitRef = 'quay.io/org/explicit:v1';
    const discoveredRef = 'quay.io/org/discovered:v1';
    const explicitExtraction = {
      ...extracted,
      skillImageYamlPath: '/explicit/skillimage.yaml',
      skillsMdPath: '/explicit/SKILLS.md',
    };
    const discoveredExtraction = {
      ...extracted,
      skillImageYamlPath: '/discovered/skillimage.yaml',
      skillsMdPath: '/discovered/SKILLS.md',
    };
    const maxAggregateContentSizeBytes = 10;
    let finishExplicit!: (result: typeof extracted) => void;
    const explicitResult = new Promise<typeof extracted>(resolve => {
      finishExplicit = resolve;
    });
    discover.mockResolvedValue([discoveredRef]);
    fetchImage.mockImplementation(ref =>
      ref === pinnedRef(explicitRef)
        ? explicitResult
        : Promise.resolve(discoveredExtraction),
    );

    const { server } = await startConnector({
      maxAggregateContentSizeBytes,
      images: [{ imageRef: explicitRef }],
      quayDiscovery: { organization: 'org', tag: 'v1' },
    });
    const retainedImage = {
      imageRef: discoveredRef,
      skillImageYaml: discoveredExtraction.skillImageYaml,
      skillsMd: discoveredExtraction.skillsMd,
    };

    try {
      const loading = await request(server)
        .get('/api/skill-image-connector/images')
        .set('Authorization', mockCredentials.user.header());
      expect(loading.status).toBe(200);
      expect(loading.body).toEqual({
        status: 'loading',
        images: [retainedImage],
        failedImages: [],
      });
      expect(fetchImage.mock.calls.map(([ref]) => ref)).toEqual([
        pinnedRef(explicitRef),
        pinnedRef(discoveredRef),
      ]);
      expect(cleanupSkillImageExtraction).not.toHaveBeenCalled();
    } finally {
      // Release the pending result even if an assertion fails so shutdown can finish.
      finishExplicit(explicitExtraction);
    }

    const response = await request(server)
      .get('/api/skill-image-connector/images')
      .set('Authorization', mockCredentials.user.header());
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ready',
      images: [retainedImage],
      failedImages: [explicitRef],
    });
    const retainedBytes =
      Buffer.byteLength(response.body.images[0].skillImageYaml, 'utf-8') +
      Buffer.byteLength(response.body.images[0].skillsMd, 'utf-8');
    expect(retainedBytes).toBe(6);
    expect(retainedBytes).toBeLessThanOrEqual(maxAggregateContentSizeBytes);
    expect(cleanupSkillImageExtraction).toHaveBeenCalledTimes(1);
    expect(cleanupSkillImageExtraction).toHaveBeenCalledWith(
      explicitExtraction,
      expect.anything(),
    );
  });

  it('honors zero retries in the image path and reports a failed image', async () => {
    fetchImage.mockRejectedValue(new HttpResponseError('unavailable', 503));
    const { server } = await startConnector({
      maxRetries: 0,
      images: [{ imageRef: 'quay.io/org/skill:v1' }],
    });
    const response = await request(server)
      .get('/api/skill-image-connector/images')
      .set('Authorization', mockCredentials.user.header());
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('failed');
    expect(response.body.failedImages).toEqual(['quay.io/org/skill:v1']);
    expect(fetchImage).toHaveBeenCalledTimes(1);
  });
});

describe('configured total image limit', () => {
  it.each([
    { maxImages: undefined, expected: 25 },
    { maxImages: 100, expected: 75 },
    { maxImages: 10, expected: 10 },
  ])(
    'processes $expected combined candidates with maxImages=$maxImages',
    async ({ maxImages, expected }) => {
      const refs = Array.from(
        { length: 75 },
        (_, i) => `quay.io/org/skill-${i}:v1`,
      );
      discover.mockResolvedValue(refs);
      // The explicit reference also appears in discovery and counts only once.
      const { server } = await startConnector({
        ...(maxImages === undefined ? {} : { maxImages }),
        images: [{ imageRef: refs[74] }],
        quayDiscovery: { organization: 'org', tag: 'v1' },
      });
      const response = await request(server)
        .get('/api/skill-image-connector/images')
        .set('Authorization', mockCredentials.user.header());
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ready');
      const processedRefs = response.body.images.map(
        (img: { imageRef: string }) => img.imageRef,
      );
      expect(processedRefs).toHaveLength(expected);
      expect(new Set(processedRefs)).toEqual(
        new Set([refs[74], ...refs.slice(0, expected - 1)]),
      );
      const droppedWarnings = logger.warn.mock.calls.filter(([message]) =>
        message.includes('were dropped'),
      );
      const droppedWarning = expect.stringContaining(
        `${75 - expected} discovered image candidate(s) were dropped`,
      );
      expect(droppedWarnings).toEqual(
        expected === 75 ? [] : [[droppedWarning]],
      );
    },
  );

  it('accepts more than 25 explicit images within the configured total limit', async () => {
    const images = Array.from({ length: 26 }, (_, i) => ({
      imageRef: `quay.io/org/skill-${i}:v1`,
    }));
    const settings = { maxImages: 100, images };
    const { server } = await startConnector(settings);
    const response = await request(server)
      .get('/api/skill-image-connector/images')
      .set('Authorization', mockCredentials.user.header());
    expect(response.body.images).toHaveLength(26);
    expect(response.body.failedImages).toEqual([]);
  });

  it('rejects explicit image lists exceeding the configured total limit', async () => {
    const settings = {
      maxImages: 1,
      images: [
        { imageRef: 'quay.io/org/first:v1' },
        { imageRef: 'quay.io/org/second:v1' },
      ],
    };
    await expect(startConnector(settings)).rejects.toThrow(
      'skillImageConnector.images may contain at most 1 entries',
    );
    expect(fetchImage).not.toHaveBeenCalled();
  });
});

describe('source-specific 404 logging', () => {
  it.each([true, false])(
    'reports missing images only when explicitly configured: %s',
    async explicit => {
      const imageRef = 'quay.io/org/skill:missing';
      const error = new ManifestResponseError(
        'Failed to fetch manifest: 404 Not Found',
        404,
      );
      fetchImage.mockRejectedValue(error);
      discover.mockResolvedValue([imageRef]);
      const { server } = await startConnector({
        maxRetries: 0,
        ...(explicit
          ? { images: [{ imageRef }] }
          : { quayDiscovery: { organization: 'org', tag: 'missing' } }),
      });
      const response = await request(server)
        .get('/api/skill-image-connector/images')
        .set('Authorization', mockCredentials.user.header());
      expect(response.body.failedImages).toEqual([imageRef]);
      expect(fetchImage).toHaveBeenCalledTimes(1);
      const expectedErrors = explicit
        ? [[`Failed to process skill image ${imageRef}`, error]]
        : [];
      expect(logger.error.mock.calls).toEqual(expectedErrors);
      expect(logger.warn).not.toHaveBeenCalledWith(
        expect.stringContaining('404'),
      );
    },
  );

  it('keeps explicit-image diagnostics when discovery finds the same reference', async () => {
    const imageRef = 'quay.io/org/skill:missing';
    const error = new HttpResponseError('404 Not Found', 404);
    fetchImage.mockRejectedValue(error);
    discover.mockResolvedValue([imageRef]);
    const { server } = await startConnector({
      maxRetries: 0,
      images: [{ imageRef }],
      quayDiscovery: { organization: 'org', tag: 'missing' },
    });
    await request(server)
      .get('/api/skill-image-connector/images')
      .set('Authorization', mockCredentials.user.header());
    expect(fetchImage).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      `Failed to process skill image ${imageRef}`,
      error,
    );
  });

  it('still reports other HTTP errors for discovered images', async () => {
    const imageRef = 'quay.io/org/skill:v1';
    const error = new HttpResponseError('503 unavailable', 503);
    discover.mockResolvedValue([imageRef]);
    fetchImage.mockRejectedValue(error);
    const { server } = await startConnector({
      maxRetries: 0,
      quayDiscovery: { organization: 'org', tag: 'v1' },
    });
    await request(server)
      .get('/api/skill-image-connector/images')
      .set('Authorization', mockCredentials.user.header());
    expect(logger.error).toHaveBeenCalledWith(
      `Failed to process skill image ${imageRef}`,
      error,
    );
  });

  it.each([
    ['bearer token', 'Bearer token request failed: 404 Not Found'],
    ['blob', 'Failed to fetch blob: 404 Not Found'],
  ])('reports a %s 404 for discovered images', async (_, message) => {
    const imageRef = 'quay.io/org/skill:v1';
    const error = new HttpResponseError(message, 404);
    discover.mockResolvedValue([imageRef]);
    fetchImage.mockRejectedValue(error);
    const { server } = await startConnector({
      maxRetries: 0,
      quayDiscovery: { organization: 'org', tag: 'v1' },
    });
    const response = await request(server)
      .get('/api/skill-image-connector/images')
      .set('Authorization', mockCredentials.user.header());
    expect(response.body.failedImages).toEqual([imageRef]);
    expect(logger.error).toHaveBeenCalledWith(
      `Failed to process skill image ${imageRef}`,
      error,
    );
  });

  it('still reports a missing organization-listing endpoint', async () => {
    const error = new HttpResponseError('404 Not Found', 404);
    discover.mockRejectedValue(error);
    const { server } = await startConnector({
      quayDiscovery: { organization: 'missing-org', tag: 'v1' },
    });
    const response = await request(server)
      .get('/api/skill-image-connector/images')
      .set('Authorization', mockCredentials.user.header());
    expect(response.body.status).toBe('failed');
    expect(logger.error).toHaveBeenCalledWith(
      'Quay organization discovery failed for missing-org',
      error,
    );
    expect(fetchImage).not.toHaveBeenCalled();
  });
});
