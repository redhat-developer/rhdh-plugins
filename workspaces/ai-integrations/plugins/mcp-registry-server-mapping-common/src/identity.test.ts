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
  sanitizeSegment,
  deriveMetadataName,
  computeIdentityHashSuffix,
  DEFAULT_PREFIX,
} from './identity';

describe('sanitizeSegment', () => {
  it('lowercases the segment', () => {
    expect(sanitizeSegment('Hello')).toBe('hello');
  });

  it('replaces illegal characters with -', () => {
    expect(sanitizeSegment('io.github.user/weather')).toBe(
      'io.github.user-weather',
    );
  });

  it('replaces leading _ with x', () => {
    expect(sanitizeSegment('_internal')).toBe('xinternal');
  });

  it('applies boundary normalization (leading non-alphanumeric → x)', () => {
    expect(sanitizeSegment('-abc')).toBe('xabc');
  });

  it('applies boundary normalization (trailing non-alphanumeric → x)', () => {
    expect(sanitizeSegment('abc-')).toBe('abcx');
  });

  it('handles segment that sanitizes to a lone illegal char', () => {
    // "/" → "-" → boundary normalize → "x"
    expect(sanitizeSegment('/')).toBe('x');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeSegment('')).toBe('');
  });

  it('leaves valid segments unchanged', () => {
    expect(sanitizeSegment('weather')).toBe('weather');
    expect(sanitizeSegment('mcp.registry')).toBe('mcp.registry');
    expect(sanitizeSegment('1.0.2')).toBe('1.0.2');
  });
});

describe('computeIdentityHashSuffix', () => {
  it('returns 8 lowercase hex chars from FNV-1a', () => {
    expect(computeIdentityHashSuffix('mcp.registry', 'weather', '1.0.2')).toBe(
      '1f5d3825',
    );
  });

  it('matches the reverse-DNS identity fixture', () => {
    expect(
      computeIdentityHashSuffix(
        'mcp.registry',
        'io.github.user/weather',
        '1.0.2',
      ),
    ).toBe('e2449d04');
  });
});

describe('deriveMetadataName', () => {
  it('returns stem without hash when no mutation and under 63 chars', () => {
    const result = deriveMetadataName('weather', '1.0.2');
    expect(result).toBe('mcp.registry__weather__1.0.2');
    expect(result.length).toBeLessThanOrEqual(63);
  });

  it('appends FNV-1a hash when sanitization mutates a segment', () => {
    const result = deriveMetadataName('io.github.user/weather', '1.0.2');
    expect(result).toBe('mcp.registry__io.github.user-weather__1.0.2-e2449d04');
    expect(result.length).toBeLessThanOrEqual(63);
  });

  it('uses default prefix when none supplied', () => {
    const result = deriveMetadataName('weather', '1.0.2');
    expect(result).toContain('mcp.registry');
  });

  it('applies caller prefix override', () => {
    const result = deriveMetadataName(
      'io.github.user/weather',
      '1.0.2',
      'com.example.registry',
    );
    expect(result).toBe(
      'com.example.registry__io.github.user-weather__1.0.2-bf17f045',
    );
  });

  it('falls back to default when prefix is empty', () => {
    const result = deriveMetadataName('weather', '1.0.2', '');
    expect(result).toContain('mcp.registry');
  });

  it('falls back to default when prefix sanitizes to empty', () => {
    // A prefix of just "/" sanitizes to "x", which is not empty
    // But a prefix of whitespace-only should fall back
    const result = deriveMetadataName('weather', '1.0.2', '   ');
    expect(result).toContain('mcp.registry');
  });

  it('produces distinct names for different versions of the same server', () => {
    const v1 = deriveMetadataName('io.github.user/weather', '1.0.0');
    const v2 = deriveMetadataName('io.github.user/weather', '2.0.0');
    expect(v1).toBe('mcp.registry__io.github.user-weather__1.0.0-e444a02a');
    expect(v2).toBe('mcp.registry__io.github.user-weather__2.0.0-ab4af357');
    expect(v1).not.toBe(v2);
  });

  it('truncates and hashes when exceeding 63 characters', () => {
    const longName = 'a'.repeat(50);
    const result = deriveMetadataName(longName, '1.0.0');
    expect(result).toBe(
      'mcp.registry__aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-a6bfead9',
    );
    expect(result.length).toBeLessThanOrEqual(63);
  });

  it('produces deterministic output (same input, same output)', () => {
    const a = deriveMetadataName('io.github.user/weather', '1.0.2');
    const b = deriveMetadataName('io.github.user/weather', '1.0.2');
    expect(a).toBe(b);
  });

  it('never produces a name longer than 63 characters', () => {
    const cases = [
      ['weather', '1.0.2', undefined],
      ['io.github.user/weather', '1.0.2', undefined],
      ['a'.repeat(100), '1.0.0', undefined],
      ['io.github.user/weather', '1.0.2', 'com.example.registry'],
      [
        'very.long.namespace/extremely-long-server-name-for-testing',
        '10.20.30-beta.1',
        'my.custom.very.long.prefix.for.testing',
      ],
    ] as const;

    for (const [name, version, prefix] of cases) {
      const result = deriveMetadataName(name, version, prefix);
      expect(result.length).toBeLessThanOrEqual(63);
      // Must start and end with alphanumeric
      expect(result).toMatch(/^[a-z0-9]/);
      expect(result).toMatch(/[a-z0-9]$/);
    }
  });

  it('ensures DEFAULT_PREFIX is mcp.registry', () => {
    expect(DEFAULT_PREFIX).toBe('mcp.registry');
  });
});
