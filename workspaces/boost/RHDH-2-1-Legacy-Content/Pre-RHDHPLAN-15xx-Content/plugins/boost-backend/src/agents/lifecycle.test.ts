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

import { isValidTransition, isDeletableStage } from './lifecycle';

describe('isValidTransition', () => {
  it('allows draft → pending (promote)', () => {
    expect(isValidTransition('draft', 'pending')).toBe(true);
  });

  it('allows pending → published (approve)', () => {
    expect(isValidTransition('pending', 'published')).toBe(true);
  });

  it('allows pending → draft (withdraw)', () => {
    expect(isValidTransition('pending', 'draft')).toBe(true);
  });

  it('allows published → archived (request-unpublish)', () => {
    expect(isValidTransition('published', 'archived')).toBe(true);
  });

  it('disallows draft → published (skip pending)', () => {
    expect(isValidTransition('draft', 'published')).toBe(false);
  });

  it('disallows draft → archived', () => {
    expect(isValidTransition('draft', 'archived')).toBe(false);
  });

  it('disallows published → draft', () => {
    expect(isValidTransition('published', 'draft')).toBe(false);
  });

  it('disallows published → pending', () => {
    expect(isValidTransition('published', 'pending')).toBe(false);
  });

  it('disallows archived → any stage', () => {
    expect(isValidTransition('archived', 'draft')).toBe(false);
    expect(isValidTransition('archived', 'pending')).toBe(false);
    expect(isValidTransition('archived', 'published')).toBe(false);
  });
});

describe('isDeletableStage', () => {
  it('allows deletion in draft stage', () => {
    expect(isDeletableStage('draft')).toBe(true);
  });

  it('allows deletion in archived stage', () => {
    expect(isDeletableStage('archived')).toBe(true);
  });

  it('disallows deletion in pending stage', () => {
    expect(isDeletableStage('pending')).toBe(false);
  });

  it('disallows deletion in published stage', () => {
    expect(isDeletableStage('published')).toBe(false);
  });
});
