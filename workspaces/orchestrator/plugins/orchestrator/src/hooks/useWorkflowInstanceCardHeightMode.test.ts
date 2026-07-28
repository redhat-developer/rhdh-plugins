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

import { useWorkflowInstanceCardHeightMode } from './useWorkflowInstanceCardHeightMode';

const mockUseApi = jest.fn();

jest.mock('@backstage/core-plugin-api', () => ({
  configApiRef: {},
  useApi: (...args: unknown[]) => mockUseApi(...args),
}));

describe('useWorkflowInstanceCardHeightMode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns fixed when config is missing', () => {
    const configApi = {
      getOptionalString: jest.fn().mockReturnValue(undefined),
    };
    mockUseApi.mockReturnValue(configApi);

    const { result } = renderHook(() => useWorkflowInstanceCardHeightMode());

    expect(result.current).toBe('fixed');
  });

  it('returns content when config value is content', () => {
    const configApi = {
      getOptionalString: jest.fn().mockReturnValue('content'),
    };
    mockUseApi.mockReturnValue(configApi);

    const { result } = renderHook(() => useWorkflowInstanceCardHeightMode());

    expect(result.current).toBe('content');
  });

  it('returns fixed and warns when config value is invalid', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const configApi = {
      getOptionalString: jest.fn().mockReturnValue('stretch'),
    };
    mockUseApi.mockReturnValue(configApi);

    const { result } = renderHook(() => useWorkflowInstanceCardHeightMode());

    expect(result.current).toBe('fixed');
    expect(warnSpy).toHaveBeenCalledWith(
      'Unknown cardHeightMode "stretch", falling back to "fixed"',
    );
    warnSpy.mockRestore();
  });
});
