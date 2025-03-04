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
import { useApi } from '@backstage/core-plugin-api';
import { renderHook, waitFor } from '@testing-library/react';

import { mockPluginView } from '../../../dev/__data__/pluginViews';
import { usePluginViews } from '../usePluginViews';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

describe('usePluginViews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useApi as jest.Mock).mockReturnValue({
      getPluginViews: jest.fn().mockResolvedValue({ items: mockPluginView }),
    });
  });

  test('should initially return loading state', async () => {
    const { result } = renderHook(() =>
      usePluginViews({
        start_date: '2021-01-01',
        end_date: '2021-01-01',
        limit: 5,
      }),
    );
    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });
  });

  test('should return empty if start date or end date is not passed', async () => {
    (useApi as any).mockReturnValue({
      getPluginViews: async () => {
        return Promise.resolve([]);
      },
    });
    const { result } = renderHook(() =>
      usePluginViews({
        start_date: '2021-01-01',
        end_date: '2021-01-01',
        limit: 5,
      }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
      expect(result.current.plugins).toHaveLength(0);
    });
  });
});
