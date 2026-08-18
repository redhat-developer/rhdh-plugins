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
  DCM_ENTITY_STATUS,
  DCM_ENTITY_STATUS_VALUES,
  displayDcmEntityStatus,
  displayDcmEntityStatusLoose,
  parseDcmEntityStatus,
} from './entityStatus';

describe('entityStatus', () => {
  it('maps every known status to a non-empty display label', () => {
    for (const status of DCM_ENTITY_STATUS_VALUES) {
      expect(displayDcmEntityStatus(status).length).toBeGreaterThan(0);
    }
  });

  it('displays success and running with expected UI labels', () => {
    expect(displayDcmEntityStatus(DCM_ENTITY_STATUS.success)).toBe('Success');
    expect(displayDcmEntityStatus(DCM_ENTITY_STATUS.running)).toBe('Running');
  });

  it('parses known lowercase values', () => {
    expect(parseDcmEntityStatus('success')).toBe(DCM_ENTITY_STATUS.success);
    expect(parseDcmEntityStatus('running')).toBe(DCM_ENTITY_STATUS.running);
  });

  it('rejects legacy / wrong casing', () => {
    expect(parseDcmEntityStatus('Success')).toBeUndefined();
  });

  it('displayDcmEntityStatusLoose falls back for unknown', () => {
    expect(displayDcmEntityStatusLoose('success')).toBe('Success');
    expect(displayDcmEntityStatusLoose('unknown-state')).toBe('unknown-state');
  });
});
