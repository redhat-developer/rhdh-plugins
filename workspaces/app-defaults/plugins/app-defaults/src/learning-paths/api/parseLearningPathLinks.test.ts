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

import { parseLearningPathLinks } from './parseLearningPathLinks';

describe('parseLearningPathLinks', () => {
  it('parses valid learning path entries', () => {
    expect(
      parseLearningPathLinks([
        {
          label: 'Example path',
          url: 'https://example.com/path',
          paths: 2,
          minutes: 15,
          description: 'Example description',
        },
      ]),
    ).toEqual([
      {
        label: 'Example path',
        url: 'https://example.com/path',
        paths: 2,
        minutes: 15,
        description: 'Example description',
      },
    ]);
  });

  it('throws when the payload is not an array', () => {
    expect(() => parseLearningPathLinks({})).toThrow(
      'expected learning paths response to be an array',
    );
  });

  it('throws when paths is missing', () => {
    expect(() =>
      parseLearningPathLinks([
        {
          label: 'Example path',
          url: 'https://example.com/path',
        },
      ]),
    ).toThrow('learning path at index 0 is missing a valid paths count');
  });
});
