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
import { TestApiProvider } from '@backstage/test-utils';

import { dynamicPluginsInfoApiRef } from '../api';
import { useInstalledPackagesCount } from './useInstalledPackagesCount';

describe('useInstalledPackagesCount', () => {
  const createWrapper =
    (apis: any) =>
    ({ children }: { children?: React.ReactNode }) => (
      <TestApiProvider apis={apis}>{children}</TestApiProvider>
    );

  it('returns count from dynamic-plugins-info', async () => {
    const mockApi = {
      listLoadedPlugins: jest.fn().mockResolvedValue([
        {
          name: 'a',
          version: '1.0.0',
          role: 'frontend-plugin',
          platform: 'fe',
        },
        { name: 'b', version: '1.0.0', role: 'backend-plugin', platform: 'be' },
      ]),
    };

    const { result } = renderHook(() => useInstalledPackagesCount(), {
      wrapper: createWrapper([[dynamicPluginsInfoApiRef, mockApi]]),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockApi.listLoadedPlugins).toHaveBeenCalledTimes(1);
    expect(result.current.count).toBe(2);
    expect(result.current.error).toBeUndefined();
  });

  it('returns 0 and sets error on failure', async () => {
    const mockApi = {
      listLoadedPlugins: jest.fn().mockRejectedValue(new Error('boom')),
    };

    const { result } = renderHook(() => useInstalledPackagesCount(), {
      wrapper: createWrapper([[dynamicPluginsInfoApiRef, mockApi]]),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockApi.listLoadedPlugins).toHaveBeenCalledTimes(1);
    expect(result.current.count).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
