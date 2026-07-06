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

import { renderHook } from '@testing-library/react';

import { ProcessInstanceStatusDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { useWorkflowInstanceStateColors } from './useWorkflowInstanceStatusColors';

jest.mock('tss-react/mui', () => ({
  makeStyles: () => () => () => ({
    classes: {
      [ProcessInstanceStatusDTO.Active]: 'active-class',
      [ProcessInstanceStatusDTO.Completed]: 'completed-class',
      [ProcessInstanceStatusDTO.Suspended]: 'suspended-class',
      [ProcessInstanceStatusDTO.Aborted]: 'aborted-class',
      [ProcessInstanceStatusDTO.Error]: 'error-class',
      [ProcessInstanceStatusDTO.Pending]: 'pending-class',
    },
  }),
}));

describe('useWorkflowInstanceStateColors', () => {
  it('returns undefined for undefined status', () => {
    const { result } = renderHook(() => useWorkflowInstanceStateColors());

    expect(result.current).toBeUndefined();
  });

  it('returns the class mapped to a completed status', () => {
    const { result } = renderHook(() =>
      useWorkflowInstanceStateColors(ProcessInstanceStatusDTO.Completed),
    );

    expect(result.current).toBe('completed-class');
  });

  it('returns the class mapped to an error status', () => {
    const { result } = renderHook(() =>
      useWorkflowInstanceStateColors(ProcessInstanceStatusDTO.Error),
    );

    expect(result.current).toBe('error-class');
  });
});
