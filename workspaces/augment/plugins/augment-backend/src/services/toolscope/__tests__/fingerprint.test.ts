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

import { stableJson, fingerprintTool } from '../fingerprint';

describe('stableJson', () => {
  it('sorts keys alphabetically', () => {
    expect(stableJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it('sorts nested keys recursively', () => {
    expect(stableJson({ z: { b: 1, a: 2 }, a: 0 })).toBe(
      '{"a":0,"z":{"a":2,"b":1}}',
    );
  });

  it('handles arrays without reordering', () => {
    expect(stableJson({ a: [3, 1, 2] })).toBe('{"a":[3,1,2]}');
  });

  it('handles null values', () => {
    expect(stableJson({ a: null })).toBe('{"a":null}');
  });

  it('handles empty object', () => {
    expect(stableJson({})).toBe('{}');
  });
});

describe('fingerprintTool', () => {
  it('produces deterministic hex hash', () => {
    const fp1 = fingerprintTool('test', 'desc', {});
    const fp2 = fingerprintTool('test', 'desc', {});
    expect(fp1.value).toBe(fp2.value);
    expect(fp1.value).toMatch(/^[a-f0-9]{64}$/);
  });

  it('changes when name changes', () => {
    const fp1 = fingerprintTool('tool_a', 'desc', {});
    const fp2 = fingerprintTool('tool_b', 'desc', {});
    expect(fp1.value).not.toBe(fp2.value);
  });

  it('changes when description changes', () => {
    const fp1 = fingerprintTool('tool', 'desc_a', {});
    const fp2 = fingerprintTool('tool', 'desc_b', {});
    expect(fp1.value).not.toBe(fp2.value);
  });

  it('changes when inputSchema changes', () => {
    const fp1 = fingerprintTool('tool', 'desc', { type: 'object' });
    const fp2 = fingerprintTool('tool', 'desc', { type: 'string' });
    expect(fp1.value).not.toBe(fp2.value);
  });

  it('includes extra in fingerprint', () => {
    const fp1 = fingerprintTool('tool', 'desc', {}, { version: '1' } as any);
    const fp2 = fingerprintTool('tool', 'desc', {}, { version: '2' } as any);
    expect(fp1.value).not.toBe(fp2.value);
  });

  it('defaults extra to empty object', () => {
    const fp1 = fingerprintTool('tool', 'desc', {});
    const fp2 = fingerprintTool('tool', 'desc', {}, {});
    expect(fp1.value).toBe(fp2.value);
  });

  it('is insensitive to key insertion order in schema', () => {
    const fp1 = fingerprintTool('tool', 'desc', { a: 1, b: 2 });
    const fp2 = fingerprintTool('tool', 'desc', { b: 2, a: 1 });
    expect(fp1.value).toBe(fp2.value);
  });
});
