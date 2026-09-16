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
import { parseImageRef, fetchManifest, fetchBlob } from './OciClient';
import type { OciManifest } from './types';

const validSha256Digest = `sha256:${'a'.repeat(64)}`;

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

  it('should parse tag and digest references without leaking the tag', () => {
    const ref = parseImageRef(`quay.io/org/repo:v1@sha256:${'a'.repeat(64)}`);
    expect(ref).toEqual({
      registry: 'quay.io',
      repository: 'org/repo',
      tag: 'v1',
      digest: validSha256Digest,
    });
  });

  it('should reject an empty tag', () => {
    expect(() => parseImageRef('quay.io/org/repo:')).toThrow(
      'tag must not be empty',
    );
  });

  it('should throw for empty string', () => {
    expect(() => parseImageRef('')).toThrow('reference must not be empty');
  });

  it('should throw for whitespace-only string', () => {
    expect(() => parseImageRef('   ')).toThrow('reference must not be empty');
  });

  it('should throw for digest with invalid algorithm', () => {
    expect(() => parseImageRef('quay.io/org/repo@md5:abc')).toThrow(
      'digest must be a valid sha256 or sha512 digest',
    );
  });
});

describe('fetchManifest', () => {
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  } as unknown as LoggerService;

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
      arrayBuffer: async () => Buffer.from(JSON.stringify(mockManifest)),
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
      arrayBuffer: async () => Buffer.from(JSON.stringify(mockManifestList)),
      headers: new Map(),
    });

    await expect(
      fetchManifest(
        { registry: 'quay.io', repository: 'org/repo', tag: 'v1' },
        logger,
      ),
    ).rejects.toThrow('manifest list');
  });

  it('should reject an oversized manifest response before parsing', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => Buffer.alloc(5 * 1024 * 1024 + 1),
      headers: new Map(),
    });

    await expect(
      fetchManifest(
        { registry: 'quay.io', repository: 'org/repo', tag: 'v1' },
        logger,
      ),
    ).rejects.toThrow('exceeds maximum allowed size');
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
    const manifestBuffer = Buffer.from(JSON.stringify(mockManifest));
    const manifestDigest = `sha256:${createHash('sha256')
      .update(manifestBuffer)
      .digest('hex')}`;

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockManifest,
      arrayBuffer: async () => manifestBuffer,
      headers: new Map(),
    });

    await fetchManifest(
      {
        registry: 'quay.io',
        repository: 'org/repo',
        tag: 'latest',
        digest: manifestDigest,
      },
      logger,
    );
    expect(global.fetch).toHaveBeenCalledWith(
      `https://quay.io/v2/org/repo/manifests/${manifestDigest}`,
      expect.any(Object),
    );
  });

  it('should reject a digest reference when the manifest bytes do not match', async () => {
    const manifest: OciManifest = {
      schemaVersion: 2,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        digest: 'sha256:config',
        size: 100,
      },
      layers: [],
    };
    const manifestBuffer = Buffer.from(JSON.stringify(manifest));

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => manifestBuffer,
      headers: new Map(),
    });

    await expect(
      fetchManifest(
        {
          registry: 'quay.io',
          repository: 'org/repo',
          tag: 'latest',
          digest: validSha256Digest,
        },
        logger,
      ),
    ).rejects.toThrow('Manifest digest mismatch');
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
    const cancelUnauthorizedBody = jest.fn().mockResolvedValue(undefined);

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: { get: (k: string) => headersMap.get(k) ?? null },
        body: { cancel: cancelUnauthorizedBody },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ token: 'test-token-123' }),
        arrayBuffer: async () =>
          Buffer.from(JSON.stringify({ token: 'test-token-123' })),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockManifest,
        arrayBuffer: async () => Buffer.from(JSON.stringify(mockManifest)),
        headers: new Map(),
      });

    const result = await fetchManifest(
      { registry: 'registry.example.com', repository: 'org/repo', tag: 'v1' },
      logger,
    );
    expect(result).toEqual(mockManifest);
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(cancelUnauthorizedBody).toHaveBeenCalled();
  });

  it('should fall back when the bearer token response is invalid JSON', async () => {
    const headersMap = new Map([
      ['www-authenticate', 'Bearer realm="https://auth.example.com/token"'],
    ]);

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: { get: (key: string) => headersMap.get(key) ?? null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        arrayBuffer: async () => Buffer.from('not-json'),
        headers: new Map(),
      });

    await expect(
      fetchManifest(
        { registry: 'registry.example.com', repository: 'org/repo', tag: 'v1' },
        logger,
      ),
    ).rejects.toThrow('Failed to fetch manifest');
    expect(logger.warn).toHaveBeenCalledWith(
      'Bearer token response was not valid JSON',
      expect.any(Error),
    );
  });

  it('should use configured credentials for registry and token requests', async () => {
    const mockManifest: OciManifest = {
      schemaVersion: 2,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        digest: 'sha256:config',
        size: 100,
      },
      layers: [],
    };
    const credentials = {
      username: 'user',
      password: 'secret',
      tokenRealm: 'https://auth.example.com/token',
    };

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: {
          get: () =>
            'Bearer realm="https://auth.example.com/token",service="registry.example.com"',
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: 'test-token-123' }),
        arrayBuffer: async () =>
          Buffer.from(JSON.stringify({ access_token: 'test-token-123' })),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockManifest,
        arrayBuffer: async () => Buffer.from(JSON.stringify(mockManifest)),
        headers: new Map(),
      });

    await fetchManifest(
      { registry: 'registry.example.com', repository: 'org/repo', tag: 'v1' },
      logger,
      credentials,
    );

    const calls = (global.fetch as jest.Mock).mock.calls;
    expect(calls[0][1].headers.Authorization).toMatch(/^Basic /);
    expect(calls[1][1].headers.Authorization).toMatch(/^Basic /);
    expect(calls[2][1].headers.Authorization).toBe('Bearer test-token-123');
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
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  } as unknown as LoggerService;

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
        validSha256Digest,
        100,
        logger,
      ),
    ).rejects.toThrow('Failed to fetch blob');
  });

  it('should throw when expected size exceeds maximum', async () => {
    await expect(
      fetchBlob(
        { registry: 'quay.io', repository: 'org/repo', tag: 'v1' },
        validSha256Digest,
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
        validSha256Digest,
        100,
        logger,
      ),
    ).rejects.toThrow('Connection refused');
  });

  it('should verify sha512 digests', async () => {
    const content = Buffer.from('sha512 content');
    const digest = `sha512:${createHash('sha512')
      .update(content)
      .digest('hex')}`;

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () =>
        content.buffer.slice(
          content.byteOffset,
          content.byteOffset + content.byteLength,
        ),
      headers: new Map(),
    });

    await expect(
      fetchBlob(
        { registry: 'quay.io', repository: 'org/repo', tag: 'v1' },
        digest,
        content.length,
        logger,
      ),
    ).resolves.toEqual(content);
  });

  it('should enforce the size limit while streaming a blob', async () => {
    const content = Buffer.from('streamed content');
    const digest = `sha256:${createHash('sha256')
      .update(content)
      .digest('hex')}`;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(content);
        controller.close();
      },
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body,
      headers: new Map(),
    });

    await expect(
      fetchBlob(
        { registry: 'quay.io', repository: 'org/repo', tag: 'v1' },
        digest,
        content.length,
        logger,
      ),
    ).resolves.toEqual(content);
  });
});
