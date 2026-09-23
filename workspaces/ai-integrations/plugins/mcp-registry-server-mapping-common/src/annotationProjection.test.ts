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

/* eslint-disable no-script-url */

import {
  projectAnnotations,
  attachBaseKeysToCandidates,
  buildBaseNameSegment,
  buildChildWalkPath,
  buildHashedNameSegment,
  collectScalarCandidates,
  computeAnnotationHashSuffix,
  groupCandidatesByBaseKey,
  isRefusedUrl,
  resolveDisambiguatedAnnotationKey,
  shouldSkipSecretRedactedField,
  sortAnnotationEntries,
  uniquifyAnnotationKey,
} from './annotationProjection';
import { buildLinks, trackConsumedRemotePaths } from './mapServerToEntity';
import type { McpServerDocument } from './types';
import { assertServerJsonSchema } from './util';

/** Draft server.json schema URI used by fixtures and examples. */
const SERVER_SCHEMA_URI =
  'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json';

/** Minimal valid server.json document for reuse across tests. */
function makeMinimalDoc(
  overrides?: Partial<McpServerDocument>,
): McpServerDocument {
  return {
    $schema: SERVER_SCHEMA_URI,
    name: 'weather',
    description: 'A weather server',
    version: '1.0.0',
    remotes: [{ type: 'streamable-http', url: 'https://example.com/mcp' }],
    ...overrides,
  };
}

/**
 * Consumed paths and reserved keys produced by the direct mapping
 * for the minimal document (mirrors mapServerToEntity hand-off).
 */
function makeMinimalConsumed(doc: McpServerDocument): {
  consumedPaths: string[];
  reservedAnnotationKeys: string[];
} {
  const consumedPaths: string[] = ['name', 'description', 'version'];
  const reservedAnnotationKeys: string[] = [
    'modelcontextprotocol.io/name',
    'modelcontextprotocol.io/version',
  ];

  const linksResult = buildLinks(doc);
  consumedPaths.push(...linksResult.consumedPaths);
  reservedAnnotationKeys.push(...linksResult.reservedAnnotationKeys);

  if (doc.title !== undefined && doc.title !== null) {
    consumedPaths.push('title');
  }

  consumedPaths.push(...trackConsumedRemotePaths(doc));

  return { consumedPaths, reservedAnnotationKeys };
}

/* ------------------------------------------------------------------ */
/*  buildBaseNameSegment / buildHashedNameSegment (task 4.4)            */
/* ------------------------------------------------------------------ */

describe('buildBaseNameSegment', () => {
  it('joins segments with dots', () => {
    expect(buildBaseNameSegment(['icons', '0', 'mimeType'])).toBe(
      'icons.0.mimetype',
    );
  });

  it('sanitizes _meta leading underscore to x', () => {
    expect(buildBaseNameSegment(['_meta', 'key'])).toBe('xmeta.key');
  });

  it('sanitizes slash in key to hyphen', () => {
    expect(
      buildBaseNameSegment([
        '_meta',
        'io.modelcontextprotocol.registry/publisher-provided',
        'x',
      ]),
    ).toBe('xmeta.io.modelcontextprotocol.registry-publisher-provided.x');
  });

  it('boundary-normalizes non-alphanumeric segment ends', () => {
    // A lone "/" sanitizes to "-" then boundary-normalizes to "x"
    expect(buildBaseNameSegment(['obj', '/', 'leaf'])).toBe('obj.x.leaf');
  });

  it('leaves array indices unchanged', () => {
    expect(buildBaseNameSegment(['packages', '0', 'identifier'])).toBe(
      'packages.0.identifier',
    );
  });

  it('lowercases segments', () => {
    expect(buildBaseNameSegment(['MyKey'])).toBe('mykey');
  });

  it('applies post-join boundary normalization', () => {
    // If the first segment sanitizes to start with non-alpha, joined
    // string is boundary-normalized
    expect(buildBaseNameSegment(['_top'])).toBe('xtop');
  });
});

describe('buildHashedNameSegment', () => {
  it('appends hash suffix to base', () => {
    const result = buildHashedNameSegment(['packages', '0', 'identifier']);
    expect(result).toMatch(/^packages\.0\.identifier-[0-9a-f]{8}$/);
    expect(result.length).toBeLessThanOrEqual(63);
  });

  it('truncates and hashes when base exceeds 63 characters', () => {
    // Create a path that sanitizes to > 63 chars
    const segments = ['a'.repeat(30), 'b'.repeat(30), 'c'.repeat(10)];
    const result = buildHashedNameSegment(segments);
    expect(result.length).toBeLessThanOrEqual(63);
    expect(result).toMatch(/-[0-9a-f]{8}$/);
  });

  it('produces deterministic output', () => {
    const a = buildHashedNameSegment(['foo', 'bar']);
    const b = buildHashedNameSegment(['foo', 'bar']);
    expect(a).toBe(b);
  });

  it('produces distinct hashes for distinct paths', () => {
    const a = computeAnnotationHashSuffix(['foo', 'bar']);
    const b = computeAnnotationHashSuffix(['foo', 'baz']);
    expect(a).not.toBe(b);
  });
});

/* ------------------------------------------------------------------ */
/*  isRefusedUrl (D11 for projection)                                  */
/* ------------------------------------------------------------------ */

describe('isRefusedUrl', () => {
  it('refuses javascript: URLs', () => {
    expect(isRefusedUrl('javascript:alert(1)')).toBe(true);
  });

  it('refuses data: URLs', () => {
    expect(isRefusedUrl('data:text/html,x')).toBe(true);
  });

  it('refuses file: URLs', () => {
    expect(isRefusedUrl('file:///etc/passwd')).toBe(true);
  });

  it('refuses blob: URLs', () => {
    expect(isRefusedUrl('blob:https://example.com/uuid')).toBe(true);
  });

  it('does not refuse http: URLs', () => {
    expect(isRefusedUrl('http://localhost:7007/mcp')).toBe(false);
  });

  it('does not refuse https: URLs', () => {
    expect(isRefusedUrl('https://example.com/icon.png')).toBe(false);
  });

  it('does not refuse non-URL strings', () => {
    expect(isRefusedUrl('@scope/pkg')).toBe(false);
    expect(isRefusedUrl('some description text')).toBe(false);
    expect(isRefusedUrl('npx')).toBe(false);
  });

  it('does not refuse numbers', () => {
    expect(isRefusedUrl(42)).toBe(false);
  });

  it('does not refuse booleans', () => {
    expect(isRefusedUrl(true)).toBe(false);
  });

  it('does not refuse empty strings', () => {
    expect(isRefusedUrl('')).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  Scalar walk helpers (collectScalars splits)                          */
/* ------------------------------------------------------------------ */

describe('buildChildWalkPath', () => {
  it('uses the segment alone as dot path at the root', () => {
    expect(buildChildWalkPath({ segments: [], dotPath: '' }, 'name')).toEqual({
      segments: ['name'],
      dotPath: 'name',
    });
  });

  it('joins nested segments with dots', () => {
    expect(
      buildChildWalkPath({ segments: ['remotes'], dotPath: 'remotes' }, '0'),
    ).toEqual({
      segments: ['remotes', '0'],
      dotPath: 'remotes.0',
    });
  });
});

describe('shouldSkipSecretRedactedField', () => {
  it('skips default, value, and choices when isSecret is true', () => {
    expect(shouldSkipSecretRedactedField(true, 'default')).toBe(true);
    expect(shouldSkipSecretRedactedField(true, 'value')).toBe(true);
    expect(shouldSkipSecretRedactedField(true, 'choices')).toBe(true);
  });

  it('does not skip other keys on secret inputs', () => {
    expect(shouldSkipSecretRedactedField(true, 'name')).toBe(false);
    expect(shouldSkipSecretRedactedField(true, 'isSecret')).toBe(false);
  });

  it('does not skip redacted field names when isSecret is false', () => {
    expect(shouldSkipSecretRedactedField(false, 'default')).toBe(false);
    expect(shouldSkipSecretRedactedField(false, 'value')).toBe(false);
  });
});

describe('collectScalarCandidates', () => {
  it('returns no candidates for null, undefined, or empty containers (D12)', () => {
    expect(collectScalarCandidates(null)).toEqual([]);
    expect(collectScalarCandidates(undefined)).toEqual([]);
    expect(collectScalarCandidates([])).toEqual([]);
    expect(collectScalarCandidates({})).toEqual([]);
  });

  it('collects scalar leaves with dot paths and string values', () => {
    expect(
      collectScalarCandidates({
        count: 2,
        enabled: false,
        label: 'x',
      }),
    ).toEqual([
      { segments: ['count'], dotPath: 'count', value: '2' },
      { segments: ['enabled'], dotPath: 'enabled', value: 'false' },
      { segments: ['label'], dotPath: 'label', value: 'x' },
    ]);
  });

  it('walks array indices as decimal path segments', () => {
    expect(collectScalarCandidates({ tags: ['a', 'b'] })).toEqual([
      { segments: ['tags', '0'], dotPath: 'tags.0', value: 'a' },
      { segments: ['tags', '1'], dotPath: 'tags.1', value: 'b' },
    ]);
  });

  it('omits consumed dot paths', () => {
    expect(
      collectScalarCandidates({ name: 'weather', extra: 'keep' }, ['name']),
    ).toEqual([{ segments: ['extra'], dotPath: 'extra', value: 'keep' }]);
  });

  it('omits D11-refused URL scalars', () => {
    expect(
      collectScalarCandidates({
        safe: 'https://example.com',
        unsafe: 'javascript:alert(1)',
      }),
    ).toEqual([
      { segments: ['safe'], dotPath: 'safe', value: 'https://example.com' },
    ]);
  });

  it('prunes D9 secret default/value/choices but keeps other fields', () => {
    expect(
      collectScalarCandidates({
        input: {
          isSecret: true,
          name: 'token',
          default: 'secret-default',
          value: 'secret-live',
          choices: ['a'],
        },
      }),
    ).toEqual([
      {
        segments: ['input', 'isSecret'],
        dotPath: 'input.isSecret',
        value: 'true',
      },
      { segments: ['input', 'name'], dotPath: 'input.name', value: 'token' },
    ]);
  });

  it('throws when isSecret is present but not a boolean', () => {
    expect(() =>
      collectScalarCandidates({
        input: {
          isSecret: 'true',
          name: 'token',
          default: 'secret-default',
        },
      }),
    ).toThrow('isSecret must be a boolean at "input" (received string)');
  });
});

/* ------------------------------------------------------------------ */
/*  Annotation resolution helpers (projectAnnotations splits)            */
/* ------------------------------------------------------------------ */

describe('attachBaseKeysToCandidates', () => {
  it('prefixes modelcontextprotocol.io and flags long name segments', () => {
    const [shortPath] = attachBaseKeysToCandidates([
      {
        segments: ['icons', '0', 'mimeType'],
        dotPath: 'icons.0.mimeType',
        value: 'image/png',
      },
    ]);
    expect(shortPath.baseKey).toBe('modelcontextprotocol.io/icons.0.mimetype');
    expect(shortPath.needsTruncationHash).toBe(false);
  });
});

describe('groupCandidatesByBaseKey', () => {
  it('groups items that share the same baseKey', () => {
    const grouped = groupCandidatesByBaseKey([
      {
        segments: ['a'],
        dotPath: 'a',
        value: '1',
        baseKey: 'modelcontextprotocol.io/a',
        needsTruncationHash: false,
      },
      {
        segments: ['b'],
        dotPath: 'b',
        value: '2',
        baseKey: 'modelcontextprotocol.io/a',
        needsTruncationHash: false,
      },
      {
        segments: ['c'],
        dotPath: 'c',
        value: '3',
        baseKey: 'modelcontextprotocol.io/c',
        needsTruncationHash: false,
      },
    ]);
    expect(grouped.get('modelcontextprotocol.io/a')).toHaveLength(2);
    expect(grouped.get('modelcontextprotocol.io/c')).toHaveLength(1);
  });
});

describe('resolveDisambiguatedAnnotationKey', () => {
  const baseKey = 'modelcontextprotocol.io/foo';
  const item = {
    segments: ['foo'],
    dotPath: 'foo',
    value: 'bar',
    baseKey,
    needsTruncationHash: false,
  };

  it('returns baseKey when disambiguation is not required', () => {
    expect(resolveDisambiguatedAnnotationKey(item, baseKey, false)).toBe(
      baseKey,
    );
  });

  it('applies hash-suffix disambiguation (D3) when required', () => {
    expect(resolveDisambiguatedAnnotationKey(item, baseKey, true)).toBe(
      `modelcontextprotocol.io/${buildHashedNameSegment(['foo'])}`,
    );
  });

  it('keeps truncated base key when needsTruncationHash is already set', () => {
    expect(
      resolveDisambiguatedAnnotationKey(
        { ...item, needsTruncationHash: true },
        baseKey,
        true,
      ),
    ).toBe(baseKey);
  });
});

describe('uniquifyAnnotationKey', () => {
  it('returns the key when unclaimed or owned by the same dot path', () => {
    const annotations = new Map([['modelcontextprotocol.io/x', 'v']]);
    const keyOwners = new Map([['modelcontextprotocol.io/x', 'x']]);
    expect(
      uniquifyAnnotationKey(
        'modelcontextprotocol.io/x',
        'x',
        annotations,
        keyOwners,
      ),
    ).toBe('modelcontextprotocol.io/x');
  });

  it('appends a counter when a different source path claims the key', () => {
    const annotations = new Map([['modelcontextprotocol.io/x', 'first']]);
    const keyOwners = new Map([['modelcontextprotocol.io/x', 'path.a']]);
    expect(
      uniquifyAnnotationKey(
        'modelcontextprotocol.io/x',
        'path.b',
        annotations,
        keyOwners,
      ),
    ).toBe('modelcontextprotocol.io/x-2');
  });

  it('increments the counter until a free key is found', () => {
    const annotations = new Map([
      ['modelcontextprotocol.io/x', 'first'],
      ['modelcontextprotocol.io/x-2', 'second'],
    ]);
    const keyOwners = new Map([
      ['modelcontextprotocol.io/x', 'path.a'],
      ['modelcontextprotocol.io/x-2', 'path.c'],
    ]);
    expect(
      uniquifyAnnotationKey(
        'modelcontextprotocol.io/x',
        'path.b',
        annotations,
        keyOwners,
      ),
    ).toBe('modelcontextprotocol.io/x-3');
  });

  it('truncates counter-suffixed keys when the name segment exceeds 63 characters', () => {
    const prefix = 'modelcontextprotocol.io/';
    const longName = 'a'.repeat(63);
    const finalKey = `${prefix}${longName}`;
    const annotations = new Map([[finalKey, 'first']]);
    const keyOwners = new Map([[finalKey, 'path.a']]);
    const result = uniquifyAnnotationKey(
      finalKey,
      'path.b',
      annotations,
      keyOwners,
    );
    expect(result.startsWith(prefix)).toBe(true);
    const nameSegment = result.slice(prefix.length);
    expect(nameSegment.length).toBeLessThanOrEqual(63);
    expect(nameSegment).toMatch(/-2$/);
    expect(result).not.toBe(finalKey);
    expect(annotations.has(result)).toBe(false);
  });
});

describe('sortAnnotationEntries', () => {
  it('sorts keys lexicographically', () => {
    expect(
      sortAnnotationEntries(
        new Map([
          ['modelcontextprotocol.io/z', 'z'],
          ['modelcontextprotocol.io/a', 'a'],
          ['modelcontextprotocol.io/m', 'm'],
        ]),
      ),
    ).toEqual({
      'modelcontextprotocol.io/a': 'a',
      'modelcontextprotocol.io/m': 'm',
      'modelcontextprotocol.io/z': 'z',
    });
  });
});

/* ------------------------------------------------------------------ */
/*  projectAnnotations — basic projection                              */
/* ------------------------------------------------------------------ */

describe('projectAnnotations', () => {
  describe('basic projection', () => {
    it('projects unmapped scalar leaves as annotations', () => {
      const doc = makeMinimalDoc({
        icons: [
          { src: 'https://cdn.example.com/icon.png', mimeType: 'image/png' },
        ],
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      expect(result['modelcontextprotocol.io/icons.0.src']).toBe(
        'https://cdn.example.com/icon.png',
      );
      expect(result['modelcontextprotocol.io/icons.0.mimetype']).toBe(
        'image/png',
      );
    });

    it('projects nested object scalars with dot paths', () => {
      const doc = makeMinimalDoc({
        repository: {
          url: 'https://github.com/org/repo',
          source: 'github',
          id: '12345',
          subfolder: 'src/server',
        },
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      // repository.url is consumed — not projected
      expect(result).not.toHaveProperty(
        'modelcontextprotocol.io/repository.url',
      );
      // Non-consumed repository sub-fields are projected
      expect(result['modelcontextprotocol.io/repository.source']).toBe(
        'github',
      );
      expect(result['modelcontextprotocol.io/repository.id']).toBe('12345');
      expect(result['modelcontextprotocol.io/repository.subfolder']).toBe(
        'src/server',
      );
    });

    it('consumes repository.url without reserving annotations when D11 rejects the URL', () => {
      const doc = makeMinimalDoc({
        repository: {
          url: 'javascript:alert(1)',
          source: 'github',
          id: '12345',
        },
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);

      expect(consumedPaths).toContain('repository.url');
      expect(reservedAnnotationKeys).not.toContain(
        'modelcontextprotocol.io/repository.url',
      );
      expect(reservedAnnotationKeys).not.toContain(
        'backstage.io/source-location',
      );

      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );
      expect(result).not.toHaveProperty(
        'modelcontextprotocol.io/repository.url',
      );
      expect(result['modelcontextprotocol.io/repository.source']).toBe(
        'github',
      );
      expect(result['modelcontextprotocol.io/repository.id']).toBe('12345');
    });

    it('projects array elements with zero-based indices', () => {
      const doc = makeMinimalDoc({
        packages: [
          {
            registryType: 'npm',
            identifier: '@scope/pkg',
            transport: { type: 'stdio' },
          },
        ],
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      expect(result['modelcontextprotocol.io/packages.0.registrytype']).toBe(
        'npm',
      );
      expect(result['modelcontextprotocol.io/packages.0.identifier']).toBe(
        '@scope/pkg',
      );
      expect(result['modelcontextprotocol.io/packages.0.transport.type']).toBe(
        'stdio',
      );
    });

    it('serializes non-string scalars as strings', () => {
      const doc = makeMinimalDoc({
        _meta: {
          port: 8080,
          secure: true,
        },
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      expect(result['modelcontextprotocol.io/xmeta.port']).toBe('8080');
      expect(result['modelcontextprotocol.io/xmeta.secure']).toBe('true');
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Consumed paths — not re-projected                                */
  /* ---------------------------------------------------------------- */

  describe('consumed paths', () => {
    it('does not re-project name, description, version', () => {
      const doc = makeMinimalDoc();
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      // These are consumed by direct mapping — no projection
      expect(result).not.toHaveProperty('modelcontextprotocol.io/name');
      expect(result).not.toHaveProperty('modelcontextprotocol.io/description');
      expect(result).not.toHaveProperty('modelcontextprotocol.io/version');
    });

    it('does not re-project consumed remote type and url', () => {
      const doc = makeMinimalDoc({
        remotes: [
          {
            type: 'streamable-http',
            url: 'https://example.com/mcp',
            headers: [
              { name: 'Authorization', isSecret: false, default: 'Bearer tok' },
            ],
          },
        ],
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      // type and url are consumed
      expect(result).not.toHaveProperty(
        'modelcontextprotocol.io/remotes.0.type',
      );
      expect(result).not.toHaveProperty(
        'modelcontextprotocol.io/remotes.0.url',
      );

      // headers are NOT consumed — they project
      expect(result['modelcontextprotocol.io/remotes.0.headers.0.name']).toBe(
        'Authorization',
      );
    });

    it('does not re-project consumed websiteUrl', () => {
      const doc = makeMinimalDoc({
        websiteUrl: 'https://weather.example.com',
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      expect(result).not.toHaveProperty('modelcontextprotocol.io/websiteurl');
    });

    it('does not re-project consumed title', () => {
      const doc = makeMinimalDoc({ title: 'Weather Server' });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      expect(result).not.toHaveProperty('modelcontextprotocol.io/title');
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Reserved key collision (D3 hash disambiguation)                  */
  /* ---------------------------------------------------------------- */

  describe('reserved key collision disambiguation', () => {
    it('does not overwrite reserved annotation keys', () => {
      // Force a scenario where a distinct source path would sanitize
      // to the same key as a reserved annotation. We pass
      // 'modelcontextprotocol.io/repository.source' as reserved
      // and add a real 'repository.source' scalar.
      const doc = makeMinimalDoc({
        repository: {
          url: 'https://github.com/org/repo',
          source: 'github',
        },
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);

      // Artificially add the projected key as reserved to test disambiguation
      reservedAnnotationKeys.push('modelcontextprotocol.io/repository.source');

      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      // The projected scalar should appear under a hash-disambiguated key
      expect(result).not.toHaveProperty(
        'modelcontextprotocol.io/repository.source',
      );

      // Should have a hash-suffixed key containing the value
      const keys = Object.keys(result);
      const disambiguated = keys.find(
        k =>
          k.startsWith('modelcontextprotocol.io/repository.source-') &&
          /[0-9a-f]{8}$/.test(k),
      );
      expect(disambiguated).toBeDefined();
      expect(result[disambiguated!]).toBe('github');
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Key sanitization (task 4.4)                                      */
  /* ---------------------------------------------------------------- */

  describe('key sanitization', () => {
    it('sanitizes _meta key to xmeta', () => {
      const doc = makeMinimalDoc({
        _meta: { publisher: 'test-publisher' },
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      expect(result['modelcontextprotocol.io/xmeta.publisher']).toBe(
        'test-publisher',
      );
    });

    it('sanitizes nested key with slash to hyphen', () => {
      const doc = makeMinimalDoc({
        _meta: {
          'io.modelcontextprotocol.registry/publisher-provided': {
            x: 'value',
          },
        },
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      expect(
        result[
          'modelcontextprotocol.io/xmeta.io.modelcontextprotocol.registry-publisher-provided.x'
        ],
      ).toBe('value');
    });

    it('lowercases key segments', () => {
      const doc = makeMinimalDoc({
        _meta: { MyCustomKey: 'value' },
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      expect(result['modelcontextprotocol.io/xmeta.mycustomkey']).toBe('value');
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Key truncation (task 4.4)                                        */
  /* ---------------------------------------------------------------- */

  describe('key truncation', () => {
    it('truncates and hashes when name segment exceeds 63 chars', () => {
      // Create deeply nested path that exceeds 63 chars
      const doc = makeMinimalDoc({
        _meta: {
          'io.modelcontextprotocol.registry/publisher-provided': {
            advancedSettings: {
              veryLongPropertyNameThatWillCauseThisToExceed: 'value',
            },
          },
        },
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      // All keys must be ≤ 63 chars in the name segment
      for (const key of Object.keys(result)) {
        const nameSegment = key.replace('modelcontextprotocol.io/', '');
        expect(nameSegment.length).toBeLessThanOrEqual(63);
      }

      // The value should still be recoverable
      const values = Object.values(result);
      expect(values).toContain('value');
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Sanitization collision disambiguation (task 4.4)                 */
  /* ---------------------------------------------------------------- */

  describe('sanitization collision disambiguation', () => {
    it('disambiguates distinct paths that sanitize to the same key', () => {
      // Two distinct keys that sanitize identically:
      // "my/key" → "my-key" and "my-key" → "my-key"
      const doc = makeMinimalDoc({
        _meta: {
          'my/key': 'value1',
          'my-key': 'value2',
        },
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      // Both values must be present under distinct keys
      const values = Object.values(result);
      expect(values).toContain('value1');
      expect(values).toContain('value2');

      // Keys must be distinct
      const keys = Object.keys(result).filter(k => k.includes('xmeta.my'));
      expect(keys).toHaveLength(2);
      expect(keys[0]).not.toBe(keys[1]);

      // Both should have hash suffixes
      for (const key of keys) {
        expect(key).toMatch(/-[0-9a-f]{8}$/);
      }
    });
  });

  /* ---------------------------------------------------------------- */
  /*  D9 secret redaction (task 4.6)                                   */
  /* ---------------------------------------------------------------- */

  describe('D9 secret redaction', () => {
    it('prunes default/value of isSecret: true env var', () => {
      const doc = makeMinimalDoc({
        packages: [
          {
            registryType: 'npm',
            identifier: 'pkg',
            transport: { type: 'stdio' },
            environmentVariables: [
              {
                name: 'API_KEY',
                description: 'The API key',
                isSecret: true,
                default: 'sk-1234',
                value: 'sk-live-5678',
                placeholder: '***',
              },
            ],
          },
        ],
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      // Secret default and value must NOT be projected
      const allValues = Object.values(result);
      expect(allValues).not.toContain('sk-1234');
      expect(allValues).not.toContain('sk-live-5678');

      // Non-secret siblings MUST project
      expect(
        result[
          'modelcontextprotocol.io/packages.0.environmentvariables.0.name'
        ],
      ).toBe('API_KEY');
      expect(
        result[
          'modelcontextprotocol.io/packages.0.environmentvariables.0.issecret'
        ],
      ).toBe('true');
      expect(
        result[
          'modelcontextprotocol.io/packages.0.environmentvariables.0.description'
        ],
      ).toBe('The API key');
      expect(
        result[
          'modelcontextprotocol.io/packages.0.environmentvariables.0.placeholder'
        ],
      ).toBe('***');
    });

    it('prunes choices of isSecret: true input', () => {
      const doc = makeMinimalDoc({
        packages: [
          {
            registryType: 'npm',
            identifier: 'pkg',
            transport: { type: 'stdio' },
            environmentVariables: [
              {
                name: 'TOKEN',
                isSecret: true,
                choices: ['tok_live_aaa', 'tok_live_bbb'],
              },
            ],
          },
        ],
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      // Secret choices must NOT be projected
      const allValues = Object.values(result);
      expect(allValues).not.toContain('tok_live_aaa');
      expect(allValues).not.toContain('tok_live_bbb');

      // Non-secret siblings still project
      expect(
        result[
          'modelcontextprotocol.io/packages.0.environmentvariables.0.name'
        ],
      ).toBe('TOKEN');
      expect(
        result[
          'modelcontextprotocol.io/packages.0.environmentvariables.0.issecret'
        ],
      ).toBe('true');
    });

    it('prunes secret remote header default/value', () => {
      const doc = makeMinimalDoc({
        remotes: [
          {
            type: 'streamable-http',
            url: 'https://example.com/mcp',
            headers: [
              {
                name: 'Authorization',
                isSecret: true,
                default: 'Bearer secret-token',
                value: 'Bearer live-token',
              },
            ],
          },
        ],
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      const allValues = Object.values(result);
      expect(allValues).not.toContain('Bearer secret-token');
      expect(allValues).not.toContain('Bearer live-token');

      expect(result['modelcontextprotocol.io/remotes.0.headers.0.name']).toBe(
        'Authorization',
      );
      expect(
        result['modelcontextprotocol.io/remotes.0.headers.0.issecret'],
      ).toBe('true');
    });

    it('prunes secret remote variable default/value/choices', () => {
      const doc = makeMinimalDoc({
        remotes: [
          {
            type: 'streamable-http',
            url: 'https://example.com/mcp',
            variables: {
              apiKey: {
                isSecret: true,
                default: 'key-12345',
                choices: ['key-a', 'key-b'],
                placeholder: 'your-api-key',
              },
            },
          },
        ],
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      const allValues = Object.values(result);
      expect(allValues).not.toContain('key-12345');
      expect(allValues).not.toContain('key-a');
      expect(allValues).not.toContain('key-b');

      expect(
        result[
          'modelcontextprotocol.io/remotes.0.variables.apikey.placeholder'
        ],
      ).toBe('your-api-key');
      expect(
        result['modelcontextprotocol.io/remotes.0.variables.apikey.issecret'],
      ).toBe('true');
    });

    it('retains default/value/choices for non-secret input', () => {
      const doc = makeMinimalDoc({
        packages: [
          {
            registryType: 'npm',
            identifier: 'pkg',
            transport: { type: 'stdio' },
            environmentVariables: [
              {
                name: 'LOG_LEVEL',
                isSecret: false,
                default: 'info',
                choices: ['debug', 'info', 'warn', 'error'],
              },
            ],
          },
        ],
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      expect(
        result[
          'modelcontextprotocol.io/packages.0.environmentvariables.0.default'
        ],
      ).toBe('info');
      expect(
        result[
          'modelcontextprotocol.io/packages.0.environmentvariables.0.choices.0'
        ],
      ).toBe('debug');
      expect(
        result[
          'modelcontextprotocol.io/packages.0.environmentvariables.0.choices.1'
        ],
      ).toBe('info');
    });

    it('retains default/value when isSecret is omitted', () => {
      const doc = makeMinimalDoc({
        packages: [
          {
            registryType: 'npm',
            identifier: 'pkg',
            transport: { type: 'stdio' },
            environmentVariables: [
              {
                name: 'PORT',
                default: '3000',
              },
            ],
          },
        ],
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      expect(
        result[
          'modelcontextprotocol.io/packages.0.environmentvariables.0.default'
        ],
      ).toBe('3000');
    });
  });

  /* ---------------------------------------------------------------- */
  /*  D11 URL gating (task 4.7)                                        */
  /* ---------------------------------------------------------------- */

  describe('D11 URL gating', () => {
    it('omits javascript: icon src from projection', () => {
      const doc = makeMinimalDoc({
        icons: [{ src: 'javascript:alert(1)', mimeType: 'image/png' }],
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      // Refused URL not projected
      const allValues = Object.values(result);
      expect(allValues).not.toContain('javascript:alert(1)');

      // Non-URL sibling still projects
      expect(result['modelcontextprotocol.io/icons.0.mimetype']).toBe(
        'image/png',
      );
    });

    it('omits data: icon src from projection', () => {
      const doc = makeMinimalDoc({
        icons: [{ src: 'data:image/png;base64,abc123', mimeType: 'image/png' }],
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      const allValues = Object.values(result);
      expect(allValues).not.toContain('data:image/png;base64,abc123');
      expect(result['modelcontextprotocol.io/icons.0.mimetype']).toBe(
        'image/png',
      );
    });

    it('projects http/https icon src normally', () => {
      const doc = makeMinimalDoc({
        icons: [
          { src: 'https://cdn.example.com/icon.png', mimeType: 'image/png' },
        ],
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      expect(result['modelcontextprotocol.io/icons.0.src']).toBe(
        'https://cdn.example.com/icon.png',
      );
    });

    it('projects http://localhost URL normally', () => {
      const doc = makeMinimalDoc({
        icons: [
          { src: 'http://localhost:3000/icon.png', mimeType: 'image/png' },
        ],
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      expect(result['modelcontextprotocol.io/icons.0.src']).toBe(
        'http://localhost:3000/icon.png',
      );
    });

    it('does not refuse non-URL strings', () => {
      const doc = makeMinimalDoc({
        packages: [
          {
            registryType: 'npm',
            identifier: '@scope/pkg',
            transport: { type: 'stdio' },
          },
        ],
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      expect(result['modelcontextprotocol.io/packages.0.identifier']).toBe(
        '@scope/pkg',
      );
    });

    it('projects non-URL siblings when remote headers url-like values are refused', () => {
      const doc = makeMinimalDoc({
        remotes: [
          {
            type: 'streamable-http',
            url: 'https://example.com/mcp',
            headers: [
              {
                name: 'X-Custom',
                isSecret: false,
                default: 'javascript:void(0)',
              },
            ],
          },
        ],
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      // The javascript: value is refused
      const allValues = Object.values(result);
      expect(allValues).not.toContain('javascript:void(0)');

      // Non-URL sibling still projects
      expect(result['modelcontextprotocol.io/remotes.0.headers.0.name']).toBe(
        'X-Custom',
      );
    });
  });

  /* ---------------------------------------------------------------- */
  /*  D12 null/empty omission                                          */
  /* ---------------------------------------------------------------- */

  describe('D12 null/empty omission', () => {
    it('rejects null scalar values during structural validation', () => {
      const doc = makeMinimalDoc({
        repository: {
          url: 'https://github.com/org/repo',
          source: 'github',
          id: null as unknown as string,
        },
      });

      // null is not a valid string field — structural validation rejects it
      expect(() => assertServerJsonSchema(doc)).toThrow(/id to be a string/);
    });

    it('omits empty array (no annotations for subtree)', () => {
      const doc = makeMinimalDoc({
        icons: [],
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      const iconKeys = Object.keys(result).filter(k => k.includes('icons'));
      expect(iconKeys).toHaveLength(0);
    });

    it('omits empty object (no annotations for subtree)', () => {
      const doc = makeMinimalDoc({
        _meta: {},
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      const metaKeys = Object.keys(result).filter(k => k.includes('xmeta'));
      expect(metaKeys).toHaveLength(0);
    });

    it('projects false as "false"', () => {
      const doc = makeMinimalDoc({
        _meta: { verbose: false },
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      expect(result['modelcontextprotocol.io/xmeta.verbose']).toBe('false');
    });

    it('projects 0 as "0"', () => {
      const doc = makeMinimalDoc({
        _meta: { retries: 0 },
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      expect(result['modelcontextprotocol.io/xmeta.retries']).toBe('0');
    });

    it('projects empty string as ""', () => {
      const doc = makeMinimalDoc({
        _meta: { label: '' },
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      expect(result['modelcontextprotocol.io/xmeta.label']).toBe('');
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Determinism (D6)                                                 */
  /* ---------------------------------------------------------------- */

  describe('determinism', () => {
    it('produces byte-identical output for identical inputs', () => {
      const doc = makeMinimalDoc({
        icons: [
          { src: 'https://cdn.example.com/icon.png', mimeType: 'image/png' },
        ],
        packages: [
          {
            registryType: 'npm',
            identifier: '@scope/pkg',
            transport: { type: 'stdio' },
            version: '2.0.0',
          },
        ],
        _meta: { publisher: 'test' },
        repository: {
          url: 'https://github.com/org/repo',
          source: 'github',
          id: '123',
          subfolder: 'src',
        },
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);

      const result1 = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );
      const result2 = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
    });

    it('annotation keys are sorted lexicographically', () => {
      const doc = makeMinimalDoc({
        _meta: { z: '1', a: '2' },
        icons: [
          { src: 'https://cdn.example.com/icon.png', mimeType: 'image/png' },
        ],
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      const keys = Object.keys(result);
      const sortedKeys = [...keys].sort((a, b) => a.localeCompare(b));
      expect(keys).toEqual(sortedKeys);
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Round-trip fidelity (task 4.3)                                   */
  /* ---------------------------------------------------------------- */

  describe('round-trip fidelity', () => {
    it('all non-null, non-redacted, non-refused unmapped scalars are present', () => {
      const doc = makeMinimalDoc({
        icons: [
          {
            src: 'https://cdn.example.com/icon.png',
            mimeType: 'image/png',
            sizes: ['48x48', 'any'],
            theme: 'dark',
          },
        ],
        packages: [
          {
            registryType: 'npm',
            identifier: '@scope/pkg',
            transport: { type: 'stdio' },
            version: '1.0.0',
            runtimeHint: 'npx',
            environmentVariables: [
              { name: 'LOG', isSecret: false, default: 'info' },
            ],
          },
        ],
        repository: {
          url: 'https://github.com/org/repo',
          source: 'github',
          id: '12345',
          subfolder: 'src/server',
        },
        _meta: { publisher: 'test-publisher' },
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      // Verify specific scalars are recoverable
      expect(result['modelcontextprotocol.io/icons.0.src']).toBe(
        'https://cdn.example.com/icon.png',
      );
      expect(result['modelcontextprotocol.io/icons.0.mimetype']).toBe(
        'image/png',
      );
      expect(result['modelcontextprotocol.io/icons.0.sizes.0']).toBe('48x48');
      expect(result['modelcontextprotocol.io/icons.0.sizes.1']).toBe('any');
      expect(result['modelcontextprotocol.io/icons.0.theme']).toBe('dark');
      expect(result['modelcontextprotocol.io/packages.0.registrytype']).toBe(
        'npm',
      );
      expect(result['modelcontextprotocol.io/packages.0.identifier']).toBe(
        '@scope/pkg',
      );
      expect(result['modelcontextprotocol.io/packages.0.transport.type']).toBe(
        'stdio',
      );
      expect(result['modelcontextprotocol.io/packages.0.version']).toBe(
        '1.0.0',
      );
      expect(result['modelcontextprotocol.io/packages.0.runtimehint']).toBe(
        'npx',
      );
      expect(
        result[
          'modelcontextprotocol.io/packages.0.environmentvariables.0.name'
        ],
      ).toBe('LOG');
      expect(
        result[
          'modelcontextprotocol.io/packages.0.environmentvariables.0.default'
        ],
      ).toBe('info');
      expect(result['modelcontextprotocol.io/repository.source']).toBe(
        'github',
      );
      expect(result['modelcontextprotocol.io/repository.id']).toBe('12345');
      expect(result['modelcontextprotocol.io/repository.subfolder']).toBe(
        'src/server',
      );
      expect(result['modelcontextprotocol.io/xmeta.publisher']).toBe(
        'test-publisher',
      );
    });

    it('redacted secret leaves are exempt from round-trip', () => {
      const doc = makeMinimalDoc({
        packages: [
          {
            registryType: 'npm',
            identifier: 'pkg',
            transport: { type: 'stdio' },
            environmentVariables: [
              {
                name: 'SECRET',
                isSecret: true,
                default: 'my-secret-value',
                value: 'live-secret',
                choices: ['opt1', 'opt2'],
              },
            ],
          },
        ],
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      // Redacted values are intentionally absent
      const allValues = Object.values(result);
      expect(allValues).not.toContain('my-secret-value');
      expect(allValues).not.toContain('live-secret');
      expect(allValues).not.toContain('opt1');
      expect(allValues).not.toContain('opt2');
    });

    it('D11-refused URLs are exempt from round-trip', () => {
      const doc = makeMinimalDoc({
        icons: [
          { src: 'javascript:alert(1)', mimeType: 'image/png' },
          { src: 'data:image/png;base64,abc', mimeType: 'image/png' },
        ],
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      const allValues = Object.values(result);
      expect(allValues).not.toContain('javascript:alert(1)');
      expect(allValues).not.toContain('data:image/png;base64,abc');
    });

    it('null and empty containers are omitted from round-trip', () => {
      const doc = makeMinimalDoc({
        repository: {
          url: 'https://github.com/org/repo',
          source: 'github',
        },
        icons: [],
        _meta: {},
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      expect(result).not.toHaveProperty(
        'modelcontextprotocol.io/repository.id',
      );
      const iconKeys = Object.keys(result).filter(k => k.includes('icons'));
      expect(iconKeys).toHaveLength(0);
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Full integration: wired sections (task 3.5)                      */
  /* ---------------------------------------------------------------- */

  describe('wired sections', () => {
    it('projects remote headers and variables', () => {
      const doc = makeMinimalDoc({
        remotes: [
          {
            type: 'streamable-http',
            url: 'https://example.com/mcp',
            headers: [{ name: 'X-Api-Key', isSecret: false, default: 'test' }],
            variables: {
              region: {
                isSecret: false,
                default: 'us-east-1',
              },
            },
          },
        ],
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      expect(result['modelcontextprotocol.io/remotes.0.headers.0.name']).toBe(
        'X-Api-Key',
      );
      expect(
        result['modelcontextprotocol.io/remotes.0.headers.0.default'],
      ).toBe('test');
      expect(
        result['modelcontextprotocol.io/remotes.0.variables.region.issecret'],
      ).toBe('false');
      expect(
        result['modelcontextprotocol.io/remotes.0.variables.region.default'],
      ).toBe('us-east-1');
    });

    it('projects packages with nested structures', () => {
      const doc = makeMinimalDoc({
        packages: [
          {
            registryType: 'npm',
            identifier: '@mcp/weather',
            transport: { type: 'stdio' },
            version: '1.0.0',
            runtimeHint: 'npx',
            fileSha256: 'abc123',
            registryBaseUrl: 'https://registry.npmjs.org',
            packageArguments: [
              {
                type: 'named',
                name: '--port',
                isSecret: false,
                default: '3000',
              },
            ],
            runtimeArguments: [
              {
                type: 'named',
                name: '--verbose',
                isSecret: false,
                default: 'true',
              },
            ],
          },
        ],
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      expect(result['modelcontextprotocol.io/packages.0.registrytype']).toBe(
        'npm',
      );
      expect(result['modelcontextprotocol.io/packages.0.identifier']).toBe(
        '@mcp/weather',
      );
      expect(result['modelcontextprotocol.io/packages.0.version']).toBe(
        '1.0.0',
      );
      expect(result['modelcontextprotocol.io/packages.0.runtimehint']).toBe(
        'npx',
      );
      expect(result['modelcontextprotocol.io/packages.0.filesha256']).toBe(
        'abc123',
      );
      expect(result['modelcontextprotocol.io/packages.0.registrybaseurl']).toBe(
        'https://registry.npmjs.org',
      );
      expect(
        result['modelcontextprotocol.io/packages.0.packagearguments.0.name'],
      ).toBe('--port');
      expect(
        result['modelcontextprotocol.io/packages.0.runtimearguments.0.name'],
      ).toBe('--verbose');
    });

    it('projects _meta with reverse-DNS keys (truncated with hash)', () => {
      const doc = makeMinimalDoc({
        _meta: {
          'io.modelcontextprotocol.registry/publisher-provided': {
            verified: true,
            score: 42,
          },
        },
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      // The full name segment "xmeta.io.modelcontextprotocol.registry-
      // publisher-provided.verified" is 66 chars, exceeding 63-char
      // limit, so it is truncated with a hash suffix.
      const keys = Object.keys(result);
      const verifiedKey = keys.find(
        k =>
          k.startsWith(
            'modelcontextprotocol.io/xmeta.io.modelcontextprotocol',
          ) && result[k] === 'true',
      );
      const scoreKey = keys.find(
        k =>
          k.startsWith(
            'modelcontextprotocol.io/xmeta.io.modelcontextprotocol',
          ) && result[k] === '42',
      );
      expect(verifiedKey).toBeDefined();
      expect(scoreKey).toBeDefined();

      // Both keys must be ≤ 63 chars in the name segment
      for (const key of [verifiedKey!, scoreKey!]) {
        const nameSegment = key.replace('modelcontextprotocol.io/', '');
        expect(nameSegment.length).toBeLessThanOrEqual(63);
      }

      // Both values are recoverable
      const values = Object.values(result);
      expect(values).toContain('true');
      expect(values).toContain('42');
    });

    it('projects repository non-URL sub-fields', () => {
      const doc = makeMinimalDoc({
        repository: {
          url: 'https://github.com/org/repo',
          source: 'github',
          id: '12345',
          subfolder: 'packages/weather',
        },
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      expect(result['modelcontextprotocol.io/repository.source']).toBe(
        'github',
      );
      expect(result['modelcontextprotocol.io/repository.id']).toBe('12345');
      expect(result['modelcontextprotocol.io/repository.subfolder']).toBe(
        'packages/weather',
      );
    });

    it('projects icons array', () => {
      const doc = makeMinimalDoc({
        icons: [
          {
            src: 'https://cdn.example.com/light.png',
            mimeType: 'image/png',
            sizes: ['48x48'],
            theme: 'light',
          },
          {
            src: 'https://cdn.example.com/dark.png',
            mimeType: 'image/svg+xml',
            theme: 'dark',
          },
        ],
      });
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      expect(result['modelcontextprotocol.io/icons.0.src']).toBe(
        'https://cdn.example.com/light.png',
      );
      expect(result['modelcontextprotocol.io/icons.0.mimetype']).toBe(
        'image/png',
      );
      expect(result['modelcontextprotocol.io/icons.0.sizes.0']).toBe('48x48');
      expect(result['modelcontextprotocol.io/icons.0.theme']).toBe('light');
      expect(result['modelcontextprotocol.io/icons.1.src']).toBe(
        'https://cdn.example.com/dark.png',
      );
      expect(result['modelcontextprotocol.io/icons.1.mimetype']).toBe(
        'image/svg+xml',
      );
      expect(result['modelcontextprotocol.io/icons.1.theme']).toBe('dark');
    });

    it('returns empty record when all scalars are consumed', () => {
      const doc = makeMinimalDoc();
      const { consumedPaths, reservedAnnotationKeys } =
        makeMinimalConsumed(doc);
      const result = projectAnnotations(
        doc,
        consumedPaths,
        reservedAnnotationKeys,
      );

      // All top-level scalars are consumed, remotes type/url consumed
      // Only non-consumed fields would project — minimal doc has none
      expect(Object.keys(result)).toHaveLength(0);
    });
  });
});
