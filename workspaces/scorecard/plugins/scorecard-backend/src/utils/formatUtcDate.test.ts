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

import { formatUtcDate } from './formatUtcDate';

describe('formatUtcDate', () => {
  it('should return YYYY-MM-DD for a Date', () => {
    expect(formatUtcDate(new Date('2024-06-15T23:30:00.000Z'))).toBe(
      '2024-06-15',
    );
  });

  it('should use UTC calendar day', () => {
    expect(formatUtcDate(new Date('2024-06-15T01:00:00.000Z'))).toBe(
      '2024-06-15',
    );
  });
});
