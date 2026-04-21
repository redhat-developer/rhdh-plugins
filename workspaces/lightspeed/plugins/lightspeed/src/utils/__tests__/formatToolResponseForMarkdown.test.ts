/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { formatToolResponseForMarkdown } from '../formatToolResponseForMarkdown';

describe('formatToolResponseForMarkdown', () => {
  it('returns plain short non-JSON text unchanged', () => {
    expect(formatToolResponseForMarkdown('Found 5 users')).toBe(
      'Found 5 users',
    );
  });

  it('pretty-prints JSON object and wraps in json fence', () => {
    const input = '{"a":1,"b":{"c":2}}';
    const out = formatToolResponseForMarkdown(input);
    expect(out.startsWith('```json\n')).toBe(true);
    expect(out.endsWith('\n```')).toBe(true);
    expect(out).toContain('"a": 1');
    expect(out).toContain('"c": 2');
  });

  it('unwraps stringified JSON (MCP content) and pretty-prints', () => {
    const inner = { server_label: 'mcp::backstage', tools: [{ name: 'x' }] };
    const input = JSON.stringify(JSON.stringify(inner));
    const out = formatToolResponseForMarkdown(input);
    expect(out).toContain('```json');
    expect(out).toContain('mcp::backstage');
    expect(out).toContain('"name": "x"');
  });

  it('leaves content that is already fenced alone', () => {
    const fenced = '```json\n{}\n```';
    expect(formatToolResponseForMarkdown(fenced)).toBe(fenced);
  });

  it('fences long non-JSON text', () => {
    const long = 'x'.repeat(200);
    const out = formatToolResponseForMarkdown(long);
    expect(out).toContain('```');
    expect(out).toContain(long);
  });
});
