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

import { normalizeFilter } from '../filterUtils';

describe('filterUtils', () => {
  describe('normalizeFilter', () => {
    it('should return undefined when value is "All"', () => {
      expect(normalizeFilter('All')).toBeUndefined();
    });

    it('should return the value when it is not "All"', () => {
      expect(normalizeFilter('cluster1')).toBe('cluster1');
      expect(normalizeFilter('subcomponent1')).toBe('subcomponent1');
      expect(normalizeFilter('application1')).toBe('application1');
    });
  });
});
