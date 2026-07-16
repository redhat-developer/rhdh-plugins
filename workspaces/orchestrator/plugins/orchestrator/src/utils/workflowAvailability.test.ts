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

import {
  hasWorkflowAvailabilityDetails,
  isWorkflowUnavailable,
} from './workflowAvailability';

describe('isWorkflowUnavailable', () => {
  it('returns true only when availability is explicitly false', () => {
    expect(isWorkflowUnavailable(false)).toBe(true);
    expect(isWorkflowUnavailable(true)).toBe(false);
    expect(isWorkflowUnavailable(undefined)).toBe(false);
  });
});

describe('hasWorkflowAvailabilityDetails', () => {
  it('returns true only for unavailable availability details', () => {
    expect(
      hasWorkflowAvailabilityDetails({
        isAvailable: false,
        message: 'disabled',
      }),
    ).toBe(true);
    expect(hasWorkflowAvailabilityDetails({ isAvailable: true })).toBe(false);
    expect(hasWorkflowAvailabilityDetails(undefined)).toBe(false);
  });
});
