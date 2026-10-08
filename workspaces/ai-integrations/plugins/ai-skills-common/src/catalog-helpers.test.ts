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

import { createHash } from 'crypto';

import {
  buildNpxRef,
  buildOciRef,
  computeCatalogName,
  normalizeTags,
  parseNpxRef,
  parseOciRef,
  resolveVersion,
} from './catalog-helpers';

// ─── computeCatalogName ──────────────────────────────────────────────

describe('computeCatalogName', () => {
  it('produces a name matching skill-<56 hex> pattern', () => {
    const name = computeCatalogName({
      type: 'oci',
      id: 'quay-public',
      key: 'quay.io/octo/hello-world-skill',
    });
    expect(name).toMatch(/^skill-[a-f0-9]{56}$/);
  });

  it('returns the same name for the same identity tuple', () => {
    const tuple = {
      type: 'oci' as const,
      id: 'quay-public',
      key: 'my-skill',
    };
    const nameA = computeCatalogName(tuple);
    const nameB = computeCatalogName(tuple);
    expect(nameA).toBe(nameB);
  });

  it('returns a different name when source ID changes', () => {
    const nameA = computeCatalogName({
      type: 'oci',
      id: 'quay-public',
      key: 'my-skill',
    });
    const nameB = computeCatalogName({
      type: 'oci',
      id: 'quay-private',
      key: 'my-skill',
    });
    expect(nameA).not.toBe(nameB);
  });

  it('returns a different name when key changes', () => {
    const nameA = computeCatalogName({
      type: 'oci',
      id: 'quay-public',
      key: 'skill-a',
    });
    const nameB = computeCatalogName({
      type: 'oci',
      id: 'quay-public',
      key: 'skill-b',
    });
    expect(nameA).not.toBe(nameB);
  });

  it('returns a different name when source type changes', () => {
    const nameA = computeCatalogName({
      type: 'oci',
      id: 'source-1',
      key: 'my-skill',
    });
    const nameB = computeCatalogName({
      type: 'npx',
      id: 'source-1',
      key: 'my-skill',
    });
    expect(nameA).not.toBe(nameB);
  });

  it('is not affected by display name or digest changes', () => {
    // Identity is only [type, id, key] — other metadata does not matter
    const tuple = {
      type: 'oci' as const,
      id: 'quay-public',
      key: 'quay.io/octo/hello-world-skill',
    };
    const name = computeCatalogName(tuple);
    // Same tuple always yields same name regardless of external metadata
    expect(name).toBe(computeCatalogName(tuple));
  });

  it('uses the compact JSON representation for hashing', () => {
    const tuple = {
      type: 'oci' as const,
      id: 'quay',
      key: 'my-skill',
    };
    const expected = createHash('sha256')
      .update(JSON.stringify(['oci', 'quay', 'my-skill']), 'utf8')
      .digest('hex')
      .substring(0, 56);
    expect(computeCatalogName(tuple)).toBe(`skill-${expected}`);
  });
});

// ─── normalizeTags ───────────────────────────────────────────────────

describe('normalizeTags', () => {
  it('trims and lowercases valid tags', () => {
    const result = normalizeTags([' Valid ', 'UPPER']);
    expect(result.tags).toEqual(['valid', 'upper']);
    expect(result.diagnostics).toHaveLength(0);
  });

  it('deduplicates tags after normalization', () => {
    const result = normalizeTags([' Valid ', 'VALID', 'valid']);
    expect(result.tags).toEqual(['valid']);
    expect(result.diagnostics).toHaveLength(2);
  });

  it('drops empty tags after trim', () => {
    const result = normalizeTags(['', '  ', 'ok']);
    expect(result.tags).toEqual(['ok']);
    expect(result.diagnostics).toHaveLength(2);
  });

  it('drops tags that exceed 63 characters', () => {
    const longTag = 'a'.repeat(64);
    const result = normalizeTags([longTag, 'short']);
    expect(result.tags).toEqual(['short']);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toContain('exceeds maximum');
  });

  it('accepts tags at exactly 63 characters', () => {
    const tag63 = 'a'.repeat(63);
    const result = normalizeTags([tag63]);
    expect(result.tags).toEqual([tag63]);
    expect(result.diagnostics).toHaveLength(0);
  });

  it('drops tags with invalid characters', () => {
    const result = normalizeTags(['has space', 'has@symbol', 'valid-tag']);
    expect(result.tags).toEqual(['valid-tag']);
    expect(result.diagnostics).toHaveLength(2);
  });

  it('accepts tags with colons, plus, and hash signs', () => {
    const result = normalizeTags(['rhdh:2', 'version+beta', 'tag#1']);
    expect(result.tags).toEqual(['rhdh:2', 'version+beta', 'tag#1']);
    expect(result.diagnostics).toHaveLength(0);
  });

  it('accepts dots and underscores within tags', () => {
    const result = normalizeTags(['rhdh:2.2', 'has_underscore']);
    expect(result.tags).toEqual(['rhdh:2.2', 'has_underscore']);
    expect(result.diagnostics).toHaveLength(0);
  });

  it('drops tags starting with a hyphen', () => {
    const result = normalizeTags(['-invalid', 'valid']);
    expect(result.tags).toEqual(['valid']);
    expect(result.diagnostics).toHaveLength(1);
  });

  it('drops tags ending with a hyphen', () => {
    const result = normalizeTags(['invalid-', 'valid']);
    expect(result.tags).toEqual(['valid']);
    expect(result.diagnostics).toHaveLength(1);
  });

  it('accepts tags with consecutive hyphens', () => {
    const result = normalizeTags(['in--valid', 'valid']);
    expect(result.tags).toEqual(['in--valid', 'valid']);
    expect(result.diagnostics).toHaveLength(0);
  });

  it('handles mixed valid and invalid tags', () => {
    const result = normalizeTags([
      ' Demo ',
      'UPPER',
      '',
      'valid',
      'has space',
      'demo',
    ]);
    expect(result.tags).toEqual(['demo', 'upper', 'valid']);
    // empty skipped, 'has space' dropped, 'demo' is duplicate of ' Demo '
    expect(result.diagnostics).toHaveLength(3);
  });

  it('returns empty arrays for empty input', () => {
    const result = normalizeTags([]);
    expect(result.tags).toEqual([]);
    expect(result.diagnostics).toEqual([]);
  });

  it('drops tags with uppercase after normalization that have invalid chars', () => {
    // '@' is not in [a-z0-9:+#-]
    const result = normalizeTags(['USER@TAG']);
    expect(result.tags).toEqual([]);
    expect(result.diagnostics).toHaveLength(1);
  });
});

// ─── resolveVersion ──────────────────────────────────────────────────

describe('resolveVersion', () => {
  const testDigest =
    'sha256:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';

  it('accepts a valid SemVer version', () => {
    expect(resolveVersion('1.2.3', testDigest)).toBe('1.2.3');
  });

  it('strips one leading v from a valid SemVer', () => {
    expect(resolveVersion('v1.2.3', testDigest)).toBe('1.2.3');
  });

  it('does not strip multiple leading v characters', () => {
    // 'vv1.2.3' → strip one v → 'v1.2.3' which is not valid SemVer → fallback
    expect(resolveVersion('vv1.2.3', testDigest)).toBe('0.0.0+abcdef012345');
  });

  it('accepts SemVer with pre-release identifier', () => {
    expect(resolveVersion('1.0.0-alpha.1', testDigest)).toBe('1.0.0-alpha.1');
  });

  it('accepts SemVer with build metadata', () => {
    expect(resolveVersion('1.0.0+build.42', testDigest)).toBe('1.0.0+build.42');
  });

  it('accepts SemVer with pre-release and build metadata', () => {
    expect(resolveVersion('1.0.0-beta+exp.sha.5114f85', testDigest)).toBe(
      '1.0.0-beta+exp.sha.5114f85',
    );
  });

  it('strips v from version with pre-release', () => {
    expect(resolveVersion('v2.0.0-rc.1', testDigest)).toBe('2.0.0-rc.1');
  });

  it('falls back to digest-derived version for undefined', () => {
    expect(resolveVersion(undefined, testDigest)).toBe('0.0.0+abcdef012345');
  });

  it('falls back to digest-derived version for empty string', () => {
    expect(resolveVersion('', testDigest)).toBe('0.0.0+abcdef012345');
  });

  it('falls back for non-SemVer version string', () => {
    expect(resolveVersion('1.0', testDigest)).toBe('0.0.0+abcdef012345');
  });

  it('falls back for text version', () => {
    expect(resolveVersion('latest', testDigest)).toBe('0.0.0+abcdef012345');
  });

  it('falls back for version with v prefix and non-SemVer', () => {
    expect(resolveVersion('v1.0', testDigest)).toBe('0.0.0+abcdef012345');
  });

  it('uses first 12 hex digits of digest in fallback', () => {
    const digest =
      'sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    expect(resolveVersion(undefined, digest)).toBe('0.0.0+1234567890ab');
  });

  it('accepts 0.0.0 as valid SemVer', () => {
    expect(resolveVersion('0.0.0', testDigest)).toBe('0.0.0');
  });

  it('throws on malformed digest in fallback path', () => {
    expect(() => resolveVersion(undefined, 'not-a-digest')).toThrow(
      'invalid digest',
    );
  });

  it('throws on short digest in fallback path', () => {
    expect(() => resolveVersion('', 'sha256:short')).toThrow('invalid digest');
  });

  it('throws on invalid digest even when valid SemVer is provided', () => {
    expect(() => resolveVersion('1.2.3', 'not-a-digest')).toThrow(
      'invalid digest',
    );
  });
});

// ─── OCI references ──────────────────────────────────────────────────

describe('buildOciRef', () => {
  const validDigest =
    'sha256:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';

  it('builds a valid OCI URI', () => {
    const uri = buildOciRef('quay.io', 'octo/hello-world-skill', validDigest);
    expect(uri).toBe(`oci://quay.io/octo/hello-world-skill@${validDigest}`);
  });

  it('throws on invalid digest', () => {
    expect(() => buildOciRef('quay.io', 'octo/skill', 'sha256:short')).toThrow(
      'invalid digest',
    );
  });

  it('throws on empty registry', () => {
    expect(() => buildOciRef('', 'octo/skill', validDigest)).toThrow(
      'non-empty',
    );
  });

  it('throws on empty repository', () => {
    expect(() => buildOciRef('quay.io', '', validDigest)).toThrow('non-empty');
  });
});

describe('parseOciRef', () => {
  const validDigest =
    'sha256:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';

  it('parses a valid OCI URI', () => {
    const uri = `oci://quay.io/octo/hello-world-skill@${validDigest}`;
    const ref = parseOciRef(uri);
    expect(ref.registry).toBe('quay.io');
    expect(ref.repository).toBe('octo/hello-world-skill');
    expect(ref.digest).toBe(validDigest);
    expect(ref.uri).toBe(uri);
  });

  it('parses OCI URI with nested repository path', () => {
    const uri = `oci://quay.io/org/sub/repo@${validDigest}`;
    const ref = parseOciRef(uri);
    expect(ref.registry).toBe('quay.io');
    expect(ref.repository).toBe('org/sub/repo');
  });

  it('validates digest agreement with record digest', () => {
    const uri = `oci://quay.io/octo/skill@${validDigest}`;
    expect(() => parseOciRef(uri, validDigest)).not.toThrow();
  });

  it('throws on digest disagreement', () => {
    const uri = `oci://quay.io/octo/skill@${validDigest}`;
    const otherDigest =
      'sha256:1111111111111111111111111111111111111111111111111111111111111111';
    expect(() => parseOciRef(uri, otherDigest)).toThrow('does not match');
  });

  it('throws on malformed OCI URI — missing scheme', () => {
    expect(() => parseOciRef('quay.io/octo/skill@sha256:abc')).toThrow(
      'malformed',
    );
  });

  it('throws on malformed OCI URI — wrong scheme', () => {
    expect(() =>
      parseOciRef(`https://quay.io/octo/skill@${validDigest}`),
    ).toThrow('malformed');
  });

  it('throws on malformed OCI URI — tag instead of digest', () => {
    expect(() => parseOciRef('oci://quay.io/octo/skill:latest')).toThrow(
      'malformed',
    );
  });

  it('round-trips through build and parse', () => {
    const uri = buildOciRef('quay.io', 'octo/my-skill', validDigest);
    const ref = parseOciRef(uri, validDigest);
    expect(ref.registry).toBe('quay.io');
    expect(ref.repository).toBe('octo/my-skill');
    expect(ref.digest).toBe(validDigest);
  });
});

// ─── npx references ─────────────────────────────────────────────────

describe('buildNpxRef', () => {
  const validDigest =
    'sha256:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';

  it('builds a valid npx reference', () => {
    const ref = buildNpxRef(
      'https://registry.example.com/skills/my-skill/SKILL.md',
      validDigest,
    );
    expect(ref).toBe(
      `https://registry.example.com/skills/my-skill/SKILL.md#${validDigest}`,
    );
  });

  it('preserves query parameters in original order', () => {
    const ref = buildNpxRef(
      'https://registry.example.com/skills/SKILL.md?version=2&format=raw',
      validDigest,
    );
    expect(ref).toContain('?version=2&format=raw');
    expect(ref).toContain(`#${validDigest}`);
  });

  it('throws on invalid digest', () => {
    expect(() =>
      buildNpxRef('https://example.com/skill.md', 'sha256:short'),
    ).toThrow('invalid digest');
  });

  it('throws on HTTP URL (non-HTTPS)', () => {
    expect(() =>
      buildNpxRef('http://example.com/skill.md', validDigest),
    ).toThrow('HTTPS');
  });

  it('throws on URL with credentials (userinfo)', () => {
    expect(() =>
      buildNpxRef('https://user:pass@example.com/skill.md', validDigest),
    ).toThrow('credentials');
  });

  it('throws on URL with username only', () => {
    expect(() =>
      buildNpxRef('https://user@example.com/skill.md', validDigest),
    ).toThrow('credentials');
  });

  it('throws on URL with fragment', () => {
    expect(() =>
      buildNpxRef('https://example.com/skill.md#section', validDigest),
    ).toThrow('fragment');
  });

  it('throws on URL with query-string credentials (token)', () => {
    expect(() =>
      buildNpxRef('https://example.com/skill.md?token=secret123', validDigest),
    ).toThrow('sensitive query parameter');
  });

  it('throws on URL with query-string credentials (access_token)', () => {
    expect(() =>
      buildNpxRef('https://example.com/skill.md?access_token=abc', validDigest),
    ).toThrow('sensitive query parameter');
  });

  it('throws on URL with query-string credentials (api_key)', () => {
    expect(() =>
      buildNpxRef('https://example.com/skill.md?api_key=xyz', validDigest),
    ).toThrow('sensitive query parameter');
  });

  it('throws on URL with AWS signed query parameters', () => {
    expect(() =>
      buildNpxRef(
        'https://bucket.s3.amazonaws.com/skill.md?X-Amz-Credential=AKID',
        validDigest,
      ),
    ).toThrow('sensitive query parameter');
  });

  it('throws on invalid URL', () => {
    expect(() => buildNpxRef('not-a-url', validDigest)).toThrow('invalid URL');
  });

  it('accepts non-sensitive query parameters', () => {
    const ref = buildNpxRef(
      'https://example.com/skill.md?version=2&format=raw',
      validDigest,
    );
    expect(ref).toContain('version=2');
    expect(ref).toContain('format=raw');
  });

  it('accepts a URL with key= query parameter (not credential-sensitive)', () => {
    const ref = buildNpxRef(
      'https://example.com/skill.md?key=some-record-id',
      validDigest,
    );
    expect(ref).toContain('key=some-record-id');
  });

  it('throws on URL with private_token query parameter', () => {
    expect(() =>
      buildNpxRef(
        'https://gitlab.example.com/skill.md?private_token=glpat-xxx',
        validDigest,
      ),
    ).toThrow('sensitive query parameter');
  });

  it('throws on URL with auth_token query parameter', () => {
    expect(() =>
      buildNpxRef(
        'https://example.com/skill.md?auth_token=abc123',
        validDigest,
      ),
    ).toThrow('sensitive query parameter');
  });

  it('throws on URL with bearer_token query parameter', () => {
    expect(() =>
      buildNpxRef('https://example.com/skill.md?bearer_token=xyz', validDigest),
    ).toThrow('sensitive query parameter');
  });

  it('throws on URL with client_secret query parameter', () => {
    expect(() =>
      buildNpxRef(
        'https://example.com/skill.md?client_secret=s3cret',
        validDigest,
      ),
    ).toThrow('sensitive query parameter');
  });

  it('throws on URL with refresh_token query parameter', () => {
    expect(() =>
      buildNpxRef(
        'https://example.com/skill.md?refresh_token=rt-abc',
        validDigest,
      ),
    ).toThrow('sensitive query parameter');
  });

  it('throws on URL with multiple Azure SAS params (co-occurrence)', () => {
    expect(() =>
      buildNpxRef(
        'https://blob.core.windows.net/skill.md?sv=2020-08-04&ss=b&srt=sco&sp=r&se=2030-01-01',
        validDigest,
      ),
    ).toThrow('Azure SAS token parameters');
  });

  it('accepts a URL with fewer than 3 Azure SAS-like params', () => {
    // Only 2 params that happen to match Azure SAS names — not enough to trigger
    const ref = buildNpxRef(
      'https://example.com/skill.md?sv=2&sp=r',
      validDigest,
    );
    expect(ref).toContain('sv=2');
    expect(ref).toContain('sp=r');
  });

  it('normalizes URL via URL API (host lowercased, default port stripped)', () => {
    const ref = buildNpxRef('https://EXAMPLE.COM:443/skill.md', validDigest);
    // URL API normalizes host to lowercase and strips default HTTPS port
    expect(ref).toMatch(/^https:\/\/example\.com\/skill\.md#/);
  });

  it('includes npx reference context in error messages for credentials', () => {
    expect(() =>
      buildNpxRef('https://user:pass@example.com/skill.md', validDigest),
    ).toThrow('npx reference: URL contains credentials');
  });

  it('includes npx reference context in HTTPS error messages', () => {
    expect(() =>
      buildNpxRef('http://example.com/skill.md', validDigest),
    ).toThrow('npx reference: URL must use HTTPS');
  });

  it.each([
    [
      'credentials',
      'https://user:example-secret@example.com/skill.md',
      'npx reference: URL contains credentials',
    ],
    [
      'a fragment',
      'https://example.com/skill.md?token=example-secret#section',
      'npx reference: URL contains a fragment',
    ],
    [
      'a non-HTTPS URL',
      'http://example.com/skill.md?token=example-secret',
      'npx reference: URL must use HTTPS',
    ],
    ['an invalid URL', 'invalid?token=example-secret', 'invalid URL'],
  ])('does not expose the URL when rejecting %s', (_, sourceUri, expected) => {
    let message = '';
    try {
      buildNpxRef(sourceUri, validDigest);
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toBe(expected);
  });
});

describe('parseNpxRef', () => {
  const validDigest =
    'sha256:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';

  it('parses a valid npx reference', () => {
    const refStr = `https://registry.example.com/skills/SKILL.md#${validDigest}`;
    const ref = parseNpxRef(refStr);
    expect(ref.sourceUri).toBe('https://registry.example.com/skills/SKILL.md');
    expect(ref.digest).toBe(validDigest);
    expect(ref.ref).toBe(refStr);
  });

  it('parses npx reference with query string', () => {
    const refStr = `https://registry.example.com/skills/SKILL.md?version=2&format=raw#${validDigest}`;
    const ref = parseNpxRef(refStr);
    expect(ref.sourceUri).toBe(
      'https://registry.example.com/skills/SKILL.md?version=2&format=raw',
    );
    expect(ref.digest).toBe(validDigest);
  });

  it('throws on reference without # separator', () => {
    expect(() => parseNpxRef('https://example.com/skill.md')).toThrow(
      "no '#' separator",
    );
  });

  it('throws on reference with invalid digest after #', () => {
    expect(() =>
      parseNpxRef('https://example.com/skill.md#sha256:short'),
    ).toThrow('invalid digest');
  });

  it('throws on non-HTTPS URL in reference', () => {
    expect(() =>
      parseNpxRef(`http://example.com/skill.md#${validDigest}`),
    ).toThrow('HTTPS');
  });

  it('throws on URL with credentials in reference', () => {
    expect(() =>
      parseNpxRef(`https://user:pass@example.com/skill.md#${validDigest}`),
    ).toThrow('credentials');
  });

  it('throws on reference with sensitive query param', () => {
    expect(() =>
      parseNpxRef(`https://example.com/skill.md?token=x#${validDigest}`),
    ).toThrow('sensitive query parameter');
  });

  it.each([
    [
      'missing separator',
      'https://example.com/skill.md?token=example-secret',
      "malformed npx reference (no '#' separator)",
    ],
    [
      'invalid digest',
      'https://example.com/skill.md?token=example-secret#bad',
      'malformed npx reference: invalid digest',
    ],
    [
      'invalid URL',
      `invalid?token=example-secret#${validDigest}`,
      'malformed npx reference: invalid URL',
    ],
    [
      'non-HTTPS URL',
      `http://example.com/skill.md?token=example-secret#${validDigest}`,
      'npx reference: URL must use HTTPS',
    ],
    [
      'fragment',
      `https://example.com/skill.md?token=example-secret#section#${validDigest}`,
      'npx reference: URL contains a fragment',
    ],
  ])('does not expose the URL for a reference with %s', (_, ref, expected) => {
    let message = '';
    try {
      parseNpxRef(ref);
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toBe(expected);
  });

  it('round-trips through build and parse', () => {
    const sourceUri =
      'https://registry.example.com/skills/my-skill/SKILL.md?version=2&format=raw';
    const refStr = buildNpxRef(sourceUri, validDigest);
    const ref = parseNpxRef(refStr);
    expect(ref.sourceUri).toBe(sourceUri);
    expect(ref.digest).toBe(validDigest);
  });

  it('round-trip preserves query parameter order', () => {
    const sourceUri = 'https://registry.example.com/skills/SKILL.md?b=2&a=1';
    const refStr = buildNpxRef(sourceUri, validDigest);
    const ref = parseNpxRef(refStr);
    // URL API preserves insertion order of search params
    expect(ref.sourceUri).toContain('b=2&a=1');
  });
});
