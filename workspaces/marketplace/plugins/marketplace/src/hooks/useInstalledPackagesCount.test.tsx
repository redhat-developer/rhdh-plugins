/*
 * Copyright The Backstage Authors
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
import { useQuery } from '@tanstack/react-query';

import { useInstalledPackagesCount } from './useInstalledPackagesCount';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

describe('useInstalledPackagesCount', () => {
  it('returns count from dynamic-plugins-info', async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [
        {
          name: 'a',
          version: '1.0.0',
          role: 'frontend-plugin',
          platform: 'fe',
        },
        { name: 'b', version: '1.0.0', role: 'backend-plugin', platform: 'be' },
      ].length,
      isLoading: false,
      refetch: jest.fn(),
    });
    const { result } = renderHook(() => useInstalledPackagesCount());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBe(2);
    expect(result.current.error).toBeUndefined();
  });

  it('returns 0 and sets error on failure', async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [].length,
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: jest.fn(),
    });
    const { result } = renderHook(() => useInstalledPackagesCount());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
