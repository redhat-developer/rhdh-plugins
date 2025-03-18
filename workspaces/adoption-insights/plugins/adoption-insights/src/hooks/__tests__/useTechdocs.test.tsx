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
import { useTechdocs } from '../useTechdocs';

jest.mock('@backstage/core-plugin-api', () => ({
  useApi: jest.fn(),
}));

jest.mock('../../components/Header/DateRangeContext', () => ({
  useDateRange: jest.fn(),
}));

jest.mock('../../api', () => ({
  adoptionInsightsApiRef: {
    getTechdocs: jest
      .fn()
      .mockResolvedValue({ data: [{ name: 'Test Plugin' }] }),
  },
}));

describe('useTechdocs', () => {
  const mockApi = {
    getTechdocs: jest.fn(),
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

    mockApi.getTechdocs.mockResolvedValueOnce({ data: [] });

    const { result } = renderHook(() => useTechdocs({ limit: 3 }));
    expect(result.current.loading).toBe(true);
  });

  it('should return plugins data after API resolves', async () => {
    (useDateRange as jest.Mock).mockReturnValue({
      startDateRange: new Date('2025-03-01'),
      endDateRange: new Date('2025-03-08'),
    });

    const mockResponse = { data: [{ name: 'plugin-1' }, { name: 'plugin-2' }] };
    mockApi.getTechdocs.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useTechdocs({ limit: 3 }));

    await waitFor(() => {
      expect(result.current.techdocs).toEqual(mockResponse);
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
    mockApi.getTechdocs.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useTechdocs({ limit: 3 }));

    await waitFor(() => {
      expect(result.current.error).toEqual(mockError);
      expect(result.current.loading).toBe(false);
    });
  });
});
