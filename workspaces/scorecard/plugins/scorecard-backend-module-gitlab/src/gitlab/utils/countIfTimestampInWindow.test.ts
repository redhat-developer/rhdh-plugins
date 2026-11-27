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

import { countIfTimestampInWindow } from './countIfTimestampInWindow';

describe('countIfTimestampInWindow', () => {
  const since = new Date('2024-01-10T00:00:00Z');

  it('should not increment when value is not a string', () => {
    const result = { count: 0 };

    countIfTimestampInWindow(null, since, result);
    countIfTimestampInWindow(undefined, since, result);
    countIfTimestampInWindow(123, since, result);
    countIfTimestampInWindow({}, since, result);

    expect(result.count).toBe(0);
  });

  it('should not increment when timestamp is before since', () => {
    const result = { count: 0 };

    countIfTimestampInWindow('2024-01-09T23:59:59Z', since, result);

    expect(result.count).toBe(0);
  });

  it('should increment when timestamp equals since', () => {
    const result = { count: 0 };

    countIfTimestampInWindow('2024-01-10T00:00:00Z', since, result);

    expect(result.count).toBe(1);
  });

  it('should increment when timestamp is after since', () => {
    const result = { count: 2 };

    countIfTimestampInWindow('2024-01-11T12:00:00Z', since, result);

    expect(result.count).toBe(3);
  });
});
