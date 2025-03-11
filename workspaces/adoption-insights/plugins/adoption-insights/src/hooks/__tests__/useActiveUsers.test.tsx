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
import { renderHook, waitFor } from '@testing-library/react';
import { useApi } from '@backstage/core-plugin-api';

import { useDateRange } from '../../components/Header/DateRangeContext';
import { useActiveUsers } from '../useActiveUsers';

jest.mock('@backstage/core-plugin-api', () => ({
  useApi: jest.fn(),
}));

jest.mock('../../components/Header/DateRangeContext', () => ({
  useDateRange: jest.fn(),
}));

jest.mock('../../api', () => ({
  adoptionInsightsApiRef: {
    getActiveUsers: jest
      .fn()
      .mockResolvedValue({ data: [{ name: 'Test Plugin' }] }),
  },
}));

describe('useActiveUsers', () => {
  const mockApi = {
    getActiveUsers: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useApi as jest.Mock).mockReturnValue(mockApi);
  });

  it('should return loading state initially', async () => {
    (useDateRange as jest.Mock).mockReturnValue({
      startDateRange: new Date('2025-03-01'),
      endDateRange: new Date('2025-03-08'),
    });

    mockApi.getActiveUsers.mockResolvedValueOnce({ data: [] });

    const { result } = renderHook(() => useActiveUsers());
    expect(result.current.loading).toBe(true);
  });

  it('should return plugins data after API resolves', async () => {
    (useDateRange as jest.Mock).mockReturnValue({
      startDateRange: new Date('2025-03-01'),
      endDateRange: new Date('2025-03-08'),
    });

    const mockResponse = {
      grouping: 'daily',
      data: [
        {
          date: '2025-03-01',
          total_users: 10,
          new_users: 5,
          returning_users: 5,
        },
        {
          name: '2025-03-02',
          total_users: 20,
          new_users: 15,
          returning_users: 5,
        },
      ],
    };
    mockApi.getActiveUsers.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useActiveUsers());

    await waitFor(() => {
      expect(result.current.activeUsers).toEqual(mockResponse);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });
  });

  it('should handle API failure', async () => {
    (useDateRange as jest.Mock).mockReturnValue({
      startDateRange: new Date('2025-03-01'),
      endDateRange: new Date('2025-03-08'),
    });

    const mockError = new Error('API Error');
    mockApi.getActiveUsers.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useActiveUsers());
    await waitFor(() => {
      expect(result.current.error).toEqual(mockError);
      expect(result.current.loading).toBe(false);
    });
  });
});
