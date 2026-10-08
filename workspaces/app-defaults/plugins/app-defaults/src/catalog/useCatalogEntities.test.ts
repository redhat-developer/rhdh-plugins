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
import { TestApiProvider } from '@backstage/test-utils';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { useCatalogEntities } from './useCatalogEntities';
import { createElement } from 'react';

function createWrapper(mockCatalogApi: any) {
  return ({ children }: { children: React.ReactNode }) =>
    createElement(TestApiProvider, {
      apis: [[catalogApiRef, mockCatalogApi]],
      children,
    });
}

describe('useCatalogEntities', () => {
  it('returns loading initially', () => {
    const mockApi = {
      getEntityFacets: jest.fn(() => new Promise(() => {})),
    };

    const { result } = renderHook(() => useCatalogEntities(), {
      wrapper: createWrapper(mockApi),
    });

    expect(result.current).toEqual({ status: 'loading' });
  });

  it('returns hasEntities true when entities exist', async () => {
    const mockApi = {
      getEntityFacets: jest.fn().mockResolvedValue({
        facets: { kind: [{ value: 'Component', count: 5 }] },
      }),
    };

    const { result } = renderHook(() => useCatalogEntities(), {
      wrapper: createWrapper(mockApi),
    });

    await waitFor(() => {
      expect(result.current).toEqual({ status: 'success', hasEntities: true });
    });
  });

  it('returns hasEntities false when catalog is empty', async () => {
    const mockApi = {
      getEntityFacets: jest.fn().mockResolvedValue({
        facets: { kind: [{ value: 'Component', count: 0 }] },
      }),
    };

    const { result } = renderHook(() => useCatalogEntities(), {
      wrapper: createWrapper(mockApi),
    });

    await waitFor(() => {
      expect(result.current).toEqual({
        status: 'success',
        hasEntities: false,
      });
    });
  });

  it('passes filter to getEntityFacets', async () => {
    const mockApi = {
      getEntityFacets: jest.fn().mockResolvedValue({
        facets: { kind: [{ value: 'Template', count: 2 }] },
      }),
    };

    renderHook(() => useCatalogEntities({ kind: 'Template' }), {
      wrapper: createWrapper(mockApi),
    });

    await waitFor(() => {
      expect(mockApi.getEntityFacets).toHaveBeenCalledWith({
        facets: ['kind'],
        filter: { kind: 'Template' },
      });
    });
  });

  it('passes no filter when filter is undefined', async () => {
    const mockApi = {
      getEntityFacets: jest.fn().mockResolvedValue({
        facets: { kind: [{ value: 'Component', count: 5 }] },
      }),
    };

    renderHook(() => useCatalogEntities(), {
      wrapper: createWrapper(mockApi),
    });

    await waitFor(() => {
      expect(mockApi.getEntityFacets).toHaveBeenCalledWith({
        facets: ['kind'],
        filter: undefined,
      });
    });
  });

  it('returns error state on API failure', async () => {
    const error = new Error('Network error');
    const mockApi = {
      getEntityFacets: jest.fn().mockRejectedValue(error),
    };

    const { result } = renderHook(() => useCatalogEntities(), {
      wrapper: createWrapper(mockApi),
    });

    await waitFor(() => {
      expect(result.current).toEqual({ status: 'error', error });
    });
  });
});
