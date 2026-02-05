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
import { resolveDropdownDefault } from './resolveDropdownDefault';

describe('resolveDropdownDefault', () => {
  it('uses selector-derived default when it matches a fetched option', async () => {
    const result = await resolveDropdownDefault({
      data: { selected: 'b' },
      values: ['a', 'b'],
      staticDefault: 'selected',
    });

    expect(result).toBe('b');
  });

  it('falls back to the static default when selector evaluation fails', async () => {
    const result = await resolveDropdownDefault({
      data: { other: 'value' },
      values: ['create', 'update'],
      staticDefault: 'create',
    });

    expect(result).toBe('create');
  });
});
