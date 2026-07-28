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

import { useLogsEnabled } from './useLogsEnabled';

const mockUseApi = jest.fn();

jest.mock('@backstage/core-plugin-api', () => ({
  configApiRef: {},
  useApi: (...args: unknown[]) => mockUseApi(...args),
}));

describe('useLogsEnabled', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when workflow log provider config exists', () => {
    const configApi = {
      getOptionalConfig: jest.fn().mockReturnValue({}),
    };
    mockUseApi.mockReturnValue(configApi);

    const { result } = renderHook(() => useLogsEnabled());

    expect(result.current).toBe(true);
    expect(configApi.getOptionalConfig).toHaveBeenCalledWith(
      'orchestrator.workflowLogProvider',
    );
  });

  it('returns false when workflow log provider config is missing', () => {
    const configApi = {
      getOptionalConfig: jest.fn().mockReturnValue(undefined),
    };
    mockUseApi.mockReturnValue(configApi);

    const { result } = renderHook(() => useLogsEnabled());

    expect(result.current).toBe(false);
    expect(configApi.getOptionalConfig).toHaveBeenCalledWith(
      'orchestrator.workflowLogProvider',
    );
  });
});
