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

const mockUsePermissionArray = jest.fn();
const mockUseResourcePermissionBatch = jest.fn();

jest.mock('./usePermissionArray', () => ({
  usePermissionArray: (...args: unknown[]) => mockUsePermissionArray(...args),
}));

jest.mock('./useResourcePermissionBatch', () => ({
  useResourcePermissionBatch: (...args: unknown[]) =>
    mockUseResourcePermissionBatch(...args),
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

  it('returns allowed when resource permission grants access', () => {
    mockUseResourcePermissionBatch.mockReturnValue({
      loading: false,
      allowed: [true, true],
    });
    mockUsePermissionArray.mockReturnValue({
      loading: false,
      allowed: [false, false],
    });

    const { result } = renderHook(() =>
      useWorkflowPermissionBatch(
        items,
        genericPermission,
        specificPermissionFactory,
      ),
    );

    expect(result.current.allowed).toEqual([true, true]);
  });

  it('falls back to legacy permissions when resource permission denies', () => {
    mockUseResourcePermissionBatch.mockReturnValue({
      loading: false,
      allowed: [false, false],
    });
    mockUsePermissionArray.mockReturnValue({
      loading: false,
      allowed: [true, false],
    });

    const { result } = renderHook(() =>
      useWorkflowPermissionBatch(
        items,
        genericPermission,
        specificPermissionFactory,
      ),
    );

    expect(result.current.allowed).toEqual([true, false]);
  });

  it('reports loading when either source is loading', () => {
    mockUseResourcePermissionBatch.mockReturnValue({
      loading: true,
      allowed: [false, false],
    });
    mockUsePermissionArray.mockReturnValue({
      loading: false,
      allowed: [false, false],
    });

    const { result } = renderHook(() =>
      useWorkflowPermissionBatch(
        items,
        genericPermission,
        specificPermissionFactory,
      ),
    );

    expect(result.current.loading).toBe(true);
  });
});
