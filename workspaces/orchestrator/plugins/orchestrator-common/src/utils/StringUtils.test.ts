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

import { capitalize, ellipsis } from './StringUtils';

describe('capitalize', () => {
  it('capitalizes mixed-case text', () => {
    expect(capitalize('wOrKfLoW')).toBe('Workflow');
  });

  it('keeps an already capitalized word unchanged', () => {
    expect(capitalize('Workflow')).toBe('Workflow');
  });

  it('capitalizes a single character', () => {
    expect(capitalize('a')).toBe('A');
  });

  it('throws for empty input', () => {
    expect(() => capitalize('')).toThrow();
  });
});

describe('ellipsis', () => {
  it('uses default prefix length', () => {
    expect(ellipsis('1234567890')).toBe('12345678...');
  });

  it('uses custom prefix length', () => {
    expect(ellipsis('1234567890', 4)).toBe('1234...');
  });

  it('returns full short text plus ellipsis', () => {
    expect(ellipsis('abc', 8)).toBe('abc...');
  });
});
