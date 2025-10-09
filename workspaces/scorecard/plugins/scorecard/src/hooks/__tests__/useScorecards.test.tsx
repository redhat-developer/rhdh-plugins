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

import useAsync from 'react-use/lib/useAsync';
import { renderHook } from '@testing-library/react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi } from '@backstage/core-plugin-api';
import { MetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { useScorecards } from '../useScorecards';

// Mock the dependencies
jest.mock('@backstage/plugin-catalog-react');
jest.mock('@backstage/core-plugin-api');
jest.mock('react-use/lib/useAsync');

const mockUseEntity = useEntity as jest.MockedFunction<typeof useEntity>;
const mockUseApi = useApi as jest.MockedFunction<typeof useApi>;
const mockUseAsync = useAsync as jest.MockedFunction<typeof useAsync>;

describe('useScorecards', () => {
  const mockScorecardApi = {
    getScorecards: jest.fn(),
  };

  const mockEntity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      namespace: 'default',
      name: 'test-component',
    },
  };

  const mockScorecardData: MetricResult[] = [
    {
      id: 'github.pull_requests_open',
      status: 'success',
      metadata: {
        title: 'GitHub open PRs',
        description:
          'Current count of open Pull Requests for a given GitHub repository.',
        type: 'number',
        history: true,
      },
      result: {
        value: 5,
        timestamp: '2025-08-08T10:00:00Z',
        thresholdResult: {
          status: 'success',
          definition: {
            rules: [
              { key: 'success', expression: '< 10' },
              { key: 'warning', expression: '10-50' },
              { key: 'error', expression: '> 50' },
            ],
          },
          evaluation: 'success',
        },
      },
    },
    {
      id: 'jira.blocking_tickets',
      status: 'success',
      metadata: {
        title: 'Jira blocking tickets',
        description:
          'Highlights the number of critical, blocking issues that are currently open in Jira.',
        type: 'number',
      },
      result: {
        value: 2,
        timestamp: '2025-08-08T10:00:00Z',
        thresholdResult: {
          status: 'success',
          definition: {
            rules: [
              { key: 'success', expression: '< 5' },
              { key: 'warning', expression: '> 5' },
              { key: 'error', expression: '> 10' },
            ],
          },
          evaluation: 'success',
        },
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEntity.mockReturnValue({ entity: { ...mockEntity } });
    mockUseApi.mockReturnValue(mockScorecardApi);
  });

  describe('successful data fetching', () => {
    it('should return scorecard data when API call succeeds', async () => {
      mockScorecardApi.getScorecards.mockResolvedValue(mockScorecardData);
      mockUseAsync.mockReturnValue({
        loading: false,
        error: undefined,
        value: mockScorecardData,
      });

      const { result } = renderHook(() => useScorecards());

      expect(result.current).toEqual({
        scorecards: mockScorecardData,
        loadingData: false,
        error: undefined,
      });
    });

    it('should call scorecard API with correct entity', () => {
      mockScorecardApi.getScorecards.mockResolvedValue(mockScorecardData);
      mockUseAsync.mockReturnValue({
        loading: false,
        error: undefined,
        value: mockScorecardData,
      });

      renderHook(() => useScorecards());

      expect(mockUseAsync).toHaveBeenCalledWith(expect.any(Function), [
        mockEntity,
        mockScorecardApi,
        expect.any(Function), // translation function
      ]);
    });

    it('should handle empty scorecard array', () => {
      const emptyData: MetricResult[] = [];
      mockScorecardApi.getScorecards.mockResolvedValue(emptyData);
      mockUseAsync.mockReturnValue({
        loading: false,
        error: undefined,
        value: emptyData,
      });

      const { result } = renderHook(() => useScorecards());

      expect(result.current).toEqual({
        scorecards: emptyData,
        loadingData: false,
        error: undefined,
      });
    });
  });

  describe('loading states', () => {
    it('should return loading state when data is being fetched', () => {
      mockUseAsync.mockReturnValue({
        loading: true,
        error: undefined,
        value: undefined,
      });

      const { result } = renderHook(() => useScorecards());

      expect(result.current).toEqual({
        scorecards: undefined,
        loadingData: true,
        error: undefined,
      });
    });

    it('should transition from loading to loaded state', () => {
      // First render - loading
      mockUseAsync.mockReturnValueOnce({
        loading: true,
        error: undefined,
        value: undefined,
      });

      const { result, rerender } = renderHook(() => useScorecards());

      expect(result.current.loadingData).toBe(true);
      expect(result.current.scorecards).toBeUndefined();

      // Second render - loaded
      mockUseAsync.mockReturnValueOnce({
        loading: false,
        error: undefined,
        value: mockScorecardData,
      });

      rerender();

      expect(result.current.loadingData).toBe(false);
      expect(result.current.scorecards).toEqual(mockScorecardData);
    });
  });

  describe('error handling', () => {
    it('should handle missing entity kind', () => {
      const entityWithoutKind = {
        apiVersion: 'backstage.io/v1alpha1',
        metadata: {
          namespace: 'default',
          name: 'test-component',
        },
      };
      // @ts-expect-error - entityWithoutKind is missing kind
      mockUseEntity.mockReturnValue({ entity: { ...entityWithoutKind } });

      const error = new Error(
        'Entity missing required properties for scorecard lookup',
      );
      mockUseAsync.mockReturnValue({
        loading: false,
        error,
        value: undefined,
      });

      const { result } = renderHook(() => useScorecards());

      expect(result.current).toEqual({
        scorecards: undefined,
        loadingData: false,
        error,
      });
    });

    it('should handle missing entity namespace', () => {
      const entityWithoutNamespace = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'test-component',
        },
      };
      mockUseEntity.mockReturnValue({ entity: { ...entityWithoutNamespace } });

      const error = new Error(
        'Entity missing required properties for scorecard lookup',
      );
      mockUseAsync.mockReturnValue({
        loading: false,
        error,
        value: undefined,
      });

      const { result } = renderHook(() => useScorecards());

      expect(result.current).toEqual({
        scorecards: undefined,
        loadingData: false,
        error,
      });
    });

    it('should handle missing entity name', () => {
      const entityWithoutName = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          namespace: 'default',
        },
      };
      // @ts-expect-error - entityWithoutName is missing name
      mockUseEntity.mockReturnValue({ entity: { ...entityWithoutName } });

      const error = new Error(
        'Entity missing required properties for scorecard lookup',
      );
      mockUseAsync.mockReturnValue({
        loading: false,
        error,
        value: undefined,
      });

      const { result } = renderHook(() => useScorecards());

      expect(result.current).toEqual({
        scorecards: undefined,
        loadingData: false,
        error,
      });
    });

    it('should handle API errors', () => {
      const apiError = new Error('Network error');
      mockScorecardApi.getScorecards.mockRejectedValue(apiError);

      const wrappedError = new Error('Error fetching scorecards:', apiError);
      mockUseAsync.mockReturnValue({
        loading: false,
        error: wrappedError,
        value: undefined,
      });

      const { result } = renderHook(() => useScorecards());

      expect(result.current).toEqual({
        scorecards: undefined,
        loadingData: false,
        error: wrappedError,
      });
    });

    it('should handle invalid response format', () => {
      mockScorecardApi.getScorecards.mockResolvedValue(null);

      const error = new Error('Invalid response format from scorecard API');
      mockUseAsync.mockReturnValue({
        loading: false,
        error,
        value: undefined,
      });

      const { result } = renderHook(() => useScorecards());

      expect(result.current).toEqual({
        scorecards: undefined,
        loadingData: false,
        error,
      });
    });

    it('should handle non-array response', () => {
      mockScorecardApi.getScorecards.mockResolvedValue({ notAnArray: true });

      const error = new Error('Invalid response format from scorecard API');
      mockUseAsync.mockReturnValue({
        loading: false,
        error,
        value: undefined,
      });

      const { result } = renderHook(() => useScorecards());

      expect(result.current).toEqual({
        scorecards: undefined,
        loadingData: false,
        error,
      });
    });
  });
});
