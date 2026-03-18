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

import { JobStatusEnum } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { canCancelPhase } from './canCancelPhase';

describe('canCancelPhase', () => {
  it.each<JobStatusEnum>(['pending', 'running'])(
    'returns true when status is %s',
    status => {
      expect(canCancelPhase(status)).toBe(true);
    },
  );

  it.each<JobStatusEnum>(['success', 'error', 'cancelled'])(
    'returns false when status is %s',
    status => {
      expect(canCancelPhase(status)).toBe(false);
    },
  );

  it('returns false when status is undefined', () => {
    expect(canCancelPhase(undefined)).toBe(false);
  });
});
