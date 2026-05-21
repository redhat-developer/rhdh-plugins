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

import { isValidDns1123 } from './agentWizardTypes';

describe('isValidDns1123', () => {
  it.each(['my-agent', 'a', 'a1b2', '0starts-with-digit', 'a'.repeat(63)])(
    'accepts valid name %j',
    name => {
      expect(isValidDns1123(name)).toBe(true);
    },
  );

  it.each([
    ['empty string', ''],
    ['uppercase', 'My-Agent'],
    ['leading hyphen', '-start'],
    ['trailing hyphen', 'end-'],
    ['too long (64 chars)', 'a'.repeat(64)],
    ['contains dot', 'has.dot'],
    ['contains underscore', 'has_underscore'],
    ['contains space', 'has space'],
    ['only hyphens', '---'],
    ['single hyphen', '-'],
  ])('rejects invalid name: %s (%j)', (_label, name) => {
    expect(isValidDns1123(name)).toBe(false);
  });
});
