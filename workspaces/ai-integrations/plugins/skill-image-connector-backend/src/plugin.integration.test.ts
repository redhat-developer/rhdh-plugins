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

import { mockCredentials, mockServices } from '@backstage/backend-test-utils';
import request from 'supertest';
import {
  type ConnectorTestConfig,
  pinnedRef,
  resolvedDigest,
  startConnector as startConnectorBackend,
} from './testUtils';
import {
  buildSnapshotFromRefresh,
  performSourceRefresh,
  skillImageConnectorPlugin,
} from './plugin';
import * as normalizationAdapter from './services/normalizeExtraction';
import type { SkillImageNormalization } from './services/types';
import { DEFAULT_SKILL_IMAGE_OPTIONS } from './services/types';
import type { SkillImageConfig, SourceConfig } from './services/types';
import { discoverQuayRepositorySnapshot } from './services/QuayDiscovery';
import {
  cleanupSkillImageExtraction,
  fetchAndExtractSkillImage,
  NonSkillImageError,
  AmbiguousSkillFilesError,
} from './services/SkillImageService';
import { HttpResponseError } from './services/HttpClient';
import { fetchManifest, ManifestResponseError } from './services/OciClient';

jest.mock('./services/OciClient', () => ({
  ...jest.requireActual<typeof import('./services/OciClient')>(
    './services/OciClient',
  ),
  fetchManifest: jest.fn(),
}));

jest.mock('./services/normalizeExtraction', () => {
  const actual = jest.requireActual<
    typeof import('./services/normalizeExtraction')
  >('./services/normalizeExtraction');
  return {
    ...actual,
    normalizeSkillImageExtraction: jest.fn(
      actual.normalizeSkillImageExtraction,
    ),
  };
});

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
  skillImageYaml: 'hé',
  skillsMd: 'abc',
  skillImageYamlPath: '/unused/skillimage.yaml',
  skillsMdPath: '/unused/SKILLS.md',
};
beforeEach(() => {
  jest.resetAllMocks();
  jest
    .mocked(normalizationAdapter.normalizeSkillImageExtraction)
    .mockImplementation(
      jest.requireActual<typeof import('./services/normalizeExtraction')>(
        './services/normalizeExtraction',
      ).normalizeSkillImageExtraction,
    );
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

function startConnector(settings: ConnectorTestConfig) {
  return startConnectorBackend(settings, logger, skillImageConnectorPlugin);
}

describe('configured acquisition in the plugin', () => {
  it.each([undefined, '', 'sha256:bad', `sha512:${'a'.repeat(128)}`])(
    'rejects an invalid resolution digest %p before extraction',
    async digest => {
      resolveManifest.mockResolvedValue({
        manifest: {
          schemaVersion: 2,
          config: { mediaType: '', digest: resolvedDigest, size: 0 },
          layers: [],
        },
        digest: digest as string,
      });
      const imageRef = 'quay.io/org/skill:v1';
      const { server } = await startConnector({
        maxRetries: 0,
        images: [{ imageRef }],
      });
      const response = await request(server)
        .get('/api/skill-image-connector/images')
        .set('Authorization', mockCredentials.user.header());

      expect(response.body).toEqual({
        status: 'failed',
        images: [],
        failedImages: [imageRef],
      });
      expect(fetchImage).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        `Failed to process skill image ${imageRef}`,
        expect.objectContaining({ message: expect.stringContaining('digest') }),
      );
    },
  );

  it('keeps skill-image tags separate and excludes unsuccessful extraction', async () => {
    const aliases = ['quay.io/org/skill:latest', 'quay.io/org/skill:v1'];
    const nonSkill = 'quay.io/org/container:v1';
    discover.mockResolvedValue({
      imageRefs: [...aliases, nonSkill],
      complete: true,
      usable: true,
    });
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
    discover.mockResolvedValue({
      imageRefs: ['quay.io/org/discovered:v1'],
      complete: true,
      usable: true,
    });
    const limits = {
      fetchTimeoutMs: 60000,
      maxBlobSizeBytes: 1000,
      maxAggregateContentSizeBytes: 10,
      maxDiscoveryResponseSizeBytes: 100,
      maxImageWorkBudgetBytes: 52428800,
      maxImages: 100,
      maxRetries: 0,
      retryBaseDelayMs: 20,
      sourceOperationDeadlineMs: 300000,
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
    let finishExplicit: (result: typeof extracted) => void = () => undefined;
    let finishDiscovered: (result: typeof extracted) => void = () => undefined;
    const explicit = new Promise<typeof extracted>(resolve => {
      finishExplicit = resolve;
    });
    const discovered = new Promise<typeof extracted>(resolve => {
      finishDiscovered = resolve;
    });
    let entered: () => void = () => undefined;
    const started = new Promise<void>(resolve => {
      entered = resolve;
    });
    fetchImage.mockImplementation(ref => {
      if (fetchImage.mock.calls.length === 2) entered();
      return ref === pinnedRef(explicitRef) ? explicit : discovered;
    });
    discover.mockResolvedValue({
      imageRefs: [discoveredRef],
      complete: true,
      usable: true,
    });
    const source: SourceConfig = {
      id: 'default',
      images: [{ id: 'explicit', imageRef: explicitRef }],
      allowedRegistries: ['quay.io'],
      schedule: {
        frequency: { minutes: 10 },
        timeout: { minutes: 10 },
        initialDelay: { seconds: 0 },
        scope: 'local',
      },
      quayDiscovery: { registry: 'quay.io', organization: 'org', tag: 'v1' },
    };
    const running = performSourceRefresh(
      source,
      { ...DEFAULT_SKILL_IMAGE_OPTIONS, maxAggregateContentSizeBytes: 10 },
      logger,
      undefined,
      new AbortController().signal,
    );
    try {
      await started;
      finishDiscovered({ ...extracted });
      // Flush the completed candidate through retention before releasing the other one.
      await new Promise<void>(resolve => setImmediate(resolve));
      expect(cleanupSkillImageExtraction).not.toHaveBeenCalled();
    } finally {
      finishExplicit({ ...extracted });
      finishDiscovered({ ...extracted });
    }
    const result = await running;
    expect([...result.extractions.keys()]).toEqual([discoveredRef]);
    expect(result.failedImageRefs).toEqual([explicitRef]);
    expect(result.failedKeys).toContain(explicitRef);
    const retained = result.extractions.get(discoveredRef)!;
    expect(
      Buffer.byteLength(retained.skillImageYaml) +
        Buffer.byteLength(retained.skillsMd),
    ).toBe(6);
    expect(cleanupSkillImageExtraction).toHaveBeenCalledTimes(1);
    expect(cleanupSkillImageExtraction).toHaveBeenCalledWith(
      {
        ...extracted,
        acquisition: {
          key: explicitRef,
          digest: resolvedDigest,
          sourceUri: `oci://quay.io/org/explicit@${resolvedDigest}`,
        },
      },
      expect.anything(),
    );
    expect(extracted).not.toHaveProperty('acquisition');
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
      discover.mockResolvedValue({
        imageRefs: refs,
        complete: true,
        usable: true,
      });
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
      'images may contain at most 1 entries',
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
      discover.mockResolvedValue({
        imageRefs: [imageRef],
        complete: true,
        usable: true,
      });
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
    discover.mockResolvedValue({
      imageRefs: [imageRef],
      complete: true,
      usable: true,
    });
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
    discover.mockResolvedValue({
      imageRefs: [imageRef],
      complete: true,
      usable: true,
    });
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
    discover.mockResolvedValue({
      imageRefs: [imageRef],
      complete: true,
      usable: true,
    });
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

describe('typed extraction classification in the plugin', () => {
  it.each([
    ['non-skill', new NonSkillImageError('not a skill')],
    ['ambiguous', new AmbiguousSkillFilesError('competing files')],
  ] as const)(
    'handles %s without retrying or preventing other candidates',
    async (kind, error) => {
      const bad = 'quay.io/org/bad:v1';
      const good = 'quay.io/org/good:v1';
      fetchImage.mockImplementation(async ref => {
        if (ref === pinnedRef(bad)) throw error;
        return { ...extracted };
      });
      const backend = await startConnector({
        images: [{ imageRef: bad }, { imageRef: good }],
        maxRetries: 2,
        retryBaseDelayMs: 1,
      });
      const response = await request(backend.server)
        .get('/api/skill-image-connector/images')
        .set('Authorization', mockCredentials.user.header());
      expect(response.body.status).toBe('ready');
      expect(
        response.body.images.map(
          (image: { imageRef: string }) => image.imageRef,
        ),
      ).toEqual([good]);
      expect(response.body.failedImages).toEqual(
        kind === 'ambiguous' ? [bad] : [],
      );
      expect(
        fetchImage.mock.calls.filter(([ref]) => ref === pinnedRef(bad)),
      ).toHaveLength(1);
      const log = kind === 'non-skill' ? logger.debug : logger.error;
      const message =
        kind === 'non-skill' ? 'not a skill image' : 'Ambiguous skill image';
      expect(log).toHaveBeenCalledWith(expect.stringContaining(message));
      await backend.stop();
      expect(cleanupSkillImageExtraction).toHaveBeenCalledTimes(1);
    },
  );
});

describe('source-operation deadline', () => {
  it('aborts active acquisitions and stops queued images when the source timer expires', async () => {
    // Test the deadline behavior by calling performSourceRefresh directly,
    // avoiding the scheduler deadlock that occurs when the mock scheduler
    // awaits the task and fetchImage intentionally hangs.
    const timers = jest.spyOn(global, 'setTimeout');
    const signals: AbortSignal[] = [];
    let allActive: () => void = () => undefined;
    const started = new Promise<void>(resolve => {
      allActive = resolve;
    });
    fetchImage.mockImplementation(
      (_ref, _dir, _logger, _credentials, signal) =>
        new Promise((_resolve, reject) => {
          signals.push(signal!);
          signal!.addEventListener('abort', () => reject(signal!.reason), {
            once: true,
          });
          if (signals.length === 4) allActive();
        }),
    );
    try {
      const images: SkillImageConfig[] = Array.from({ length: 5 }, (_, i) => ({
        id: `image-${i}`,
        imageRef: `quay.io/org/skill-${i}:v1`,
      }));
      const source: SourceConfig = {
        id: 'test',
        images,
        allowedRegistries: ['quay.io'],
        schedule: {
          frequency: { minutes: 10 },
          timeout: { minutes: 10 },
          initialDelay: { seconds: 0 },
          scope: 'local',
        },
      };
      const options = {
        ...DEFAULT_SKILL_IMAGE_OPTIONS,
        sourceOperationDeadlineMs: 120000,
        maxRetries: 0,
      };
      const parentController = new AbortController();
      const resultPromise = performSourceRefresh(
        source,
        options,
        logger,
        undefined,
        parentController.signal,
      );
      await started;
      expect(signals).toHaveLength(4);
      expect(signals.every(signal => !signal.aborted)).toBe(true);
      const deadline = timers.mock.calls.find(([, delay]) => delay === 120000);
      expect(deadline).toBeDefined();
      (deadline![0] as () => void)();
      expect(signals.every(signal => signal.aborted)).toBe(true);
      expect(signals[0].reason.message).toBe(
        'Source operation deadline exceeded',
      );
      const result = await resultPromise;
      expect(result.records).toHaveLength(0);
      expect(result.discoveryComplete).toBe(false);
      expect(result.failedKeys.sort()).toEqual(
        images.map(image => image.imageRef).sort(),
      );
      expect(fetchImage).toHaveBeenCalledTimes(4);
      expect(
        fetchImage.mock.calls.some(([ref]) =>
          ref.startsWith('quay.io/org/skill-4:'),
        ),
      ).toBe(false);
    } finally {
      timers.mockRestore();
    }
  });
});

describe('refresh cancellation cleanup', () => {
  const source: SourceConfig = {
    id: 'cancelled',
    images: [{ id: 'skill', imageRef: 'quay.io/org/skill:v1' }],
    allowedRegistries: ['quay.io'],
    schedule: {
      frequency: { minutes: 10 },
      timeout: { minutes: 10 },
      initialDelay: { seconds: 0 },
      scope: 'local',
    },
  };
  it('does not start acquisition when the parent was already cancelled', async () => {
    const controller = new AbortController();
    controller.abort(new Error('stopped'));
    const result = await performSourceRefresh(
      source,
      DEFAULT_SKILL_IMAGE_OPTIONS,
      logger,
      undefined,
      controller.signal,
    );
    expect(fetchImage).not.toHaveBeenCalled();
    expect(resolveManifest).not.toHaveBeenCalled();
    expect(result.discoveryComplete).toBe(false);
  });
  it('detaches the parent abort listener after a completed refresh', async () => {
    const controller = new AbortController();
    const add = jest.spyOn(controller.signal, 'addEventListener');
    const remove = jest.spyOn(controller.signal, 'removeEventListener');
    try {
      await performSourceRefresh(
        source,
        DEFAULT_SKILL_IMAGE_OPTIONS,
        logger,
        undefined,
        controller.signal,
      );
      expect(remove).toHaveBeenCalledWith('abort', add.mock.calls[0][1]);
    } finally {
      add.mockRestore();
      remove.mockRestore();
    }
  });
});

describe('normalization outcome handling', () => {
  it.each([
    { outcome: 'ambiguous', status: 'partial', failed: true },
    { outcome: 'non-skill', status: 'ready', failed: false },
    { outcome: 'normalized', status: 'partial', failed: true },
    { outcome: 'unsupported', status: 'partial', failed: true },
  ])(
    'handles $outcome without silently losing failures',
    async ({ outcome, status, failed }) => {
      // The invalid normalized/null and unknown cases exercise defensive handling
      // of an inconsistent or extended adapter at its boundary.
      const normalize = jest
        .mocked(normalizationAdapter.normalizeSkillImageExtraction)
        .mockReturnValueOnce({
          outcome: outcome as SkillImageNormalization['outcome'],
          record: null,
          diagnostics: [],
        });
      const imageRef = 'quay.io/org/skill:v1';
      const source: SourceConfig = {
        id: 'test',
        images: [{ id: 'skill', imageRef }],
        allowedRegistries: ['quay.io'],
        schedule: {
          frequency: { minutes: 10 },
          timeout: { minutes: 10 },
          scope: 'local',
        },
      };
      try {
        const result = await performSourceRefresh(
          source,
          { ...DEFAULT_SKILL_IMAGE_OPTIONS, maxRetries: 0 },
          logger,
          undefined,
          new AbortController().signal,
        );
        const snapshot = buildSnapshotFromRefresh(
          { id: 'test', type: 'oci' },
          result,
          true,
        );
        expect(snapshot.status).toBe(status);
        expect(snapshot.skills).toEqual([]);
        expect(result.discoveryComplete).toBe(!failed);
        expect(result.failedKeys).toEqual(failed ? [imageRef] : []);
        expect(result.failedImageRefs).toEqual(failed ? [imageRef] : []);
        expect(result.extractions.size).toBe(0);
        expect(cleanupSkillImageExtraction).toHaveBeenCalledTimes(1);
      } finally {
        normalize.mockRestore();
      }
    },
  );
});
