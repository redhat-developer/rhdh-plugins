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
import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import type { Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import request from 'supertest';
import {
  buildAcquisitionKey,
  buildSourceUri,
  skillImageConnectorPlugin,
} from './plugin';
import * as imageService from './services/SkillImageService';
import type { ImageRef } from './services/types';
import { makeManifest, computeManifestDigest } from './testUtils';

// Mock DNS resolution so integration tests don't fail with real DNS lookups.
// By default, resolve all hostnames to a public IP.
jest.mock('node:dns', () => ({
  promises: {
    lookup: jest
      .fn()
      .mockResolvedValue([{ address: '93.184.216.34', family: 4 }]),
  },
}));

// Observe metadata passed to cleanup while retaining real acquisition and cleanup.
jest.mock('./services/SkillImageService', () => {
  const actual = jest.requireActual<
    typeof import('./services/SkillImageService')
  >('./services/SkillImageService');
  return {
    ...actual,
    cleanupSkillImageExtraction: jest.fn(actual.cleanupSkillImageExtraction),
  };
});

const imageRef = 'registry.example.com/org/skill:v1';
const registryUrl = 'https://registry.example.com/v2/org/skill';
const hash = (bytes: Buffer) =>
  `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

function fixture(name: string) {
  const yaml = Buffer.from(`name: ${name}\n`);
  const markdown = Buffer.from(`# ${name}\n`);
  const manifest = Buffer.from(
    JSON.stringify({
      schemaVersion: 2,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        digest: hash(Buffer.from('{}')),
        size: 2,
      },
      layers: [
        {
          mediaType: 'application/octet-stream',
          digest: hash(yaml),
          size: yaml.length,
          annotations: { 'org.opencontainers.image.title': 'skillimage.yaml' },
        },
        {
          mediaType: 'application/octet-stream',
          digest: hash(markdown),
          size: markdown.length,
          annotations: { 'org.opencontainers.image.title': 'SKILLS.md' },
        },
      ],
    }),
  );
  return { yaml, markdown, manifest, digest: hash(manifest) };
}

async function waitForCompletion(server: Server) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const response = await request(server)
      .get('/api/skill-image-connector/images')
      .set('Authorization', mockCredentials.user.header());
    expect(response.status).toBe(200);
    if (response.body.status !== 'loading') return response.body;
    await delay(5);
  }
  throw new Error('Image processing did not complete');
}

describe('tag pinning through plugin acquisition', () => {
  const original = fixture('original');
  const moved = fixture('moved');
  let workDir: string;
  let tagRequests: number;
  let blobAttempts: number;
  let mode:
    | 'retry'
    | 'manifest-mismatch'
    | 'blob-digest'
    | 'blob-size'
    | 'resolution-retry'
    | 'digest'
    | 'aliases';
  let urls: string[];
  const logger = mockServices.logger.mock();

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'pinning-test-'));
    tagRequests = 0;
    blobAttempts = 0;
    urls = [];
    logger.child.mockReturnValue(logger);
    jest.spyOn(global, 'fetch').mockImplementation(async input => {
      const url = String(input);
      urls.push(url);
      if (
        ['v1', 'V1', 'latest'].some(
          tag => url === `${registryUrl}/manifests/${tag}`,
        )
      ) {
        tagRequests++;
        if (mode === 'resolution-retry' && tagRequests === 1)
          return new Response(null, { status: 503 });
        return new Response(
          tagRequests === 1 || mode === 'resolution-retry' || mode === 'aliases'
            ? original.manifest
            : moved.manifest,
        );
      }
      if (url === `${registryUrl}/manifests/${original.digest}`) {
        return new Response(
          mode === 'manifest-mismatch' ? moved.manifest : original.manifest,
        );
      }
      if (url === `${registryUrl}/manifests/${moved.digest}`)
        return new Response(moved.manifest);
      if (url === `${registryUrl}/blobs/${hash(original.yaml)}`) {
        blobAttempts++;
        if (mode === 'retry' && blobAttempts === 1)
          return new Response(null, { status: 503 });
        if (mode === 'blob-digest')
          return new Response(Buffer.alloc(original.yaml.length, 'x'));
        if (mode === 'blob-size') return new Response(Buffer.from('short'));
        return new Response(original.yaml);
      }
      for (const current of [original, moved]) {
        if (url === `${registryUrl}/blobs/${hash(current.markdown)}`)
          return new Response(current.markdown);
        if (url === `${registryUrl}/blobs/${hash(current.yaml)}`)
          return new Response(current.yaml);
      }
      throw new Error(`Unexpected registry request: ${url}`);
    });
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    await rm(workDir, { recursive: true, force: true });
  });

  async function acquire(ref: string | string[] = imageRef) {
    const backend = await startTestBackend({
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
            backend: {
              baseUrl: 'http://localhost:7007',
              workingDirectory: workDir,
            },
            skillImageConnector: {
              allowedRegistries: ['registry.example.com'],
              images: (Array.isArray(ref) ? ref : [ref]).map(value => ({
                imageRef: value,
              })),
              maxRetries: 1,
              retryBaseDelayMs: 1,
            },
          },
        }),
      ],
    });
    try {
      return await waitForCompletion(backend.server);
    } finally {
      await backend.stop();
    }
  }

  it('resolves once and retains the original manifest and blobs across an extraction retry and tag movement', async () => {
    mode = 'retry';
    const result = await acquire();
    expect(result).toEqual({
      status: 'ready',
      failedImages: [],
      images: [
        {
          imageRef,
          skillImageYaml: original.yaml.toString(),
          skillsMd: original.markdown.toString(),
        },
      ],
    });
    expect(tagRequests).toBe(1);
    expect(blobAttempts).toBe(2);
    expect(urls.filter(url => url.includes('/manifests/'))).toEqual([
      `${registryUrl}/manifests/v1`,
      `${registryUrl}/manifests/${original.digest}`,
      `${registryUrl}/manifests/${original.digest}`,
    ]);

    // A separate acquisition can observe the tag's new content without changing its reference.
    const later = await acquire();
    expect(later.images).toEqual([
      {
        imageRef,
        skillImageYaml: moved.yaml.toString(),
        skillsMd: moved.markdown.toString(),
      },
    ]);
    expect(tagRequests).toBe(2);
    expect(urls).toContain(`${registryUrl}/manifests/${moved.digest}`);
    const metadata = jest
      .mocked(imageService.cleanupSkillImageExtraction)
      .mock.calls.map(([extraction]) => extraction.acquisition)
      .filter(Boolean);
    expect(metadata).toEqual([
      {
        key: imageRef,
        digest: original.digest,
        sourceUri: `oci://registry.example.com/org/skill@${original.digest}`,
      },
      {
        key: imageRef,
        digest: moved.digest,
        sourceUri: `oci://registry.example.com/org/skill@${moved.digest}`,
      },
    ]);
  });

  it('keeps case-sensitive aliases distinct while exposing the same verified digest and source URI', async () => {
    mode = 'aliases';
    const refs = ['v1', 'V1', 'latest'].map(
      tag => `registry.example.com/org/skill:${tag}`,
    );
    const result = await acquire(refs);
    expect(result.status).toBe('ready');
    expect(
      result.images.map((image: { imageRef: string }) => image.imageRef).sort(),
    ).toEqual([...refs].sort());
    const metadata = jest
      .mocked(imageService.cleanupSkillImageExtraction)
      .mock.calls.map(([extraction]) => extraction.acquisition);
    expect(metadata).toHaveLength(3);
    expect(metadata).toEqual(
      expect.arrayContaining(
        refs.map(key => ({
          key,
          digest: original.digest,
          sourceUri: `oci://registry.example.com/org/skill@${original.digest}`,
        })),
      ),
    );
  });

  it('retries a failed resolution before pinning the successfully resolved digest', async () => {
    mode = 'resolution-retry';
    const result = await acquire();
    expect(result.status).toBe('ready');
    expect(tagRequests).toBe(2);
    expect(urls.filter(url => url.includes('/manifests/'))).toEqual([
      `${registryUrl}/manifests/v1`,
      `${registryUrl}/manifests/v1`,
      `${registryUrl}/manifests/${original.digest}`,
    ]);
  });

  it('rejects a pinned manifest mismatch before downloading any layers', async () => {
    mode = 'manifest-mismatch';
    expect(await acquire()).toEqual({
      status: 'failed',
      images: [],
      failedImages: [imageRef],
    });
    expect(urls.some(url => url.includes('/blobs/'))).toBe(false);
    expect(tagRequests).toBe(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        message: expect.stringContaining('Manifest digest mismatch'),
      }),
    );
  });

  it.each(['blob-digest', 'blob-size'] as const)(
    'rejects %s corruption before exposing extracted content',
    async corruption => {
      mode = corruption;
      expect(await acquire()).toEqual({
        status: 'failed',
        images: [],
        failedImages: [imageRef],
      });
      expect(blobAttempts).toBe(1);
      expect(logger.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          message: expect.stringContaining(
            corruption === 'blob-digest'
              ? 'Blob digest mismatch'
              : 'size mismatch',
          ),
        }),
      );
    },
  );

  it('preserves explicitly digest-addressed raw acquisition without resolving a tag', async () => {
    mode = 'digest';
    const digestRef = `registry.example.com/org/skill@${original.digest}`;
    const result = await acquire(digestRef);
    expect(result.images).toEqual([
      {
        imageRef: digestRef,
        skillImageYaml: original.yaml.toString(),
        skillsMd: original.markdown.toString(),
      },
    ]);
    expect(tagRequests).toBe(0);
    expect(urls.filter(url => url.includes('/manifests/'))).toEqual([
      `${registryUrl}/manifests/${original.digest}`,
    ]);
  });
});

describe('tag pinning: identity metadata', () => {
  it('produces a stable key with lowercase registry and exact tag', () => {
    const ref: ImageRef = {
      registry: 'Quay.IO',
      repository: 'org/repo',
      tag: 'V1-Beta',
    };
    const key = buildAcquisitionKey(ref);
    expect(key).toBe('quay.io/org/repo:V1-Beta');
  });

  it('preserves case-sensitive tags in keys', () => {
    const keyLower = buildAcquisitionKey({
      registry: 'quay.io',
      repository: 'org/repo',
      tag: 'v1',
    });
    const keyUpper = buildAcquisitionKey({
      registry: 'quay.io',
      repository: 'org/repo',
      tag: 'V1',
    });
    expect(keyLower).not.toBe(keyUpper);
  });

  it('same-digest aliases produce distinct keys', () => {
    const manifest = makeManifest();
    const digest = computeManifestDigest(manifest);

    const keyLatest = buildAcquisitionKey({
      registry: 'quay.io',
      repository: 'org/repo',
      tag: 'latest',
    });
    const keyV1 = buildAcquisitionKey({
      registry: 'quay.io',
      repository: 'org/repo',
      tag: 'v1',
    });

    // Both resolve to the same digest — same source URI
    const uri = buildSourceUri('quay.io', 'org/repo', digest);

    // Keys are different
    expect(keyLatest).not.toBe(keyV1);
    // Source URIs are the same (same digest)
    expect(uri).toBe(`oci://quay.io/org/repo@${digest}`);
  });

  it('sourceUri digest agrees with the returned digest', () => {
    const digest = `sha256:${'ab'.repeat(32)}`;
    const sourceUri = buildSourceUri('quay.io', 'org/repo', digest);
    expect(sourceUri).toContain(digest);
    // Extract digest from URI and compare
    const uriDigest = sourceUri.split('@')[1];
    expect(uriDigest).toBe(digest);
  });

  it('sourceUri lowercases the registry to match the acquisition key', () => {
    const digest = `sha256:${'ab'.repeat(32)}`;
    const sourceUri = buildSourceUri('Quay.IO', 'org/repo', digest);
    expect(sourceUri).toBe(`oci://quay.io/org/repo@${digest}`);
  });

  it('tag moving to new content keeps the same key', () => {
    const manifestA = makeManifest([
      {
        mediaType: 'application/vnd.oci.image.layer.v1.tar',
        digest: 'sha256:aaa',
        size: 100,
      },
    ]);
    const manifestB = makeManifest([
      {
        mediaType: 'application/vnd.oci.image.layer.v1.tar',
        digest: 'sha256:bbb',
        size: 200,
      },
    ]);

    const digestA = computeManifestDigest(manifestA);
    const digestB = computeManifestDigest(manifestB);

    // Different digests
    expect(digestA).not.toBe(digestB);

    // Same key from the production function
    const ref: ImageRef = {
      registry: 'quay.io',
      repository: 'org/repo',
      tag: 'v1',
    };
    const keyA = buildAcquisitionKey(ref);
    const keyB = buildAcquisitionKey(ref);
    expect(keyA).toBe(keyB);

    // Different source URIs from the production function
    const uriA = buildSourceUri('quay.io', 'org/repo', digestA);
    const uriB = buildSourceUri('quay.io', 'org/repo', digestB);
    expect(uriA).not.toBe(uriB);
  });
});
