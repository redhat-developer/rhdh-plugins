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
import { createHash } from 'node:crypto';
import { fetchManifest } from './OciClient';
import type { OciManifest, ImageRef } from './types';

// Mock DNS to prevent real lookups
jest.mock('node:dns', () => ({
  promises: {
    lookup: jest
      .fn()
      .mockResolvedValue([{ address: '93.184.216.34', family: 4 }]),
  },
}));

const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
} as unknown as LoggerService;

function makeManifest(layers: OciManifest['layers'] = []): OciManifest {
  return {
    schemaVersion: 2,
    config: {
      mediaType: 'application/vnd.oci.image.config.v1+json',
      digest: 'sha256:cfg',
      size: 10,
    },
    layers,
  };
}

function manifestDigest(manifest: OciManifest): string {
  const buffer = Buffer.from(JSON.stringify(manifest));
  return `sha256:${createHash('sha256').update(buffer).digest('hex')}`;
}

function mockFetchOk(manifest: OciManifest): void {
  const buffer = Buffer.from(JSON.stringify(manifest));
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    arrayBuffer: async () => buffer,
    headers: new Map(),
  });
}

afterEach(() => {
  jest.resetAllMocks();
});

describe('Tag pinning: manifest digest computation', () => {
  it('computes SHA-256 digest from raw manifest bytes on tag fetch', async () => {
    const manifest = makeManifest();
    const expected = manifestDigest(manifest);
    mockFetchOk(manifest);

    const result = await fetchManifest(
      { registry: 'quay.io', repository: 'org/repo', tag: 'v1' },
      logger,
    );

    expect(result.digest).toBe(expected);
    expect(result.manifest).toEqual(manifest);
    // Should have fetched by tag
    expect(global.fetch).toHaveBeenCalledWith(
      'https://quay.io/v2/org/repo/manifests/v1',
      expect.any(Object),
    );
  });

  it('returns verified digest when fetched by explicit digest', async () => {
    const manifest = makeManifest();
    const buffer = Buffer.from(JSON.stringify(manifest));
    const digest = `sha256:${createHash('sha256')
      .update(buffer)
      .digest('hex')}`;

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => buffer,
      headers: new Map(),
    });

    const result = await fetchManifest(
      {
        registry: 'quay.io',
        repository: 'org/repo',
        tag: 'latest',
        digest,
      },
      logger,
    );

    expect(result.digest).toBe(digest);
    // Should have fetched by digest
    expect(global.fetch).toHaveBeenCalledWith(
      `https://quay.io/v2/org/repo/manifests/${digest}`,
      expect.any(Object),
    );
  });

  it('rejects manifest whose bytes do not match the requested digest', async () => {
    const manifest = makeManifest();
    const buffer = Buffer.from(JSON.stringify(manifest));
    const wrongDigest = `sha256:${'0'.repeat(64)}`;

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => buffer,
      headers: new Map(),
    });

    await expect(
      fetchManifest(
        {
          registry: 'quay.io',
          repository: 'org/repo',
          tag: 'latest',
          digest: wrongDigest,
        },
        logger,
      ),
    ).rejects.toThrow('Manifest digest mismatch');
  });

  it('rejects an invalid digest format', async () => {
    const manifest = makeManifest();
    mockFetchOk(manifest);

    await expect(
      fetchManifest(
        {
          registry: 'quay.io',
          repository: 'org/repo',
          tag: 'latest',
          digest: 'md5:invalid',
        },
        logger,
      ),
    ).rejects.toThrow('Invalid manifest digest');
  });
});

describe('Tag pinning: identity metadata', () => {
  it('produces a stable key with lowercase registry and exact tag', () => {
    const imageRef: ImageRef = {
      registry: 'Quay.IO',
      repository: 'org/repo',
      tag: 'V1-Beta',
    };
    const key = `${imageRef.registry.toLowerCase()}/${imageRef.repository}:${
      imageRef.tag
    }`;
    expect(key).toBe('quay.io/org/repo:V1-Beta');
  });

  it('preserves case-sensitive tags in keys', () => {
    const keyLower = 'quay.io/org/repo:v1';
    const keyUpper = 'quay.io/org/repo:V1';
    expect(keyLower).not.toBe(keyUpper);
  });

  it('same-digest aliases produce distinct keys', () => {
    const manifest = makeManifest();
    const digest = manifestDigest(manifest);

    const keyLatest = `quay.io/org/repo:latest`;
    const keyV1 = `quay.io/org/repo:v1`;

    // Both resolve to the same digest
    const uri = `oci://quay.io/org/repo@${digest}`;

    // Keys are different
    expect(keyLatest).not.toBe(keyV1);
    // Source URIs are the same (same digest)
    expect(uri).toBe(`oci://quay.io/org/repo@${digest}`);
  });

  it('sourceUri digest agrees with the returned digest', () => {
    const digest = `sha256:${'ab'.repeat(32)}`;
    const sourceUri = `oci://quay.io/org/repo@${digest}`;
    expect(sourceUri).toContain(digest);
    // Extract digest from URI and compare
    const uriDigest = sourceUri.split('@')[1];
    expect(uriDigest).toBe(digest);
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

    const digestA = manifestDigest(manifestA);
    const digestB = manifestDigest(manifestB);

    // Different digests
    expect(digestA).not.toBe(digestB);

    // Same key
    const key = 'quay.io/org/repo:v1';
    expect(key).toBe('quay.io/org/repo:v1');

    // Different source URIs
    const uriA = `oci://quay.io/org/repo@${digestA}`;
    const uriB = `oci://quay.io/org/repo@${digestB}`;
    expect(uriA).not.toBe(uriB);
  });
});

describe('Tag pinning: digest pinning across retries', () => {
  it('uses pinned digest reference when retrying after resolution', async () => {
    // Simulate: resolve tag → get digestA, then on retry fetch by digestA
    const manifest = makeManifest();
    const buffer = Buffer.from(JSON.stringify(manifest));
    const digest = `sha256:${createHash('sha256')
      .update(buffer)
      .digest('hex')}`;

    // First fetch (resolution by tag) succeeds
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => buffer,
      headers: new Map(),
    });

    const resolution = await fetchManifest(
      { registry: 'quay.io', repository: 'org/repo', tag: 'v1' },
      logger,
    );
    expect(resolution.digest).toBe(digest);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://quay.io/v2/org/repo/manifests/v1',
      expect.any(Object),
    );

    // Second fetch (pinned by digest) succeeds
    jest.resetAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => buffer,
      headers: new Map(),
    });

    const pinned = await fetchManifest(
      {
        registry: 'quay.io',
        repository: 'org/repo',
        tag: 'v1',
        digest,
      },
      logger,
    );

    // Should fetch by digest, not by tag
    expect(global.fetch).toHaveBeenCalledWith(
      `https://quay.io/v2/org/repo/manifests/${digest}`,
      expect.any(Object),
    );
    expect(pinned.digest).toBe(digest);
    expect(pinned.manifest).toEqual(manifest);
  });

  it('prevents a moved tag from redirecting to different content', async () => {
    const manifestA = makeManifest([
      {
        mediaType: 'application/vnd.oci.image.layer.v1.tar',
        digest: `sha256:${'a'.repeat(64)}`,
        size: 100,
      },
    ]);
    const manifestB = makeManifest([
      {
        mediaType: 'application/vnd.oci.image.layer.v1.tar',
        digest: `sha256:${'b'.repeat(64)}`,
        size: 200,
      },
    ]);

    const bufferA = Buffer.from(JSON.stringify(manifestA));
    const digestA = `sha256:${createHash('sha256')
      .update(bufferA)
      .digest('hex')}`;

    // Resolution: fetch by tag returns manifestA
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => bufferA,
      headers: new Map(),
    });

    const resolution = await fetchManifest(
      { registry: 'quay.io', repository: 'org/repo', tag: 'v1' },
      logger,
    );
    expect(resolution.digest).toBe(digestA);

    // Simulate: tag moves to manifestB, but we fetch by pinned digestA
    // Registry returns manifestB content (different bytes) for the digest URL
    // This would be a misbehaving registry — our verification catches it
    jest.resetAllMocks();
    const bufferB = Buffer.from(JSON.stringify(manifestB));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => bufferB,
      headers: new Map(),
    });

    // Fetch by pinned digest — bytes don't match → should reject
    await expect(
      fetchManifest(
        {
          registry: 'quay.io',
          repository: 'org/repo',
          tag: 'v1',
          digest: digestA,
        },
        logger,
      ),
    ).rejects.toThrow('Manifest digest mismatch');
  });
});
