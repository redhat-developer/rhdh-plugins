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

import { useEntities } from './useEntities';

jest.mock('@backstage/core-plugin-api', () => {
  const actual = jest.requireActual('@backstage/core-plugin-api');
  return {
    ...actual,
    useApi: jest.fn(),
  };
});

describe('useEntities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useApi as jest.Mock).mockReturnValue({
      getEntities: jest.fn(),
    });
  });

  it('should return loading state initially', () => {
    (useApi as jest.Mock).mockReturnValue({
      getEntities: jest.fn(() => Promise.resolve({ items: [] })),
    });

    const { result } = renderHook(() => useEntities());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should return entities data when the API call is successful', async () => {
    const mockData = {
      items: [
        {
          apiVersion: 'v1',
          kind: 'Component',
          metadata: {
            name: 'test-entity',
            namespace: 'default',
          },
        },
      ],
    };

    (useApi as jest.Mock).mockReturnValue({
      getEntities: jest.fn(() => Promise.resolve(mockData)),
    });

    const { result } = renderHook(() => useEntities());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should return error state when the API call fails', async () => {
    const mockError = new Error('API call failed');

    (useApi as jest.Mock).mockReturnValue({
      getEntities: jest.fn(() => Promise.reject(mockError)),
    });

    const { result } = renderHook(() => useEntities());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.error).toEqual(mockError);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
