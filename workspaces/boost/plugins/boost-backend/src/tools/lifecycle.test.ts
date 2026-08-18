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

import { isValidToolTransition } from './lifecycle';

describe('isValidToolTransition', () => {
  it('allows draft → pending (promote)', () => {
    expect(isValidToolTransition('draft', 'pending')).toBe(true);
  });

  it('allows pending → published (publish)', () => {
    expect(isValidToolTransition('pending', 'published')).toBe(true);
  });

  it('allows pending → draft (demote/withdraw)', () => {
    expect(isValidToolTransition('pending', 'draft')).toBe(true);
  });

  it('allows published → archived (unpublish)', () => {
    expect(isValidToolTransition('published', 'archived')).toBe(true);
  });

  it('allows published → pending (demote)', () => {
    expect(isValidToolTransition('published', 'pending')).toBe(true);
  });

  it('rejects draft → published', () => {
    expect(isValidToolTransition('draft', 'published')).toBe(false);
  });

  it('rejects draft → archived', () => {
    expect(isValidToolTransition('draft', 'archived')).toBe(false);
  });

  it('rejects archived → any', () => {
    expect(isValidToolTransition('archived', 'draft')).toBe(false);
    expect(isValidToolTransition('archived', 'pending')).toBe(false);
    expect(isValidToolTransition('archived', 'published')).toBe(false);
  });
});
