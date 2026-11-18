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

import { isBackwardStepNavigable, isStepNavigable } from './isStepNavigable';

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

describe('isStepNavigable', () => {
  it('allows backward navigation like isBackwardStepNavigable', () => {
    expect(isStepNavigable(0, 2, 4)).toBe(true);
    expect(isStepNavigable(1, 3, 4)).toBe(true);
  });

  it('allows forward navigation up to furthestReachedStep', () => {
    expect(isStepNavigable(4, 2, 4)).toBe(true);
    expect(isStepNavigable(3, 1, 4)).toBe(true);
  });

  it('disallows forward navigation beyond furthestReachedStep', () => {
    expect(isStepNavigable(4, 2, 3)).toBe(false);
    expect(isStepNavigable(5, 2, 4)).toBe(false);
  });

  it('disallows the active step', () => {
    expect(isStepNavigable(2, 2, 4)).toBe(false);
  });
});
