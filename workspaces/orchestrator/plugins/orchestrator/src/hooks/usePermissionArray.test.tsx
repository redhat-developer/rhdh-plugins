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

import { ReactNode } from 'react';

import { AuthorizeResult } from '@backstage/plugin-permission-common';

import { renderHook, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';

import {
  orchestratorWorkflowPermission,
  orchestratorWorkflowUsePermission,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { usePermissionArray } from './usePermissionArray';

const mockUseApi = jest.fn();

jest.mock('@backstage/core-plugin-api', () => ({
  useApi: (...args: unknown[]) => mockUseApi(...args),
}));

jest.mock('@backstage/plugin-permission-react', () => ({
  permissionApiRef: {},
}));

const permissions = [
  orchestratorWorkflowPermission,
  orchestratorWorkflowUsePermission,
];

describe('usePermissionArray', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns loading state before authorization resolves', () => {
    const authorize = jest.fn().mockReturnValue(new Promise(() => {}));
    mockUseApi.mockReturnValue({ authorize });

    const { result } = renderHook(() => usePermissionArray(permissions), {
      wrapper,
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.allowed).toEqual([false, false]);
  });

  it('returns allowed flags based on authorization responses', async () => {
    const authorize = jest
      .fn()
      .mockResolvedValueOnce({ result: AuthorizeResult.ALLOW })
      .mockResolvedValueOnce({ result: AuthorizeResult.DENY });
    mockUseApi.mockReturnValue({ authorize });

    const { result } = renderHook(() => usePermissionArray(permissions), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.allowed).toEqual([true, false]);
    expect(result.current.error).toBeUndefined();
    expect(authorize).toHaveBeenNthCalledWith(1, {
      permission: permissions[0],
    });
    expect(authorize).toHaveBeenNthCalledWith(2, {
      permission: permissions[1],
    });
  });

  it('returns error state when authorization request fails', async () => {
    const error = new Error('permission backend unavailable');
    const authorize = jest.fn().mockRejectedValue(error);
    mockUseApi.mockReturnValue({ authorize });

    const { result } = renderHook(() => usePermissionArray(permissions), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe(error);
    expect(result.current.allowed).toEqual([false, false]);
  });
});
