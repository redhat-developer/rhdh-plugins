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

import { mockServices } from '@backstage/backend-test-utils';
import { createHash } from 'node:crypto';
import { parseImageRef, fetchManifest, fetchBlob } from './OciClient';
import type { OciManifest } from './types';

describe('parseImageRef', () => {
  it('should parse a full image reference with tag', () => {
    const ref = parseImageRef(
      'quay.io/gabemontero/hello-world-skill:1.0.0-draft',
    );
    expect(ref).toEqual({
      registry: 'quay.io',
      repository: 'gabemontero/hello-world-skill',
      tag: '1.0.0-draft',
    });
  });

  it('should default tag to latest when omitted', () => {
    const ref = parseImageRef('quay.io/gabemontero/hello-world-skill');
    expect(ref).toEqual({
      registry: 'quay.io',
      repository: 'gabemontero/hello-world-skill',
      tag: 'latest',
    });
  });

  it('should strip oci:// prefix', () => {
    const ref = parseImageRef('oci://quay.io/gabemontero/hello-world-skill:v1');
    expect(ref).toEqual({
      registry: 'quay.io',
      repository: 'gabemontero/hello-world-skill',
      tag: 'v1',
    });
  });

  it('should handle nested repository paths', () => {
    const ref = parseImageRef('quay.io/org/sub/repo:2.0.0');
    expect(ref).toEqual({
      registry: 'quay.io',
      repository: 'org/sub/repo',
      tag: '2.0.0',
    });
  });

  it('should throw for invalid reference without slash', () => {
    expect(() => parseImageRef('invalid-ref')).toThrow(
      'Invalid image reference',
    );
  });

  it('should handle registry with port', () => {
    const ref = parseImageRef('localhost:5000/myrepo:latest');
    expect(ref).toEqual({
      registry: 'localhost:5000',
      repository: 'myrepo',
      tag: 'latest',
    });
  });

  it('should parse digest references', () => {
    const ref = parseImageRef(
      'quay.io/org/repo@sha256:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    );
    expect(ref).toEqual({
      registry: 'quay.io',
      repository: 'org/repo',
      tag: 'latest',
      digest:
        'sha256:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    });
  });

  it('should throw for empty string', () => {
    expect(() => parseImageRef('')).toThrow('reference must not be empty');
  });

  it('should throw for whitespace-only string', () => {
    expect(() => parseImageRef('   ')).toThrow('reference must not be empty');
  });

  it('should throw for digest with invalid algorithm', () => {
    expect(() => parseImageRef('quay.io/org/repo@md5:abc')).toThrow(
      'digest must start with a hash algorithm',
    );
  });
});

describe('fetchManifest', () => {
  const logger = mockServices.logger.mock();

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should fetch and return manifest', async () => {
    const mockManifest: OciManifest = {
      schemaVersion: 2,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        digest: 'sha256:config',
        size: 100,
      },
      layers: [
        {
          mediaType: 'application/vnd.oci.image.layer.v1.tar',
          digest: 'sha256:abc',
          size: 200,
          annotations: {
            'org.opencontainers.image.title': 'skillimage.yaml',
          },
        },
      ],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockManifest,
      headers: new Map(),
    });

    const result = await fetchManifest(
      { registry: 'quay.io', repository: 'org/repo', tag: 'v1' },
      logger,
    );
    expect(result).toEqual(mockManifest);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://quay.io/v2/org/repo/manifests/v1',
      expect.objectContaining({
        headers: expect.objectContaining({ Accept: expect.any(String) }),
      }),
    );
  });

  it('should throw on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Map(),
    });

    await expect(
      fetchManifest(
        { registry: 'quay.io', repository: 'org/repo', tag: 'v1' },
        logger,
      ),
    ).rejects.toThrow('Failed to fetch manifest');
  });

  it('should throw on manifest list response', async () => {
    const mockManifestList = {
      schemaVersion: 2,
      mediaType: 'application/vnd.oci.image.index.v1+json',
      manifests: [
        {
          mediaType: 'application/vnd.oci.image.manifest.v1+json',
          digest: 'sha256:abc',
          size: 100,
        },
      ],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockManifestList,
      headers: new Map(),
    });

    await expect(
      fetchManifest(
        { registry: 'quay.io', repository: 'org/repo', tag: 'v1' },
        logger,
      ),
    ).rejects.toThrow('manifest list');
  });

  it('should use digest instead of tag when available', async () => {
    const mockManifest: OciManifest = {
      schemaVersion: 2,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        digest: 'sha256:config',
        size: 100,
      },
      layers: [],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockManifest,
      headers: new Map(),
    });

    await fetchManifest(
      {
        registry: 'quay.io',
        repository: 'org/repo',
        tag: 'latest',
        digest: 'sha256:abcdef',
      },
      logger,
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'https://quay.io/v2/org/repo/manifests/sha256:abcdef',
      expect.any(Object),
    );
  });

  it('should handle 401 with bearer token exchange', async () => {
    const mockManifest: OciManifest = {
      schemaVersion: 2,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        digest: 'sha256:config',
        size: 100,
      },
      layers: [],
    };

    const headersMap = new Map([
      [
        'www-authenticate',
        'Bearer realm="https://auth.example.com/token",service="registry.example.com",scope="repository:org/repo:pull"',
      ],
    ]);

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: { get: (k: string) => headersMap.get(k) ?? null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ token: 'test-token-123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockManifest,
        headers: new Map(),
      });

    const result = await fetchManifest(
      { registry: 'registry.example.com', repository: 'org/repo', tag: 'v1' },
      logger,
    );
    expect(result).toEqual(mockManifest);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('should throw when fetch itself rejects', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    await expect(
      fetchManifest(
        { registry: 'quay.io', repository: 'org/repo', tag: 'v1' },
        logger,
      ),
    ).rejects.toThrow('Network error');
  });
});

describe('fetchBlob', () => {
  const logger = mockServices.logger.mock();

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should fetch and return blob as buffer with digest verification', async () => {
    const content = 'name: test-skill';
    const contentBuffer = Buffer.from(content);
    const hash = createHash('sha256').update(contentBuffer).digest('hex');
    const digest = `sha256:${hash}`;
    const arrayBuffer = new TextEncoder().encode(content).buffer;

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => arrayBuffer,
      headers: new Map(),
    });

    const result = await fetchBlob(
      { registry: 'quay.io', repository: 'org/repo', tag: 'v1' },
      digest,
      content.length,
      logger,
    );
    expect(result.toString('utf-8')).toBe(content);
  });

  it('should throw on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: new Map(),
    });

    await expect(
      fetchBlob(
        { registry: 'quay.io', repository: 'org/repo', tag: 'v1' },
        'sha256:abc123',
        100,
        logger,
      ),
    ).rejects.toThrow('Failed to fetch blob');
  });

  it('should throw when expected size exceeds maximum', async () => {
    await expect(
      fetchBlob(
        { registry: 'quay.io', repository: 'org/repo', tag: 'v1' },
        'sha256:abc123',
        100 * 1024 * 1024, // 100 MB
        logger,
      ),
    ).rejects.toThrow('exceeds maximum allowed size');
  });

  it('should throw on digest mismatch', async () => {
    const content = 'tampered content';
    const arrayBuffer = new TextEncoder().encode(content).buffer;

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => arrayBuffer,
      headers: new Map(),
    });

    await expect(
      fetchBlob(
        { registry: 'quay.io', repository: 'org/repo', tag: 'v1' },
        'sha256:0000000000000000000000000000000000000000000000000000000000000000',
        content.length,
        logger,
      ),
    ).rejects.toThrow('Blob digest mismatch');
  });

  it('should throw when fetch itself rejects', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Connection refused'));

    await expect(
      fetchBlob(
        { registry: 'quay.io', repository: 'org/repo', tag: 'v1' },
        'sha256:abc123',
        100,
        logger,
      ),
    ).rejects.toThrow('Connection refused');
  });
});
