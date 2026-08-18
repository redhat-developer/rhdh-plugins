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

import { formatMetadataForDisplay } from './formatMetadataForDisplay';

describe('formatMetadataForDisplay', () => {
  it('converts top-level booleans to strings', () => {
    expect(
      formatMetadataForDisplay({ enabled: true, disabled: false }),
    ).toEqual({ enabled: 'true', disabled: 'false' });
  });

  it('converts nested booleans to strings', () => {
    expect(
      formatMetadataForDisplay({
        options: { notify: true, archive: false },
        flags: [true, false],
      }),
    ).toEqual({
      options: { notify: 'true', archive: 'false' },
      flags: ['true', 'false'],
    });
  });

  it('leaves non-boolean values unchanged', () => {
    expect(
      formatMetadataForDisplay({
        name: 'workflow',
        count: 3,
        tags: ['a', 'b'],
      }),
    ).toEqual({
      name: 'workflow',
      count: 3,
      tags: ['a', 'b'],
    });
  });
});
