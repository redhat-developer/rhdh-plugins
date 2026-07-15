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

import { isBackwardStepNavigable } from './isBackwardStepNavigable';

describe('isBackwardStepNavigable', () => {
  it('allows navigating to any step before the active step', () => {
    expect(isBackwardStepNavigable(0, 2)).toBe(true);
    expect(isBackwardStepNavigable(1, 2)).toBe(true);
  });

  it('disallows the active step and future steps', () => {
    expect(isBackwardStepNavigable(2, 2)).toBe(false);
    expect(isBackwardStepNavigable(3, 2)).toBe(false);
  });

  it('disallows negative step indices', () => {
    expect(isBackwardStepNavigable(-1, 2)).toBe(false);
  });
});
