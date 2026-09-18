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

import { assertServerJsonSchema, requireBooleanProperty } from './util';
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

describe('assertServerJsonSchema', () => {
  it('accepts an absolute URL whose basename is server.schema.json', () => {
    expect(() => assertServerJsonSchema(makeMinimalDoc())).not.toThrow();
    expect(() =>
      assertServerJsonSchema(
        makeMinimalDoc({
          $schema:
            'https://raw.githubusercontent.com/modelcontextprotocol/registry/refs/heads/main/docs/reference/server-json/draft/server.schema.json',
        }),
      ),
    ).not.toThrow();
  });

  it('rejects missing or non-string $schema', () => {
    expect(() =>
      assertServerJsonSchema(makeMinimalDoc({ $schema: undefined })),
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
