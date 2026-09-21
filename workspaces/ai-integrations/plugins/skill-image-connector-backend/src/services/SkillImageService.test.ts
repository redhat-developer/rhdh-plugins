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
import {
  findLayerByTitle,
  validateSkillImageManifest,
  fetchAndExtractSkillImage,
  cleanupStaleExtractionDirs,
  parseTarEntries,
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
    readdir: jest.fn(),
    readFile: jest.fn(),
  },
}));

const mockedFetchManifest = fetchManifest as jest.MockedFunction<
  typeof fetchManifest
>;
const mockedFetchBlob = fetchBlob as jest.MockedFunction<typeof fetchBlob>;

/**
 * Creates a minimal valid tar archive containing the given files.
 */
function createTarArchive(
  files: Array<{ name: string; content: string }>,
): Buffer {
  const blocks: Buffer[] = [];

  for (const file of files) {
    const contentBuf = Buffer.from(file.content, 'utf-8');
    const header = Buffer.alloc(512);

    // File name (bytes 0–99)
    header.write(file.name, 0, Math.min(file.name.length, 100), 'utf-8');

    // File mode (bytes 100–107)
    header.write('0000644\0', 100, 8, 'utf-8');

    // Owner UID (bytes 108–115)
    header.write('0000000\0', 108, 8, 'utf-8');

    // Group GID (bytes 116–123)
    header.write('0000000\0', 116, 8, 'utf-8');

    // File size in octal (bytes 124–135)
    const sizeOctal = contentBuf.length.toString(8).padStart(11, '0');
    header.write(`${sizeOctal}\0`, 124, 12, 'utf-8');

    // Modification time (bytes 136–147)
    header.write('00000000000\0', 136, 12, 'utf-8');

    // Type flag (byte 156): '0' = regular file
    header[156] = 0x30;

    // Compute and write checksum (bytes 148–155)
    // Checksum is computed with the checksum field treated as spaces (0x20)
    for (let i = 148; i < 156; i++) {
      header[i] = 0x20;
    }
    let checksum = 0;
    for (let i = 0; i < 512; i++) {
      checksum += header[i];
    }
    header.write(
      `${checksum.toString(8).padStart(6, '0')}\0 `,
      148,
      8,
      'utf-8',
    );

    blocks.push(header);

    // File data padded to 512-byte boundary
    const padding = 512 - (contentBuf.length % 512 || 512);
    blocks.push(contentBuf);
    if (padding > 0 && padding < 512) {
      blocks.push(Buffer.alloc(padding));
    }
  }

  // End-of-archive: two 512-byte zero blocks
  blocks.push(Buffer.alloc(1024));
  return Buffer.concat(blocks);
}

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

  it('should throw when no annotated layers and no tar layers', () => {
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

    expect(() => validateSkillImageManifest(manifest)).toThrow(
      'does not conform to the skillimage format',
    );
  });

  it('should throw when layers have no annotations and are not tar type', () => {
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

    expect(() => validateSkillImageManifest(manifest)).toThrow(
      'does not conform to the skillimage format',
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
    );
    expect(mockedFetchBlob).toHaveBeenCalledWith(
      expect.any(Object),
      'sha256:md-digest',
      mdContent.length,
      logger,
      undefined,
      expect.anything(),
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

    mockedFetchManifest.mockResolvedValue(manifest);
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

    mockedFetchManifest.mockResolvedValue(manifest);
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

    mockedFetchManifest.mockResolvedValue(manifest);
    mockedFetchBlob.mockResolvedValueOnce(gzippedTar);

    await expect(
      fetchAndExtractSkillImage('quay.io/org/bad:v1', '/tmp', logger),
    ).rejects.toThrow('did not contain the required skill files');
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

  it('should reject gzip bomb that decompresses past MAX_BLOB_SIZE', async () => {
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

    mockedFetchManifest.mockResolvedValue(manifest);
    mockedFetchBlob.mockResolvedValueOnce(compressed);

    await expect(
      fetchAndExtractSkillImage('quay.io/org/bomb:v1', '/tmp', logger),
    ).rejects.toThrow();
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
