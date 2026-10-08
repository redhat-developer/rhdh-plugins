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

import { mergeMaxTimestamp } from './mergeMaxTimestamp';

describe('mergeMaxTimestamp', () => {
  it('should return the later timestamp', () => {
    const earlier = new Date('2023-01-01T00:00:00Z');
    const later = new Date('2023-01-02T00:00:00Z');

    expect(mergeMaxTimestamp(earlier, later)).toBe(later);
    expect(mergeMaxTimestamp(later, earlier)).toBe(later);
  });

  it('should return the first timestamp when both are equal', () => {
    const timestamp = new Date('2023-01-01T00:00:00Z');
    const same = new Date('2023-01-01T00:00:00Z');

    expect(mergeMaxTimestamp(timestamp, same)).toBe(timestamp);
  });
});
