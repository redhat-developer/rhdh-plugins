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
  assertOptionalObjectArray,
  assertOptionalServerDetailSections,
  assertRequiredRootFields,
  assertServerJsonSchema,
  requireBooleanProperty,
} from './util';
import type { McpServerDocument } from './types';

/** Draft server.json schema URI used by fixtures. */
const SERVER_SCHEMA_URI =
  'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json';

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

function makeMinimalRootFields(
  overrides?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    $schema: SERVER_SCHEMA_URI,
    name: 'weather',
    description: 'A weather server',
    version: '1.0.0',
    ...overrides,
  };
}

describe('assertServerJsonSchema', () => {
  it('accepts a structurally valid server.json document', () => {
    expect(() => assertServerJsonSchema(makeMinimalDoc())).not.toThrow();
    expect(() =>
      assertServerJsonSchema(
        makeMinimalDoc({
          $schema:
            'https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json',
        }),
      ),
    ).not.toThrow();
  });

  it('rejects non-object documents', () => {
    expect(() => assertServerJsonSchema(null)).toThrow(/plain object/);
    expect(() => assertServerJsonSchema([])).toThrow(/plain object/);
    expect(() => assertServerJsonSchema('x')).toThrow(/plain object/);
  });

  it('rejects missing or non-string $schema', () => {
    expect(() =>
      assertServerJsonSchema(
        makeMinimalDoc({ $schema: undefined as unknown as string }),
      ),
    ).toThrow(TypeError);
    expect(() =>
      assertServerJsonSchema(
        makeMinimalDoc({
          $schema: 1 as unknown as string,
        }),
      ),
    ).toThrow(/\$schema to be a string/);
  });

  it('rejects non-URL and wrong-basename $schema values', () => {
    expect(() =>
      assertServerJsonSchema(makeMinimalDoc({ $schema: 'not-a-url' })),
    ).toThrow(/absolute URL/);
    expect(() =>
      assertServerJsonSchema(
        makeMinimalDoc({
          $schema: 'https://example.com/schemas/other.schema.json',
        }),
      ),
    ).toThrow(/basename to be "server\.schema\.json"/);
  });

  it('rejects unknown top-level fields', () => {
    expect(() =>
      assertServerJsonSchema({
        ...makeMinimalDoc(),
        extraField: 'nope',
      }),
    ).toThrow(/unknown field "extraField"/);
  });

  it('rejects mistyped required fields', () => {
    expect(() =>
      assertServerJsonSchema({
        ...makeMinimalDoc(),
        name: 1 as unknown as string,
      }),
    ).toThrow(/name to be a string/);
  });

  it('rejects mistyped nested fields', () => {
    expect(() =>
      assertServerJsonSchema(
        makeMinimalDoc({
          remotes: [
            {
              type: 'streamable-http',
              url: 'https://example.com/mcp',
              headers: [{ name: 'X', isSecret: 'yes' as unknown as boolean }],
            },
          ],
        }),
      ),
    ).toThrow(/isSecret to be a boolean/);
  });
});

describe('assertRequiredRootFields', () => {
  it('accepts a document with required root fields', () => {
    expect(() =>
      assertRequiredRootFields(makeMinimalRootFields()),
    ).not.toThrow();
  });

  it('accepts optional title and websiteUrl strings', () => {
    expect(() =>
      assertRequiredRootFields(
        makeMinimalRootFields({
          title: 'Weather',
          websiteUrl: 'https://example.com',
        }),
      ),
    ).not.toThrow();
  });

  it('treats explicit undefined optional strings as absent', () => {
    expect(() =>
      assertRequiredRootFields(
        makeMinimalRootFields({
          title: undefined,
          websiteUrl: undefined,
        }),
      ),
    ).not.toThrow();
  });

  it('rejects missing $schema', () => {
    const doc = makeMinimalRootFields();
    delete doc.$schema;
    expect(() => assertRequiredRootFields(doc)).toThrow(/\$schema/);
  });

  it('rejects missing name, description, or version', () => {
    for (const field of ['name', 'description', 'version'] as const) {
      const doc = makeMinimalRootFields();
      delete doc[field];
      expect(() => assertRequiredRootFields(doc)).toThrow(
        new RegExp(`${field} at "<root>"`),
      );
    }
  });

  it('rejects mistyped optional string fields', () => {
    expect(() =>
      assertRequiredRootFields(makeMinimalRootFields({ title: 1 })),
    ).toThrow(/title to be a string/);
    expect(() =>
      assertRequiredRootFields(makeMinimalRootFields({ websiteUrl: false })),
    ).toThrow(/websiteUrl to be a string/);
  });
});

describe('assertOptionalObjectArray', () => {
  const assertStringItem = (item: unknown, objectDotPath: string): void => {
    if (typeof item !== 'string') {
      throw new TypeError(`expected string at ${objectDotPath}`);
    }
  };

  it('accepts undefined and null as absent', () => {
    expect(() =>
      assertOptionalObjectArray(undefined, 'remotes', assertStringItem),
    ).not.toThrow();
    expect(() =>
      assertOptionalObjectArray(null, 'remotes', assertStringItem),
    ).not.toThrow();
  });

  it('accepts an empty array', () => {
    expect(() =>
      assertOptionalObjectArray([], 'icons', assertStringItem),
    ).not.toThrow();
  });

  it('validates each array item with the provided assertItem', () => {
    expect(() =>
      assertOptionalObjectArray(['a', 'b'], 'icons', assertStringItem),
    ).not.toThrow();
    expect(() =>
      assertOptionalObjectArray(['a', 1], 'icons', assertStringItem),
    ).toThrow(/expected string at icons\.1/);
  });

  it('rejects non-array values', () => {
    expect(() =>
      assertOptionalObjectArray({}, 'packages', assertStringItem),
    ).toThrow(/packages to be an array/);
    expect(() =>
      assertOptionalObjectArray('x', 'packages', assertStringItem),
    ).toThrow(/packages to be an array/);
  });
});

describe('assertOptionalServerDetailSections', () => {
  it('accepts a document with no optional sections', () => {
    expect(() => assertOptionalServerDetailSections({})).not.toThrow();
  });

  it('accepts valid repository, remotes, icons, packages, and _meta', () => {
    expect(() =>
      assertOptionalServerDetailSections({
        repository: {
          url: 'https://github.com/org/repo',
          source: 'github',
        },
        remotes: [{ type: 'sse', url: 'https://example.com/sse' }],
        icons: [{ src: 'https://example.com/icon.png', mimeType: 'image/png' }],
        packages: [
          {
            registryType: 'npm',
            identifier: '@scope/pkg',
            transport: { type: 'stdio' },
          },
        ],
        _meta: { publisher: 'test' },
      }),
    ).not.toThrow();
  });

  it('treats undefined and null optional sections as absent', () => {
    expect(() =>
      assertOptionalServerDetailSections({
        repository: undefined,
        remotes: null,
        icons: undefined,
        packages: null,
        _meta: undefined,
      }),
    ).not.toThrow();
  });

  it('rejects invalid repository shapes', () => {
    expect(() =>
      assertOptionalServerDetailSections({
        repository: { url: 'https://github.com/org/repo' },
      }),
    ).toThrow(/repository\.url and repository\.source/);
  });

  it('rejects non-array remotes, icons, and packages', () => {
    expect(() => assertOptionalServerDetailSections({ remotes: {} })).toThrow(
      /remotes to be an array/,
    );
    expect(() => assertOptionalServerDetailSections({ icons: 'x' })).toThrow(
      /icons to be an array/,
    );
    expect(() => assertOptionalServerDetailSections({ packages: 1 })).toThrow(
      /packages to be an array/,
    );
  });

  it('rejects mistyped remotes, icons, and packages entries', () => {
    expect(() =>
      assertOptionalServerDetailSections({
        remotes: [{ type: 'stdio', url: 'https://example.com/mcp' }],
      }),
    ).toThrow(/remotes\[\]\.type/);
    expect(() =>
      assertOptionalServerDetailSections({
        icons: [{ src: 'https://example.com/icon.png', theme: 'blue' }],
      }),
    ).toThrow(/theme to be "light" or "dark"/);
    expect(() =>
      assertOptionalServerDetailSections({
        packages: [{ registryType: 'npm', identifier: 'pkg' }],
      }),
    ).toThrow(/requires transport/);
  });

  it('rejects non-object _meta', () => {
    expect(() => assertOptionalServerDetailSections({ _meta: 'x' })).toThrow(
      /_meta to be an object/,
    );
    expect(() => assertOptionalServerDetailSections({ _meta: [] })).toThrow(
      /_meta to be an object/,
    );
  });
});

describe('requireBooleanProperty', () => {
  it('returns the property when it is a boolean', () => {
    expect(requireBooleanProperty({ flag: true }, 'flag', 'input')).toBe(true);
    expect(requireBooleanProperty({ flag: false }, 'flag', 'input')).toBe(
      false,
    );
  });

  it('throws when the property is missing', () => {
    expect(() =>
      requireBooleanProperty({ name: 'x' }, 'flag', 'input'),
    ).toThrow('Missing required boolean property "flag" at "input"');
  });

  it('throws when the property is present but not a boolean', () => {
    expect(() =>
      requireBooleanProperty({ isSecret: 'true' }, 'isSecret', 'input'),
    ).toThrow(TypeError);
    expect(() =>
      requireBooleanProperty({ isSecret: 'true' }, 'isSecret', 'input'),
    ).toThrow('isSecret must be a boolean at "input" (received string)');
    expect(() =>
      requireBooleanProperty({ isSecret: 1 }, 'isSecret', ''),
    ).toThrow('isSecret must be a boolean at "<root>" (received number)');
  });
});
