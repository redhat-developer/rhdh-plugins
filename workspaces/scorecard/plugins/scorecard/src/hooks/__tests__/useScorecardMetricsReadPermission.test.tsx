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
import { usePermission } from '@backstage/plugin-permission-react';

import { useScorecardMetricsReadPermission } from '../useScorecardMetricsReadPermission';

// Mock the permissions hook
jest.mock('@backstage/plugin-permission-react');
jest.mock('@red-hat-developer-hub/backstage-plugin-scorecard-common', () => ({
  scorecardMetricReadPermission: 'scorecard.metric.read',
}));

const mockUsePermission = usePermission as jest.MockedFunction<
  typeof usePermission
>;

describe('useScorecardMetricsReadPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return loading state when permission is being checked', () => {
    mockUsePermission.mockReturnValue({
      loading: true,
      allowed: false,
    });

    const { result } = renderHook(() => useScorecardMetricsReadPermission());

    expect(result.current).toEqual({
      loading: true,
      allowed: false,
    });
  });

  it('should return allowed true when user has permission', () => {
    mockUsePermission.mockReturnValue({
      loading: false,
      allowed: true,
    });

    const { result } = renderHook(() => useScorecardMetricsReadPermission());

    expect(result.current).toEqual({
      loading: false,
      allowed: true,
    });
  });

  it('should return allowed false when user does not have permission', () => {
    mockUsePermission.mockReturnValue({
      loading: false,
      allowed: false,
    });

    const { result } = renderHook(() => useScorecardMetricsReadPermission());

    expect(result.current).toEqual({
      loading: false,
      allowed: false,
    });
  });

  it('should call usePermission with correct parameters', () => {
    mockUsePermission.mockReturnValue({
      loading: false,
      allowed: true,
    });

    renderHook(() => useScorecardMetricsReadPermission());

    expect(mockUsePermission).toHaveBeenCalledWith({
      permission: 'scorecard.metric.read',
      resourceRef: 'scorecard-metric',
    });
  });
});
