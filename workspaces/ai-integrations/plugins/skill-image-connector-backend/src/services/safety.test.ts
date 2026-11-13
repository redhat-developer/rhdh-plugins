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

import { createTarArchive } from '../testUtils';
import {
  parseTarEntries,
  isUnsafeTarPath,
  ExtractionBoundsError,
} from './SkillImageService';
import {
  isPrivateAddress,
  validateRequestUrl,
  validateAndResolveHost,
} from './HttpClient';
import { MAX_TAR_ENTRIES, MAX_REDIRECTS, MAX_CANDIDATES } from './types';

// Mock DNS for validateAndResolveHost tests
jest.mock('node:dns', () => ({
  promises: {
    lookup: jest.fn(),
  },
}));

describe('tar path safety', () => {
  it('rejects absolute paths', () => {
    expect(isUnsafeTarPath('/etc/passwd')).toBe(true);
  });
  it('rejects parent directory traversal', () => {
    expect(isUnsafeTarPath('../escape')).toBe(true);
    expect(isUnsafeTarPath('foo/../../escape')).toBe(true);
  });
  it('accepts relative paths within the root', () => {
    expect(isUnsafeTarPath('skill.yaml')).toBe(false);
    expect(isUnsafeTarPath('subdir/SKILL.md')).toBe(false);
    expect(isUnsafeTarPath('./skill.yaml')).toBe(false);
  });
  it('rejects traversal that escapes after nesting', () => {
    expect(isUnsafeTarPath('a/b/../../..')).toBe(true);
  });
  it('accepts deep but safe paths', () => {
    expect(isUnsafeTarPath('a/b/../c/d')).toBe(false);
  });
});

describe('tar parsing hardening', () => {
  it('throws ExtractionBoundsError when entry count exceeds MAX_TAR_ENTRIES', () => {
    // Create a tar archive with MAX_TAR_ENTRIES + 1 entries
    const files = Array.from({ length: MAX_TAR_ENTRIES + 1 }, (_, i) => ({
      name: `file-${i}.txt`,
      content: `content-${i}`,
    }));
    const tar = createTarArchive(files);
    expect(() => parseTarEntries(tar)).toThrow(ExtractionBoundsError);
    expect(() => parseTarEntries(tar)).toThrow('maximum inspected entry count');
  });

  it('succeeds at exactly MAX_TAR_ENTRIES entries', () => {
    const files = Array.from({ length: MAX_TAR_ENTRIES }, (_, i) => ({
      name: `file-${i}.txt`,
      content: `content-${i}`,
    }));
    const tar = createTarArchive(files);
    const entries = parseTarEntries(tar);
    expect(entries).toHaveLength(MAX_TAR_ENTRIES);
  });

  it('rejects a symlink entry', () => {
    // Build a minimal tar header with symlink type flag
    const header = Buffer.alloc(512);
    header.write('symlink-entry', 0, 13, 'utf-8');
    header.write('0000644\0', 100, 8, 'utf-8');
    header.write('0000000\0', 108, 8, 'utf-8');
    header.write('0000000\0', 116, 8, 'utf-8');
    header.write('00000000000\0', 124, 12, 'utf-8');
    header.write('00000000000\0', 136, 12, 'utf-8');
    header[156] = 0x32; // '2' = symlink
    // Compute checksum with checksum field as spaces
    for (let i = 148; i < 156; i++) header[i] = 0x20;
    let checksum = 0;
    for (let i = 0; i < 512; i++) checksum += header[i];
    header.write(
      `${checksum.toString(8).padStart(6, '0')}\0 `,
      148,
      8,
      'utf-8',
    );
    const tar = Buffer.concat([header, Buffer.alloc(1024)]);
    expect(() => parseTarEntries(tar)).toThrow(ExtractionBoundsError);
    expect(() => parseTarEntries(tar)).toThrow('symlink');
  });

  it('rejects a hardlink entry', () => {
    const header = Buffer.alloc(512);
    header.write('hardlink-entry', 0, 14, 'utf-8');
    header.write('0000644\0', 100, 8, 'utf-8');
    header.write('0000000\0', 108, 8, 'utf-8');
    header.write('0000000\0', 116, 8, 'utf-8');
    header.write('00000000000\0', 124, 12, 'utf-8');
    header.write('00000000000\0', 136, 12, 'utf-8');
    header[156] = 0x31; // '1' = hardlink
    for (let i = 148; i < 156; i++) header[i] = 0x20;
    let checksum = 0;
    for (let i = 0; i < 512; i++) checksum += header[i];
    header.write(
      `${checksum.toString(8).padStart(6, '0')}\0 `,
      148,
      8,
      'utf-8',
    );
    const tar = Buffer.concat([header, Buffer.alloc(1024)]);
    expect(() => parseTarEntries(tar)).toThrow(ExtractionBoundsError);
    expect(() => parseTarEntries(tar)).toThrow('hardlink');
  });

  it('rejects a device entry', () => {
    const header = Buffer.alloc(512);
    header.write('device-entry', 0, 12, 'utf-8');
    header.write('0000644\0', 100, 8, 'utf-8');
    header.write('0000000\0', 108, 8, 'utf-8');
    header.write('0000000\0', 116, 8, 'utf-8');
    header.write('00000000000\0', 124, 12, 'utf-8');
    header.write('00000000000\0', 136, 12, 'utf-8');
    header[156] = 0x33; // '3' = char device
    for (let i = 148; i < 156; i++) header[i] = 0x20;
    let checksum = 0;
    for (let i = 0; i < 512; i++) checksum += header[i];
    header.write(
      `${checksum.toString(8).padStart(6, '0')}\0 `,
      148,
      8,
      'utf-8',
    );
    const tar = Buffer.concat([header, Buffer.alloc(1024)]);
    expect(() => parseTarEntries(tar)).toThrow(ExtractionBoundsError);
    expect(() => parseTarEntries(tar)).toThrow('device');
  });

  it('rejects a path traversal entry', () => {
    const tar = createTarArchive([
      { name: '../../../etc/passwd', content: 'malicious' },
    ]);
    expect(() => parseTarEntries(tar)).toThrow(ExtractionBoundsError);
    expect(() => parseTarEntries(tar)).toThrow('unsafe path');
  });

  it('rejects an absolute path entry', () => {
    const tar = createTarArchive([
      { name: '/etc/passwd', content: 'malicious' },
    ]);
    expect(() => parseTarEntries(tar)).toThrow(ExtractionBoundsError);
    expect(() => parseTarEntries(tar)).toThrow('unsafe path');
  });

  it('throws ExtractionBoundsError for malformed size fields', () => {
    const header = Buffer.alloc(512);
    header.write('malformed.txt', 0, 13, 'utf-8');
    header.write('0000644\0', 100, 8, 'utf-8');
    header.write('0000000\0', 108, 8, 'utf-8');
    header.write('0000000\0', 116, 8, 'utf-8');
    // Write an invalid size
    header.write('notasize\0\0\0\0', 124, 12, 'utf-8');
    header.write('00000000000\0', 136, 12, 'utf-8');
    header[156] = 0x30;
    for (let i = 148; i < 156; i++) header[i] = 0x20;
    let checksum = 0;
    for (let i = 0; i < 512; i++) checksum += header[i];
    header.write(
      `${checksum.toString(8).padStart(6, '0')}\0 `,
      148,
      8,
      'utf-8',
    );
    const tar = Buffer.concat([header, Buffer.alloc(1024)]);
    expect(() => parseTarEntries(tar)).toThrow('malformed size');
  });

  it('throws ExtractionBoundsError for truncated archives', () => {
    // Create a header that says the file is 1024 bytes but truncate the archive
    const header = Buffer.alloc(512);
    header.write('truncated.txt', 0, 13, 'utf-8');
    header.write('0000644\0', 100, 8, 'utf-8');
    header.write('0000000\0', 108, 8, 'utf-8');
    header.write('0000000\0', 116, 8, 'utf-8');
    // 1024 bytes = 02000 in octal
    header.write('00000002000\0', 124, 12, 'utf-8');
    header.write('00000000000\0', 136, 12, 'utf-8');
    header[156] = 0x30;
    for (let i = 148; i < 156; i++) header[i] = 0x20;
    let checksum = 0;
    for (let i = 0; i < 512; i++) checksum += header[i];
    header.write(
      `${checksum.toString(8).padStart(6, '0')}\0 `,
      148,
      8,
      'utf-8',
    );
    // Only provide 100 bytes of data (should be 1024)
    const tar = Buffer.concat([header, Buffer.alloc(100)]);
    expect(() => parseTarEntries(tar)).toThrow('truncated');
  });

  it('still parses valid archives correctly', () => {
    const tar = createTarArchive([
      { name: 'skill.yaml', content: 'name: test' },
      { name: 'SKILL.md', content: '# Test' },
    ]);
    const entries = parseTarEntries(tar);
    expect(entries).toHaveLength(2);
    expect(entries[0].name).toBe('skill.yaml');
    expect(entries[1].name).toBe('SKILL.md');
  });

  it('counts ignored entry types against the entry limit', () => {
    // Create an archive with directories and regular files totaling > MAX_TAR_ENTRIES
    // Directories have type flag '5' (0x35) - they are counted but not returned
    const blocks: Buffer[] = [];
    for (let i = 0; i < MAX_TAR_ENTRIES; i++) {
      const header = Buffer.alloc(512);
      header.write(`dir-${i}/`, 0, Math.min(`dir-${i}/`.length, 100), 'utf-8');
      header.write('0000755\0', 100, 8, 'utf-8');
      header.write('0000000\0', 108, 8, 'utf-8');
      header.write('0000000\0', 116, 8, 'utf-8');
      header.write('00000000000\0', 124, 12, 'utf-8');
      header.write('00000000000\0', 136, 12, 'utf-8');
      header[156] = 0x35; // directory
      for (let j = 148; j < 156; j++) header[j] = 0x20;
      let checksum = 0;
      for (let j = 0; j < 512; j++) checksum += header[j];
      header.write(
        `${checksum.toString(8).padStart(6, '0')}\0 `,
        148,
        8,
        'utf-8',
      );
      blocks.push(header);
    }
    // Add one more regular file to exceed the limit
    const content = Buffer.from('overflow');
    const overflowHeader = Buffer.alloc(512);
    overflowHeader.write('overflow.txt', 0, 12, 'utf-8');
    overflowHeader.write('0000644\0', 100, 8, 'utf-8');
    overflowHeader.write('0000000\0', 108, 8, 'utf-8');
    overflowHeader.write('0000000\0', 116, 8, 'utf-8');
    const sizeStr = content.length.toString(8).padStart(11, '0');
    overflowHeader.write(`${sizeStr}\0`, 124, 12, 'utf-8');
    overflowHeader.write('00000000000\0', 136, 12, 'utf-8');
    overflowHeader[156] = 0x30;
    for (let j = 148; j < 156; j++) overflowHeader[j] = 0x20;
    let checksum = 0;
    for (let j = 0; j < 512; j++) checksum += overflowHeader[j];
    overflowHeader.write(
      `${checksum.toString(8).padStart(6, '0')}\0 `,
      148,
      8,
      'utf-8',
    );
    blocks.push(overflowHeader);
    blocks.push(content);
    const padding = 512 - (content.length % 512 || 512);
    if (padding > 0 && padding < 512) blocks.push(Buffer.alloc(padding));
    blocks.push(Buffer.alloc(1024));

    const tar = Buffer.concat(blocks);
    expect(() => parseTarEntries(tar)).toThrow('maximum inspected entry count');
  });
});

describe('URL validation', () => {
  it('rejects non-HTTPS URLs', () => {
    expect(() =>
      validateRequestUrl(new URL('http://example.com/path')),
    ).toThrow('HTTPS');
  });
  it('rejects URLs with embedded credentials', () => {
    expect(() =>
      validateRequestUrl(new URL('https://user:pass@example.com/path')),
    ).toThrow('credentials');
  });
  it('rejects localhost', () => {
    expect(() => validateRequestUrl(new URL('https://localhost/path'))).toThrow(
      'public hostname',
    );
  });
  it('rejects .localhost subdomains', () => {
    expect(() =>
      validateRequestUrl(new URL('https://evil.localhost/path')),
    ).toThrow('public hostname');
  });
  it('rejects raw IPv4 addresses', () => {
    expect(() =>
      validateRequestUrl(new URL('https://192.168.1.1/path')),
    ).toThrow('public hostname');
  });
  it('rejects raw IPv6 addresses', () => {
    expect(() => validateRequestUrl(new URL('https://[::1]/path'))).toThrow(
      'public hostname',
    );
  });
  it('accepts valid HTTPS URLs', () => {
    expect(() =>
      validateRequestUrl(new URL('https://quay.io/v2/org/repo/manifests/v1')),
    ).not.toThrow();
  });
});

describe('DNS destination validation', () => {
  const dns = require('node:dns');

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('resolves and returns the validated public address set', async () => {
    (dns.promises.lookup as jest.Mock).mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
    ]);
    const result = await validateAndResolveHost('example.com');
    expect(result).toEqual([{ address: '93.184.216.34', family: 4 }]);
  });

  it('rejects when hostname resolves to a private IPv4 address', async () => {
    (dns.promises.lookup as jest.Mock).mockResolvedValue([
      { address: '10.0.0.1', family: 4 },
    ]);
    await expect(validateAndResolveHost('evil.example.com')).rejects.toThrow(
      'non-public address',
    );
  });

  it('rejects when hostname resolves to loopback', async () => {
    (dns.promises.lookup as jest.Mock).mockResolvedValue([
      { address: '127.0.0.1', family: 4 },
    ]);
    await expect(validateAndResolveHost('evil.example.com')).rejects.toThrow(
      'non-public address',
    );
  });

  it('rejects IPv6 loopback', async () => {
    (dns.promises.lookup as jest.Mock).mockResolvedValue([
      { address: '::1', family: 6 },
    ]);
    await expect(validateAndResolveHost('evil.example.com')).rejects.toThrow(
      'non-public address',
    );
  });

  it('rejects link-local IPv6', async () => {
    (dns.promises.lookup as jest.Mock).mockResolvedValue([
      { address: 'fe80::1', family: 6 },
    ]);
    await expect(validateAndResolveHost('evil.example.com')).rejects.toThrow(
      'non-public address',
    );
  });

  it('rejects IPv4-mapped IPv6 private addresses', async () => {
    (dns.promises.lookup as jest.Mock).mockResolvedValue([
      { address: '::ffff:10.0.0.1', family: 6 },
    ]);
    await expect(validateAndResolveHost('evil.example.com')).rejects.toThrow(
      'non-public address',
    );
  });

  it('throws when DNS resolution fails', async () => {
    (dns.promises.lookup as jest.Mock).mockRejectedValue(
      new Error('ENOTFOUND'),
    );
    await expect(
      validateAndResolveHost('nonexistent.example.com'),
    ).rejects.toThrow('could not be resolved');
  });

  it('rejects when DNS returns empty results', async () => {
    (dns.promises.lookup as jest.Mock).mockResolvedValue([]);
    await expect(validateAndResolveHost('empty.example.com')).rejects.toThrow(
      'could not be resolved',
    );
  });
});

describe('private address detection', () => {
  it('detects 10.x.x.x as private', () => {
    expect(isPrivateAddress('10.0.0.1', 4)).toBe(true);
    expect(isPrivateAddress('10.255.255.255', 4)).toBe(true);
  });
  it('detects 172.16-31.x.x as private', () => {
    expect(isPrivateAddress('172.16.0.1', 4)).toBe(true);
    expect(isPrivateAddress('172.31.255.255', 4)).toBe(true);
    expect(isPrivateAddress('172.15.0.1', 4)).toBe(false);
    expect(isPrivateAddress('172.32.0.1', 4)).toBe(false);
  });
  it('detects 192.168.x.x as private', () => {
    expect(isPrivateAddress('192.168.0.1', 4)).toBe(true);
  });
  it('detects 127.x.x.x as loopback', () => {
    expect(isPrivateAddress('127.0.0.1', 4)).toBe(true);
    expect(isPrivateAddress('127.255.255.255', 4)).toBe(true);
  });
  it('detects 169.254.x.x as link-local', () => {
    expect(isPrivateAddress('169.254.0.1', 4)).toBe(true);
  });
  it('detects 100.64-127.x.x as CGNAT', () => {
    expect(isPrivateAddress('100.64.0.1', 4)).toBe(true);
    expect(isPrivateAddress('100.127.255.255', 4)).toBe(true);
    expect(isPrivateAddress('100.63.0.1', 4)).toBe(false);
  });
  it('detects IPv6 loopback', () => {
    expect(isPrivateAddress('::1', 6)).toBe(true);
  });
  it('detects IPv6 link-local', () => {
    expect(isPrivateAddress('fe80::1', 6)).toBe(true);
  });
  it('detects IPv6 unique local', () => {
    expect(isPrivateAddress('fc00::1', 6)).toBe(true);
    expect(isPrivateAddress('fd12:3456::1', 6)).toBe(true);
  });
  it('detects IPv4-mapped IPv6 private', () => {
    expect(isPrivateAddress('::ffff:192.168.1.1', 6)).toBe(true);
  });
  it('accepts public IPv4', () => {
    expect(isPrivateAddress('93.184.216.34', 4)).toBe(false);
    expect(isPrivateAddress('8.8.8.8', 4)).toBe(false);
  });
  it('denies unknown address family', () => {
    expect(isPrivateAddress('unknown', 99)).toBe(true);
  });
});

describe('constants', () => {
  it('MAX_REDIRECTS is 5 per D7', () => {
    expect(MAX_REDIRECTS).toBe(5);
  });
  it('MAX_CANDIDATES is 1000', () => {
    expect(MAX_CANDIDATES).toBe(1000);
  });
  it('MAX_TAR_ENTRIES is 200', () => {
    expect(MAX_TAR_ENTRIES).toBe(200);
  });
});
