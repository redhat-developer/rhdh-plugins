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

import { resolveEntityScorecardColumns } from '../useEntityScorecardColumns';

describe('resolveEntityScorecardColumns', () => {
  it('returns 1 column below the sm breakpoint', () => {
    expect(resolveEntityScorecardColumns(0)).toBe(1);
    expect(resolveEntityScorecardColumns(599)).toBe(1);
  });

  it('returns 2 columns from sm up to lg', () => {
    expect(resolveEntityScorecardColumns(600)).toBe(2);
    expect(resolveEntityScorecardColumns(1199)).toBe(2);
  });

  it('returns 3 columns at lg and above', () => {
    expect(resolveEntityScorecardColumns(1200)).toBe(3);
    expect(resolveEntityScorecardColumns(1920)).toBe(3);
  });
});
