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
import { gzipSync } from 'node:zlib';
import { createTarArchive } from '../testUtils';
import {
  findLayerByTitle,
  validateSkillImageManifest,
  fetchAndExtractSkillImage,
  cleanupStaleExtractionDirs,
  parseTarEntries,
  NonSkillImageError,
  AmbiguousSkillFilesError,
  ExtractionBoundsError,
} from './SkillImageService';
import { fetchManifest, fetchBlob } from './OciClient';
import { DEFAULT_SKILL_IMAGE_OPTIONS } from './types';
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
    readdir: jest.fn(),
    readFile: jest.fn(),
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

describe('parseTarEntries', () => {
  it('should parse entries from a tar archive', () => {
    const tar = createTarArchive([
      { name: 'skill.yaml', content: 'name: test' },
      { name: 'SKILL.md', content: '# Test' },
    ]);
    const entries = parseTarEntries(tar);
    expect(entries).toHaveLength(2);
    expect(entries[0].name).toBe('skill.yaml');
    expect(entries[0].data.toString('utf-8')).toBe('name: test');
    expect(entries[1].name).toBe('SKILL.md');
    expect(entries[1].data.toString('utf-8')).toBe('# Test');
  });

  it('should strip leading ./ from tar entry names', () => {
    const tar = createTarArchive([
      { name: './skill.yaml', content: 'name: test' },
    ]);
    const entries = parseTarEntries(tar);
    expect(entries[0].name).toBe('skill.yaml');
  });

  it('should return empty array for zero-block archive', () => {
    const entries = parseTarEntries(Buffer.alloc(1024));
    expect(entries).toEqual([]);
  });
});

describe('validateSkillImageManifest', () => {
  it('should return annotated strategy for valid manifest with annotated layers', () => {
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
    expect(result.mode).toBe('annotated');
    expect(
      result.mode === 'annotated' ? result.skillImageYamlLayer.digest : '',
    ).toBe('sha256:aaa');
    expect(result.mode === 'annotated' ? result.skillsMdLayer.digest : '').toBe(
      'sha256:bbb',
    );
  });

  it('should accept skill.yaml and SKILL.md as alternative names', () => {
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
            'org.opencontainers.image.title': 'skill.yaml',
          },
        },
        {
          mediaType: 'application/vnd.oci.image.layer.v1.tar',
          digest: 'sha256:bbb',
          size: 200,
          annotations: {
            'org.opencontainers.image.title': 'SKILL.md',
          },
        },
      ],
    };

    const result = validateSkillImageManifest(manifest);
    expect(result.mode).toBe('annotated');
  });

  it('should return tar strategy for tar+gzip layers', () => {
    const manifest: OciManifest = {
      schemaVersion: 2,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        digest: 'sha256:cfg',
        size: 10,
      },
      layers: [
        {
          mediaType: 'application/vnd.oci.image.layer.v1.tar+gzip',
          digest: 'sha256:xxx',
          size: 500,
        },
      ],
    };

    const result = validateSkillImageManifest(manifest);
    expect(result.mode).toBe('tar');
    expect(result.mode === 'tar' ? result.layers : []).toHaveLength(1);
  });

  it('should return non-skill when no annotated layers and no tar layers', () => {
    const manifest: OciManifest = {
      schemaVersion: 2,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        digest: 'sha256:cfg',
        size: 10,
      },
      layers: [
        {
          mediaType: 'application/octet-stream',
          digest: 'sha256:xxx',
          size: 50,
          annotations: {
            'org.opencontainers.image.title': 'something-else.txt',
          },
        },
      ],
    };

    expect(validateSkillImageManifest(manifest)).toEqual({
      mode: 'non-skill',
    });
  });

  it('should return non-skill when layers have no annotations and are not tar type', () => {
    const manifest: OciManifest = {
      schemaVersion: 2,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        digest: 'sha256:cfg',
        size: 10,
      },
      layers: [
        {
          mediaType: 'application/octet-stream',
          digest: 'sha256:xxx',
          size: 50,
        },
      ],
    };

    expect(validateSkillImageManifest(manifest)).toEqual({
      mode: 'non-skill',
    });
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

  it('should fetch, validate, and extract annotated skill image files', async () => {
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

    mockedFetchManifest.mockResolvedValue({
      manifest,
      digest: `sha256:${'a'.repeat(64)}`,
    });
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

    // 3 writeFile calls: .owner lock, skillimage.yaml, SKILLS.md
    expect(fs.promises.writeFile).toHaveBeenCalledTimes(3);
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      '/tmp/skill-image-xx/.owner',
      `${process.pid}`,
      { mode: 0o600 },
    );
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
      expect.anything(),
      expect.objectContaining({ maxBlobSizeBytes: 5242880 }),
    );
    expect(mockedFetchBlob).toHaveBeenCalledWith(
      expect.any(Object),
      'sha256:md-digest',
      mdContent.length,
      logger,
      undefined,
      expect.anything(),
      expect.objectContaining({ maxBlobSizeBytes: 5242880 }),
    );
  });

  it('should extract files from a tar+gzip layer', async () => {
    const yamlContent = 'name: hello-world-skill\nversion: 1.0.0';
    const mdContent = '# Hello World Skill';

    const tarArchive = createTarArchive([
      { name: 'skill.yaml', content: yamlContent },
      { name: 'SKILL.md', content: mdContent },
    ]);
    const gzippedTar = gzipSync(tarArchive);

    const manifest: OciManifest = {
      schemaVersion: 2,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        digest: 'sha256:cfg',
        size: 10,
      },
      layers: [
        {
          mediaType: 'application/vnd.oci.image.layer.v1.tar+gzip',
          digest: 'sha256:tar-digest',
          size: gzippedTar.length,
        },
      ],
    };

    mockedFetchManifest.mockResolvedValue({
      manifest,
      digest: `sha256:${'a'.repeat(64)}`,
    });
    mockedFetchBlob.mockResolvedValueOnce(gzippedTar);

    (fs.promises.mkdtemp as jest.Mock).mockResolvedValue('/tmp/skill-image-xx');
    (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

    const result = await fetchAndExtractSkillImage(
      'quay.io/gabemontero/hello-world-skill:1.0.0-draft',
      '/tmp',
      logger,
    );

    expect(result.skillImageYaml).toBe(yamlContent);
    expect(result.skillsMd).toBe(mdContent);
  });

  it('enforces a configured decompressed layer limit', async () => {
    const yamlContent = 'name: hello-world-skill\nversion: 1.0.0';
    const mdContent = '# Hello World Skill';

    const tarArchive = createTarArchive([
      { name: 'skill.yaml', content: yamlContent },
      { name: 'SKILL.md', content: mdContent },
    ]);
    const gzippedTar = gzipSync(tarArchive);

    const manifest: OciManifest = {
      schemaVersion: 2,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        digest: 'sha256:cfg',
        size: 10,
      },
      layers: [
        {
          mediaType: 'application/vnd.oci.image.layer.v1.tar+gzip',
          digest: 'sha256:tar-digest',
          size: gzippedTar.length,
        },
      ],
    };

    mockedFetchManifest.mockResolvedValue({
      manifest,
      digest: `sha256:${'a'.repeat(64)}`,
    });
    mockedFetchBlob.mockResolvedValueOnce(gzippedTar);

    (fs.promises.mkdtemp as jest.Mock).mockResolvedValue('/tmp/skill-image-xx');
    (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

    await expect(
      fetchAndExtractSkillImage(
        'quay.io/org/skill:v1',
        '/tmp',
        logger,
        undefined,
        undefined,
        {
          ...DEFAULT_SKILL_IMAGE_OPTIONS,
          maxBlobSizeBytes: gzippedTar.length + 1,
        },
      ),
    ).rejects.toThrow();
    expect(fs.promises.mkdtemp).not.toHaveBeenCalled();
  });

  it('should extract files from an uncompressed tar layer', async () => {
    const yamlContent = 'name: test-skill';
    const mdContent = '# Test';

    const tarArchive = createTarArchive([
      { name: 'skillimage.yaml', content: yamlContent },
      { name: 'SKILLS.md', content: mdContent },
    ]);

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
          digest: 'sha256:tar-digest',
          size: tarArchive.length,
        },
      ],
    };

    mockedFetchManifest.mockResolvedValue({
      manifest,
      digest: `sha256:${'a'.repeat(64)}`,
    });
    mockedFetchBlob.mockResolvedValueOnce(tarArchive);

    (fs.promises.mkdtemp as jest.Mock).mockResolvedValue('/tmp/skill-image-xx');
    (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

    const result = await fetchAndExtractSkillImage(
      'quay.io/org/skill:v1',
      '/tmp',
      logger,
    );

    expect(result.skillImageYaml).toBe(yamlContent);
    expect(result.skillsMd).toBe(mdContent);
  });

  it('should throw when tar layer does not contain required files', async () => {
    const tarArchive = createTarArchive([
      { name: 'unrelated.txt', content: 'hello' },
    ]);
    const gzippedTar = gzipSync(tarArchive);

    const manifest: OciManifest = {
      schemaVersion: 2,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        digest: 'sha256:cfg',
        size: 10,
      },
      layers: [
        {
          mediaType: 'application/vnd.oci.image.layer.v1.tar+gzip',
          digest: 'sha256:tar-digest',
          size: gzippedTar.length,
        },
      ],
    };

    mockedFetchManifest.mockResolvedValue({
      manifest,
      digest: `sha256:${'a'.repeat(64)}`,
    });
    mockedFetchBlob.mockResolvedValueOnce(gzippedTar);

    await expect(
      fetchAndExtractSkillImage('quay.io/org/bad:v1', '/tmp', logger),
    ).rejects.toThrow(NonSkillImageError);
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
          mediaType: 'application/octet-stream',
          digest: 'sha256:xxx',
          size: 50,
          annotations: {
            'org.opencontainers.image.title': 'other-file.txt',
          },
        },
      ],
    };

    mockedFetchManifest.mockResolvedValue({
      manifest,
      digest: `sha256:${'a'.repeat(64)}`,
    });

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

    mockedFetchManifest.mockResolvedValue({
      manifest,
      digest: `sha256:${'a'.repeat(64)}`,
    });
    mockedFetchBlob
      .mockResolvedValueOnce(Buffer.from(yamlContent))
      .mockResolvedValueOnce(Buffer.from(mdContent));

    (fs.promises.mkdtemp as jest.Mock).mockResolvedValue(
      '/tmp/skill-image-fail',
    );
    // First writeFile call (.owner lock) succeeds; subsequent content
    // writes fail to simulate a disk-full scenario.
    (fs.promises.writeFile as jest.Mock)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValue(new Error('Disk full'));
    (fs.promises.rm as jest.Mock).mockResolvedValue(undefined);

    await expect(
      fetchAndExtractSkillImage('quay.io/org/repo:v1', '/tmp', logger),
    ).rejects.toThrow('Disk full');

    expect(fs.promises.rm).toHaveBeenCalledWith('/tmp/skill-image-fail', {
      recursive: true,
      force: true,
    });
  });

  it('should reject a gzip bomb that exceeds the default blob size limit', async () => {
    // Create content that decompresses well past the 5 MB limit.
    // A 6 MB zero buffer compresses to a few KB with gzip.
    const largeContent = Buffer.alloc(6 * 1024 * 1024, 0);
    const compressed = gzipSync(largeContent);

    const manifest: OciManifest = {
      schemaVersion: 2,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        digest: 'sha256:cfg',
        size: 10,
      },
      layers: [
        {
          mediaType: 'application/vnd.oci.image.layer.v1.tar+gzip',
          digest: 'sha256:bomb-digest',
          size: compressed.length,
        },
      ],
    };

    mockedFetchManifest.mockResolvedValue({
      manifest,
      digest: `sha256:${'a'.repeat(64)}`,
    });
    mockedFetchBlob.mockResolvedValueOnce(compressed);

    const result = fetchAndExtractSkillImage(
      'quay.io/org/bomb:v1',
      '/tmp',
      logger,
    );
    await expect(result).rejects.toThrow(ExtractionBoundsError);
    await expect(result).rejects.toThrow('5242880 bytes');
  });

  it('preserves corrupt gzip errors rather than misclassifying them as extraction limits', async () => {
    const corrupt = Buffer.from([0x1f, 0x8b, 0, 0, 0, 0, 0, 0, 0, 0]);
    mockedFetchManifest.mockResolvedValue({
      manifest: {
        schemaVersion: 2,
        config: { mediaType: '', digest: 'sha256:cfg', size: 0 },
        layers: [
          {
            mediaType: 'application/vnd.oci.image.layer.v1.tar+gzip',
            digest: 'sha256:corrupt',
            size: corrupt.length,
          },
        ],
      },
      digest: `sha256:${'a'.repeat(64)}`,
    });
    mockedFetchBlob.mockResolvedValueOnce(corrupt);
    await expect(
      fetchAndExtractSkillImage('quay.io/org/corrupt:v1', '/tmp', logger),
    ).rejects.toHaveProperty('code', 'Z_DATA_ERROR');
  });
});

describe('cleanupStaleExtractionDirs', () => {
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

  it('should remove stale directories without an .owner file', async () => {
    (fs.promises.readdir as jest.Mock).mockResolvedValue([
      { name: 'skill-image-abc123', isDirectory: () => true },
      { name: 'other-dir', isDirectory: () => true },
    ]);
    // No .owner file — readFile throws ENOENT
    (fs.promises.readFile as jest.Mock).mockRejectedValue(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' }),
    );
    (fs.promises.rm as jest.Mock).mockResolvedValue(undefined);

    await cleanupStaleExtractionDirs('/tmp', logger);

    // Only the skill-image- prefixed directory should be removed
    expect(fs.promises.rm).toHaveBeenCalledTimes(1);
    expect(fs.promises.rm).toHaveBeenCalledWith('/tmp/skill-image-abc123', {
      recursive: true,
      force: true,
    });
  });

  it('should preserve directories owned by the current (alive) process', async () => {
    (fs.promises.readdir as jest.Mock).mockResolvedValue([
      { name: 'skill-image-active', isDirectory: () => true },
    ]);
    // Return the current process PID as the owner
    (fs.promises.readFile as jest.Mock).mockResolvedValue(`${process.pid}`);

    await cleanupStaleExtractionDirs('/tmp', logger);

    expect(fs.promises.rm).not.toHaveBeenCalled();
  });

  it('should not remove non-skill-image directories', async () => {
    (fs.promises.readdir as jest.Mock).mockResolvedValue([
      { name: 'other-directory', isDirectory: () => true },
      { name: 'regular-file', isDirectory: () => false },
    ]);

    await cleanupStaleExtractionDirs('/tmp', logger);

    expect(fs.promises.rm).not.toHaveBeenCalled();
  });

  it('should handle readdir errors gracefully', async () => {
    (fs.promises.readdir as jest.Mock).mockRejectedValue(new Error('EACCES'));

    // Should not throw
    await cleanupStaleExtractionDirs('/tmp', logger);
    expect(logger.debug).toHaveBeenCalled();
  });

  it('should handle rm errors gracefully for individual directories', async () => {
    (fs.promises.readdir as jest.Mock).mockResolvedValue([
      { name: 'skill-image-broken', isDirectory: () => true },
    ]);
    (fs.promises.readFile as jest.Mock).mockRejectedValue(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' }),
    );
    (fs.promises.rm as jest.Mock).mockRejectedValue(new Error('EBUSY'));

    // Should not throw — individual failures are logged, not propagated
    await cleanupStaleExtractionDirs('/tmp', logger);
    expect(logger.warn).toHaveBeenCalled();
  });
});

describe('mixed layout extraction', () => {
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  } as unknown as LoggerService;
  beforeEach(() => {
    jest.resetAllMocks();
    require('node:fs').promises.mkdtemp.mockResolvedValue(
      '/tmp/skill-image-test',
    );
  });
  const card = 'metadata:\n  name: Test';
  const markdown = '# Test';
  function setup(
    annotated: 'yaml' | 'md',
    files: Array<{ name: string; content: string }>,
  ) {
    const raw = Buffer.from(annotated === 'yaml' ? card : markdown);
    const archive = createTarArchive(files);
    const layers: OciDescriptor[] = [
      {
        mediaType: 'application/vnd.oci.image.layer.v1.tar',
        digest: 'sha256:raw',
        size: raw.length,
        annotations: {
          'org.opencontainers.image.title':
            annotated === 'yaml' ? 'skill.yaml' : 'SKILL.md',
        },
      },
      {
        mediaType: 'application/vnd.oci.image.layer.v1.tar',
        digest: 'sha256:archive',
        size: archive.length,
      },
    ];
    mockedFetchManifest.mockResolvedValue({
      manifest: {
        schemaVersion: 2,
        config: { mediaType: '', digest: 'sha256:config', size: 0 },
        layers,
      },
      digest: `sha256:${'a'.repeat(64)}`,
    });
    mockedFetchBlob.mockImplementation(async (_ref, digest) =>
      digest === 'sha256:raw' ? raw : archive,
    );
  }
  it.each(['yaml', 'md'] as const)(
    'extracts a valid pair split between annotated %s and tar',
    async kind => {
      setup(kind, [
        {
          name: kind === 'yaml' ? 'SKILL.md' : 'skill.yaml',
          content: kind === 'yaml' ? markdown : card,
        },
      ]);
      const result = await fetchAndExtractSkillImage(
        'quay.io/org/skill:v1',
        '/tmp',
        logger,
      );
      expect(result.skillImageYaml).toBe(card);
      expect(result.skillsMd).toBe(markdown);
    },
  );
  it.each(['yaml', 'md'] as const)(
    'rejects competing annotated %s and archive files',
    async kind => {
      setup(kind, [
        { name: 'skill.yaml', content: card },
        { name: 'SKILL.md', content: markdown },
      ]);
      await expect(
        fetchAndExtractSkillImage('quay.io/org/skill:v1', '/tmp', logger),
      ).rejects.toThrow(AmbiguousSkillFilesError);
    },
  );
});

describe('complete layout ambiguity', () => {
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  } as unknown as LoggerService;
  const yaml = 'metadata:\n  name: Test';
  const markdown = '# Test';
  beforeEach(() => {
    jest.resetAllMocks();
    require('node:fs').promises.mkdtemp.mockResolvedValue(
      '/tmp/skill-image-test',
    );
  });
  function prepare(
    annotated: boolean,
    archives: Array<Array<{ name: string; content: string }>>,
  ) {
    const blobs = new Map<string, Buffer>();
    const layers: OciDescriptor[] = [];
    if (annotated)
      for (const [name, content] of [
        ['skill.yaml', yaml],
        ['SKILL.md', markdown],
      ]) {
        const digest = `sha256:${name}`;
        const data = Buffer.from(content);
        blobs.set(digest, data);
        layers.push({
          mediaType: 'application/vnd.oci.image.layer.v1.tar',
          digest,
          size: data.length,
          annotations: { 'org.opencontainers.image.title': name },
        });
      }
    archives.forEach((files, index) => {
      const data = createTarArchive(files);
      const digest = `sha256:archive${index}`;
      blobs.set(digest, data);
      layers.push({
        mediaType: 'application/vnd.oci.image.layer.v1.tar',
        digest,
        size: data.length,
      });
    });
    const manifest: OciManifest = {
      schemaVersion: 2,
      config: { mediaType: '', digest: 'sha256:cfg', size: 0 },
      layers,
    };
    mockedFetchManifest.mockResolvedValue({
      manifest,
      digest: `sha256:${'a'.repeat(64)}`,
    });
    mockedFetchBlob.mockImplementation(
      async (_ref, digest) => blobs.get(digest)!,
    );
    return manifest;
  }
  it.each(['skill.yaml', 'SKILL.md'])(
    'returns ambiguous for duplicate annotated %s',
    name => {
      const manifest = prepare(true, []);
      manifest.layers.push({
        ...manifest.layers[name === 'skill.yaml' ? 0 : 1],
      });
      expect(validateSkillImageManifest(manifest)).toEqual({
        mode: 'ambiguous',
        reason: expect.any(String),
      });
    },
  );
  it('excludes annotated raw descriptors from archive traversal', async () => {
    const manifest = prepare(true, [
      [{ name: 'readme.txt', content: 'other' }],
    ]);
    expect(validateSkillImageManifest(manifest)).toEqual(
      expect.objectContaining({
        mode: 'annotated',
        tarLayers: [manifest.layers[2]],
      }),
    );
    const result = await fetchAndExtractSkillImage(
      'quay.io/org/skill:v1',
      '/tmp',
      logger,
    );
    expect(result.skillImageYaml).toBe(yaml);
    expect(result.skillsMd).toBe(markdown);
  });
  it.each(['skill.yaml', 'SKILL.md'])(
    'rejects annotated pair with competing archived %s',
    name => {
      prepare(true, [[{ name, content: 'duplicate' }]]);
      return expect(
        fetchAndExtractSkillImage('quay.io/org/skill:v1', '/tmp', logger),
      ).rejects.toThrow(AmbiguousSkillFilesError);
    },
  );
  it.each(['skill.yaml', 'SKILL.md'])(
    'rejects duplicate archive entries for %s',
    name => {
      prepare(false, [
        [
          { name: 'skill.yaml', content: yaml },
          { name: 'SKILL.md', content: markdown },
          { name, content: 'duplicate' },
        ],
      ]);
      return expect(
        fetchAndExtractSkillImage('quay.io/org/skill:v1', '/tmp', logger),
      ).rejects.toThrow(AmbiguousSkillFilesError);
    },
  );
  it.each(['skill.yaml', 'SKILL.md'])(
    'rejects duplicate %s across archives',
    name => {
      prepare(false, [
        [
          { name: 'skill.yaml', content: yaml },
          { name: 'SKILL.md', content: markdown },
        ],
        [{ name, content: 'duplicate' }],
      ]);
      return expect(
        fetchAndExtractSkillImage('quay.io/org/skill:v1', '/tmp', logger),
      ).rejects.toThrow(AmbiguousSkillFilesError);
    },
  );
  it('uses a typed non-skill error for a missing file pair', () => {
    prepare(false, [[{ name: 'readme', content: 'ordinary image' }]]);
    return expect(
      fetchAndExtractSkillImage('quay.io/org/skill:v1', '/tmp', logger),
    ).rejects.toThrow(NonSkillImageError);
  });
});
