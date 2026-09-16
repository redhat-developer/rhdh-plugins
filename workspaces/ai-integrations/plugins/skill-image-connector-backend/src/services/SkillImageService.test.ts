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
import {
  findLayerByTitle,
  validateSkillImageManifest,
  fetchAndExtractSkillImage,
} from './SkillImageService';
import { fetchManifest, fetchBlob } from './OciClient';
import type { OciDescriptor, OciManifest } from './types';

jest.mock('./OciClient', () => ({
  parseImageRef: jest.requireActual('./OciClient').parseImageRef,
  fetchManifest: jest.fn(),
  fetchBlob: jest.fn(),
}));

jest.mock('node:fs', () => ({
  ...jest.requireActual('node:fs'),
  promises: {
    mkdtemp: jest.fn(),
    writeFile: jest.fn(),
    rm: jest.fn(),
  },
}));

const mockedFetchManifest = fetchManifest as jest.MockedFunction<
  typeof fetchManifest
>;
const mockedFetchBlob = fetchBlob as jest.MockedFunction<typeof fetchBlob>;

describe('findLayerByTitle', () => {
  const layers: OciDescriptor[] = [
    {
      mediaType: 'application/vnd.oci.image.layer.v1.tar',
      digest: 'sha256:aaa',
      size: 100,
      annotations: {
        'org.opencontainers.image.title': 'skillimage.yaml',
      },
    },
    {
      mediaType: 'application/vnd.oci.image.layer.v1.tar',
      digest: 'sha256:bbb',
      size: 200,
      annotations: {
        'org.opencontainers.image.title': 'SKILLS.md',
      },
    },
    {
      mediaType: 'application/vnd.oci.image.layer.v1.tar',
      digest: 'sha256:ccc',
      size: 50,
    },
  ];

  it('should find layer by title annotation', () => {
    const layer = findLayerByTitle(layers, 'skillimage.yaml');
    expect(layer).toBeDefined();
    expect(layer!.digest).toBe('sha256:aaa');
  });

  it('should find SKILLS.md layer', () => {
    const layer = findLayerByTitle(layers, 'SKILLS.md');
    expect(layer).toBeDefined();
    expect(layer!.digest).toBe('sha256:bbb');
  });

  it('should return undefined for non-existent title', () => {
    const layer = findLayerByTitle(layers, 'nonexistent.txt');
    expect(layer).toBeUndefined();
  });

  it('should return undefined for layer without annotations', () => {
    const layer = findLayerByTitle(
      [{ mediaType: 'a', digest: 'sha256:x', size: 10 }],
      'skillimage.yaml',
    );
    expect(layer).toBeUndefined();
  });
});

describe('validateSkillImageManifest', () => {
  it('should pass for valid manifest with both layers', () => {
    const manifest: OciManifest = {
      schemaVersion: 2,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        digest: 'sha256:cfg',
        size: 10,
      },
      layers: [
        {
          mediaType: 'application/vnd.oci.image.layer.v1.tar',
          digest: 'sha256:aaa',
          size: 100,
          annotations: {
            'org.opencontainers.image.title': 'skillimage.yaml',
          },
        },
        {
          mediaType: 'application/vnd.oci.image.layer.v1.tar',
          digest: 'sha256:bbb',
          size: 200,
          annotations: {
            'org.opencontainers.image.title': 'SKILLS.md',
          },
        },
      ],
    };

    const result = validateSkillImageManifest(manifest);
    expect(result.skillImageYamlLayer.digest).toBe('sha256:aaa');
    expect(result.skillsMdLayer.digest).toBe('sha256:bbb');
  });

  it('should throw when skillimage.yaml layer is missing', () => {
    const manifest: OciManifest = {
      schemaVersion: 2,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        digest: 'sha256:cfg',
        size: 10,
      },
      layers: [
        {
          mediaType: 'application/vnd.oci.image.layer.v1.tar',
          digest: 'sha256:bbb',
          size: 200,
          annotations: {
            'org.opencontainers.image.title': 'SKILLS.md',
          },
        },
      ],
    };

    expect(() => validateSkillImageManifest(manifest)).toThrow(
      'missing layer(s) skillimage.yaml',
    );
  });

  it('should throw when SKILLS.md layer is missing', () => {
    const manifest: OciManifest = {
      schemaVersion: 2,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        digest: 'sha256:cfg',
        size: 10,
      },
      layers: [
        {
          mediaType: 'application/vnd.oci.image.layer.v1.tar',
          digest: 'sha256:aaa',
          size: 100,
          annotations: {
            'org.opencontainers.image.title': 'skillimage.yaml',
          },
        },
      ],
    };

    expect(() => validateSkillImageManifest(manifest)).toThrow(
      'missing layer(s) SKILLS.md',
    );
  });

  it('should throw when both layers are missing', () => {
    const manifest: OciManifest = {
      schemaVersion: 2,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        digest: 'sha256:cfg',
        size: 10,
      },
      layers: [
        {
          mediaType: 'application/vnd.oci.image.layer.v1.tar',
          digest: 'sha256:xxx',
          size: 50,
          annotations: {
            'org.opencontainers.image.title': 'something-else.txt',
          },
        },
      ],
    };

    expect(() => validateSkillImageManifest(manifest)).toThrow(
      'missing layer(s) skillimage.yaml, SKILLS.md',
    );
  });

  it('should throw when layers have no annotations', () => {
    const manifest: OciManifest = {
      schemaVersion: 2,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        digest: 'sha256:cfg',
        size: 10,
      },
      layers: [
        {
          mediaType: 'application/vnd.oci.image.layer.v1.tar',
          digest: 'sha256:xxx',
          size: 50,
        },
      ],
    };

    expect(() => validateSkillImageManifest(manifest)).toThrow(
      'missing layer(s) skillimage.yaml, SKILLS.md',
    );
  });

  it('should throw when manifest has no layers array', () => {
    const manifest = {
      schemaVersion: 2,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        digest: 'sha256:cfg',
        size: 10,
      },
    } as unknown as OciManifest;

    expect(() => validateSkillImageManifest(manifest)).toThrow(
      'does not contain a layers array',
    );
  });
});

describe('fetchAndExtractSkillImage', () => {
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  } as unknown as LoggerService;
  const fs = require('node:fs');

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should fetch, validate, and extract skill image files', async () => {
    const yamlContent = 'name: hello-world-skill\nversion: 1.0.0';
    const mdContent = '# Hello World Skill\n\nA test skill.';

    const manifest: OciManifest = {
      schemaVersion: 2,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        digest: 'sha256:cfg',
        size: 10,
      },
      layers: [
        {
          mediaType: 'application/vnd.oci.image.layer.v1.tar',
          digest: 'sha256:yaml-digest',
          size: yamlContent.length,
          annotations: {
            'org.opencontainers.image.title': 'skillimage.yaml',
          },
        },
        {
          mediaType: 'application/vnd.oci.image.layer.v1.tar',
          digest: 'sha256:md-digest',
          size: mdContent.length,
          annotations: {
            'org.opencontainers.image.title': 'SKILLS.md',
          },
        },
      ],
    };

    mockedFetchManifest.mockResolvedValue(manifest);
    mockedFetchBlob
      .mockResolvedValueOnce(Buffer.from(yamlContent))
      .mockResolvedValueOnce(Buffer.from(mdContent));

    (fs.promises.mkdtemp as jest.Mock).mockResolvedValue('/tmp/skill-image-xx');
    (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

    const result = await fetchAndExtractSkillImage(
      'quay.io/gabemontero/hello-world-skill:1.0.0-draft',
      '/tmp',
      logger,
    );

    expect(result.skillImageYaml).toBe(yamlContent);
    expect(result.skillsMd).toBe(mdContent);
    expect(result.skillImageYamlPath).toBe(
      '/tmp/skill-image-xx/skillimage.yaml',
    );
    expect(result.skillsMdPath).toBe('/tmp/skill-image-xx/SKILLS.md');

    expect(fs.promises.writeFile).toHaveBeenCalledTimes(2);
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      '/tmp/skill-image-xx/skillimage.yaml',
      Buffer.from(yamlContent),
      { mode: 0o600 },
    );
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      '/tmp/skill-image-xx/SKILLS.md',
      Buffer.from(mdContent),
      { mode: 0o600 },
    );

    // Verify fetchBlob was called with expectedSize parameter
    expect(mockedFetchBlob).toHaveBeenCalledWith(
      expect.any(Object),
      'sha256:yaml-digest',
      yamlContent.length,
      logger,
      undefined,
    );
    expect(mockedFetchBlob).toHaveBeenCalledWith(
      expect.any(Object),
      'sha256:md-digest',
      mdContent.length,
      logger,
      undefined,
    );
  });

  it('should throw when image does not meet skillimage format', async () => {
    const manifest: OciManifest = {
      schemaVersion: 2,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        digest: 'sha256:cfg',
        size: 10,
      },
      layers: [
        {
          mediaType: 'application/vnd.oci.image.layer.v1.tar',
          digest: 'sha256:xxx',
          size: 50,
          annotations: {
            'org.opencontainers.image.title': 'other-file.txt',
          },
        },
      ],
    };

    mockedFetchManifest.mockResolvedValue(manifest);

    await expect(
      fetchAndExtractSkillImage('quay.io/org/bad-image:v1', '/tmp', logger),
    ).rejects.toThrow('does not conform to the skillimage format');
  });

  it('should clean up temp directory on write failure', async () => {
    const yamlContent = 'name: test';
    const mdContent = '# Test';

    const manifest: OciManifest = {
      schemaVersion: 2,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        digest: 'sha256:cfg',
        size: 10,
      },
      layers: [
        {
          mediaType: 'application/vnd.oci.image.layer.v1.tar',
          digest: 'sha256:yaml-digest',
          size: yamlContent.length,
          annotations: {
            'org.opencontainers.image.title': 'skillimage.yaml',
          },
        },
        {
          mediaType: 'application/vnd.oci.image.layer.v1.tar',
          digest: 'sha256:md-digest',
          size: mdContent.length,
          annotations: {
            'org.opencontainers.image.title': 'SKILLS.md',
          },
        },
      ],
    };

    mockedFetchManifest.mockResolvedValue(manifest);
    mockedFetchBlob
      .mockResolvedValueOnce(Buffer.from(yamlContent))
      .mockResolvedValueOnce(Buffer.from(mdContent));

    (fs.promises.mkdtemp as jest.Mock).mockResolvedValue(
      '/tmp/skill-image-fail',
    );
    (fs.promises.writeFile as jest.Mock).mockRejectedValue(
      new Error('Disk full'),
    );
    (fs.promises.rm as jest.Mock).mockResolvedValue(undefined);

    await expect(
      fetchAndExtractSkillImage('quay.io/org/repo:v1', '/tmp', logger),
    ).rejects.toThrow('Disk full');

    expect(fs.promises.rm).toHaveBeenCalledWith('/tmp/skill-image-fail', {
      recursive: true,
      force: true,
    });
  });
});
