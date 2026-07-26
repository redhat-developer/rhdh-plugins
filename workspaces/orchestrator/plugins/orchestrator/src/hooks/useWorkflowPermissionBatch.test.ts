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

import { useWorkflowPermissionBatch } from './useWorkflowPermissionBatch';

const mockUsePermission = jest.fn();
const mockUsePermissionArray = jest.fn();

jest.mock('@backstage/plugin-permission-react', () => ({
  usePermission: (...args: unknown[]) => mockUsePermission(...args),
}));

jest.mock('./usePermissionArray', () => ({
  usePermissionArray: (...args: unknown[]) => mockUsePermissionArray(...args),
}));

describe('useWorkflowPermissionBatch', () => {
  const genericPermission = {
    name: 'orchestrator.workflow.read',
    attributes: { action: 'read' },
  } as never;
  const specificPermissionFactory = jest.fn(
    (workflowId: string) =>
      ({
        name: `orchestrator.workflow.use.${workflowId}`,
        attributes: { action: 'use' },
      }) as never,
  );
  const items = [{ workflowId: 'wf-1' }, { workflowId: 'wf-2' }] as never[];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips specific checks when generic permission is allowed', () => {
    mockUsePermission.mockReturnValue({ loading: false, allowed: true });
    mockUsePermissionArray.mockReturnValue({ allowed: [] });

    const { result } = renderHook(() =>
      useWorkflowPermissionBatch(
        items,
        genericPermission,
        specificPermissionFactory,
      ),
    );

    expect(mockUsePermissionArray).toHaveBeenCalledWith([]);
    expect(specificPermissionFactory).not.toHaveBeenCalled();
    expect(result.current.allowed).toEqual([true, true]);
  });

  it('skips specific checks while generic permission is loading', () => {
    mockUsePermission.mockReturnValue({ loading: true, allowed: false });
    mockUsePermissionArray.mockReturnValue({ allowed: [] });

    const { result } = renderHook(() =>
      useWorkflowPermissionBatch(
        items,
        genericPermission,
        specificPermissionFactory,
      ),
    );

    expect(mockUsePermissionArray).toHaveBeenCalledWith([]);
    // generic.allowed is false and specific.allowed has no entries yet while loading
    expect(result.current.allowed).toEqual([undefined, undefined]);
  });

  it('uses per-workflow permissions when generic permission is denied', () => {
    mockUsePermission.mockReturnValue({ loading: false, allowed: false });
    mockUsePermissionArray.mockReturnValue({ allowed: [true, false] });

    const { result } = renderHook(() =>
      useWorkflowPermissionBatch(
        items,
        genericPermission,
        specificPermissionFactory,
      ),
    );

    expect(specificPermissionFactory).toHaveBeenCalledWith('wf-1');
    expect(specificPermissionFactory).toHaveBeenCalledWith('wf-2');
    expect(mockUsePermissionArray).toHaveBeenCalledWith([
      {
        name: 'orchestrator.workflow.use.wf-1',
        attributes: { action: 'use' },
      },
      {
        name: 'orchestrator.workflow.use.wf-2',
        attributes: { action: 'use' },
      },
    ]);
    expect(result.current.allowed).toEqual([true, false]);
  });
});
