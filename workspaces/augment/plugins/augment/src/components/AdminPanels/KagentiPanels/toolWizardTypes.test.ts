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

import { isValidDns1123, TOOL_STEPS } from './toolWizardTypes';

describe('TOOL_STEPS', () => {
  it('has three steps', () => {
    expect(TOOL_STEPS).toEqual(['Basics', 'Deployment', 'Runtime']);
  });
});

describe('isValidDns1123', () => {
  it.each([
    ['my-tool', true],
    ['a', true],
    ['tool-123', true],
    ['a-b-c', true],
    ['a'.repeat(63), true],
  ])('accepts %s', (input, expected) => {
    expect(isValidDns1123(input)).toBe(expected);
  });

  it.each([
    ['UPPERCASE', false],
    ['-leading', false],
    ['trailing-', false],
    ['has_underscore', false],
    ['has.dot', false],
    ['a'.repeat(64), false],
    ['', false],
  ])('rejects %s', (input, expected) => {
    expect(isValidDns1123(input)).toBe(expected);
  });
});
