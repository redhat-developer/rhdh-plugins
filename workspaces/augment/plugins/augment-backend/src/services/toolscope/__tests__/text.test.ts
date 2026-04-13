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
  renderToolText,
  DEFAULT_TOOL_TEXT_CONFIG,
  lowercase,
  collapseWhitespace,
  normalizeUnicode,
  stripControlChars,
} from '../text';
import type { CanonicalTool } from '../types';

function makeTool(overrides?: Partial<CanonicalTool>): CanonicalTool {
  return {
    name: 'create_issue',
    description: 'Create a new issue',
    inputSchema: { type: 'object', properties: { title: { type: 'string' } } },
    fingerprint: { value: 'abc' },
    tags: ['jira', 'project'],
    ...overrides,
  };
}

describe('renderToolText', () => {
  it('renders name + description by default', () => {
    const text = renderToolText(makeTool());
    expect(text).toBe('create_issue\nCreate a new issue');
  });

  it('includes schema when configured', () => {
    const text = renderToolText(makeTool(), {
      ...DEFAULT_TOOL_TEXT_CONFIG,
      fields: ['name', 'description', 'schema'],
    });
    expect(text).toContain('create_issue');
    expect(text).toContain('"type":"object"');
  });

  it('includes tags when configured', () => {
    const text = renderToolText(makeTool(), {
      ...DEFAULT_TOOL_TEXT_CONFIG,
      fields: ['name', 'tags'],
    });
    expect(text).toBe('create_issue\njira project');
  });

  it('truncates text to configured length', () => {
    const text = renderToolText(makeTool(), {
      ...DEFAULT_TOOL_TEXT_CONFIG,
      truncate: 10,
    });
    expect(text.length).toBe(10);
  });

  it('does not truncate when truncate is null', () => {
    const longDesc = 'a'.repeat(500);
    const text = renderToolText(makeTool({ description: longDesc }), {
      ...DEFAULT_TOOL_TEXT_CONFIG,
      truncate: null,
    });
    expect(text.length).toBeGreaterThan(256);
  });

  it('applies preprocessors in order', () => {
    const text = renderToolText(makeTool(), {
      ...DEFAULT_TOOL_TEXT_CONFIG,
      preprocessors: [lowercase()],
    });
    expect(text).toBe('create_issue\ncreate a new issue');
  });

  it('skips empty parts', () => {
    const text = renderToolText(makeTool({ description: '' }), {
      ...DEFAULT_TOOL_TEXT_CONFIG,
      fields: ['name', 'description'],
    });
    expect(text).toBe('create_issue');
  });

  it('throws on unsupported field', () => {
    expect(() =>
      renderToolText(makeTool(), {
        ...DEFAULT_TOOL_TEXT_CONFIG,
        fields: ['unknown' as any],
      }),
    ).toThrow('Unsupported field');
  });
});

describe('preprocessors', () => {
  it('lowercase converts to lowercase', () => {
    expect(lowercase()('Hello World')).toBe('hello world');
  });

  it('collapseWhitespace normalizes whitespace', () => {
    expect(collapseWhitespace()('  hello   world  ')).toBe('hello world');
  });

  it('normalizeUnicode normalizes unicode', () => {
    const fn = normalizeUnicode('NFKC');
    expect(fn('\u00e9')).toBe('\u00e9');
  });

  it('stripControlChars removes control characters but keeps newlines', () => {
    const fn = stripControlChars();
    expect(fn('hello\x00world\ntest\ttab')).toBe('helloworld\ntest\ttab');
  });
});
