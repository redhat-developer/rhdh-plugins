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
  mapLifecycleStage,
  sanitizeEntityName,
  mapOwner,
} from './entityHelpers';

describe('mapLifecycleStage', () => {
  it('maps draft to experimental', () => {
    expect(mapLifecycleStage('draft')).toBe('experimental');
  });

  it('maps pending to experimental', () => {
    expect(mapLifecycleStage('pending')).toBe('experimental');
  });

  it('maps published to production', () => {
    expect(mapLifecycleStage('published')).toBe('production');
  });

  it('maps archived to deprecated', () => {
    expect(mapLifecycleStage('archived')).toBe('deprecated');
  });

  it('returns experimental for undefined input', () => {
    expect(mapLifecycleStage(undefined)).toBe('experimental');
  });
});

describe('sanitizeEntityName', () => {
  it('converts uppercase to lowercase', () => {
    expect(sanitizeEntityName('MyAgent')).toBe('myagent');
  });

  it('replaces special characters with hyphens', () => {
    expect(sanitizeEntityName('hello world')).toBe('hello-world');
    expect(sanitizeEntityName('my agent!')).toBe('my-agent');
  });

  it('collapses consecutive hyphens', () => {
    expect(sanitizeEntityName('a---b')).toBe('a-b');
  });

  it('strips leading hyphens', () => {
    expect(sanitizeEntityName('---leading')).toBe('leading');
  });

  it('strips trailing hyphens', () => {
    expect(sanitizeEntityName('trailing---')).toBe('trailing');
  });

  it('truncates at 63 characters', () => {
    const longName = 'a'.repeat(100);
    expect(sanitizeEntityName(longName)).toHaveLength(63);
  });

  it('strips trailing hyphens after truncation', () => {
    // 62 valid chars + a hyphen at position 63 + more chars after.
    // After substring(0, 63) the string ends with a hyphen that
    // must be cleaned up by the final replace.
    const name = `${'a'.repeat(62)}-${'b'.repeat(10)}`;
    const result = sanitizeEntityName(name);
    expect(result).not.toMatch(/-$/);
    expect(result).toBe('a'.repeat(62));
  });

  it('returns unnamed-entity for empty string', () => {
    expect(sanitizeEntityName('')).toBe('unnamed-entity');
  });

  it('returns unnamed-entity for all-invalid characters', () => {
    expect(sanitizeEntityName('!!!')).toBe('unnamed-entity');
  });
});

describe('mapOwner', () => {
  it('returns unknown for undefined input', () => {
    expect(mapOwner(undefined)).toBe('unknown');
  });

  it('wraps bare username as user:default/<name>', () => {
    expect(mapOwner('admin')).toBe('user:default/admin');
  });

  it('passes through input containing a colon', () => {
    expect(mapOwner('user:default/jdoe')).toBe('user:default/jdoe');
  });

  it('passes through input containing a slash', () => {
    expect(mapOwner('custom/team-a')).toBe('custom/team-a');
  });
});
