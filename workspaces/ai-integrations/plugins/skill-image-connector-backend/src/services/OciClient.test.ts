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
});

describe('fetchManifest', () => {
  const logger = mockServices.logger.mock();

  afterEach(() => {
    jest.restoreAllMocks();
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
      json: async () => mockManifest,
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
    });

    await expect(
      fetchManifest(
        { registry: 'quay.io', repository: 'org/repo', tag: 'v1' },
        logger,
      ),
    ).rejects.toThrow('Failed to fetch manifest');
  });
});

describe('fetchBlob', () => {
  const logger = mockServices.logger.mock();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should fetch and return blob as buffer', async () => {
    const content = 'name: test-skill';
    const arrayBuffer = new TextEncoder().encode(content).buffer;

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => arrayBuffer,
    });

    const result = await fetchBlob(
      { registry: 'quay.io', repository: 'org/repo', tag: 'v1' },
      'sha256:abc123',
      logger,
    );
    expect(result.toString('utf-8')).toBe(content);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://quay.io/v2/org/repo/blobs/sha256:abc123',
    );
  });

  it('should throw on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(
      fetchBlob(
        { registry: 'quay.io', repository: 'org/repo', tag: 'v1' },
        'sha256:abc123',
        logger,
      ),
    ).rejects.toThrow('Failed to fetch blob');
  });
});
