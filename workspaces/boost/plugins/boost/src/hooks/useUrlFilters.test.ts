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

import { renderHook, act } from '@testing-library/react';
import { type ReactNode, createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { useUrlFilters } from './useUrlFilters';

function wrapper(initialUrl = '/') {
  return ({ children }: { children: ReactNode }) =>
    createElement(MemoryRouter, { initialEntries: [initialUrl] }, children);
}

describe('useUrlFilters', () => {
  it('reads filter values from URL params', () => {
    const { result } = renderHook(() => useUrlFilters(['type', 'owner']), {
      wrapper: wrapper('/?type=skill&owner=team-ai'),
    });

    expect(result.current.filterValues.get('type')).toEqual(['skill']);
    expect(result.current.filterValues.get('owner')).toEqual(['team-ai']);
  });

  it('reads comma-separated values as arrays', () => {
    const { result } = renderHook(() => useUrlFilters(['type']), {
      wrapper: wrapper('/?type=skill,rule'),
    });

    expect(result.current.filterValues.get('type')).toEqual(['skill', 'rule']);
  });

  it('ignores URL params not in filterParams', () => {
    const { result } = renderHook(() => useUrlFilters(['type']), {
      wrapper: wrapper('/?type=skill&page=2&view=table'),
    });

    expect(result.current.filterValues.size).toBe(1);
    expect(result.current.filterValues.has('page')).toBe(false);
    expect(result.current.filterValues.has('view')).toBe(false);
  });

  it('returns empty map when no filter params are in URL', () => {
    const { result } = renderHook(() => useUrlFilters(['type', 'owner']), {
      wrapper: wrapper('/'),
    });

    expect(result.current.filterValues.size).toBe(0);
  });

  it('setFilter writes a param to the URL', () => {
    const { result } = renderHook(() => useUrlFilters(['type']), {
      wrapper: wrapper('/'),
    });

    act(() => result.current.setFilter('type', ['skill']));

    expect(result.current.filterValues.get('type')).toEqual(['skill']);
  });

  it('setFilter removes param when values is empty', () => {
    const { result } = renderHook(() => useUrlFilters(['type']), {
      wrapper: wrapper('/?type=skill'),
    });

    act(() => result.current.setFilter('type', []));

    expect(result.current.filterValues.has('type')).toBe(false);
  });

  it('setFilter resets page to 0', () => {
    const { result } = renderHook(() => useUrlFilters(['type']), {
      wrapper: wrapper('/?page=3'),
    });

    act(() => result.current.setFilter('type', ['skill']));

    expect(result.current.page).toBe(0);
  });

  it('clearFilters removes filter params and search but keeps view and pageSize', () => {
    const { result } = renderHook(() => useUrlFilters(['type', 'owner']), {
      wrapper: wrapper(
        '/?type=skill&owner=team-ai&q=test&view=table&pageSize=50',
      ),
    });

    act(() => result.current.clearFilters());

    expect(result.current.filterValues.size).toBe(0);
    expect(result.current.search).toBe('');
    expect(result.current.viewMode).toBe('table');
    expect(result.current.pageSize).toBe(50);
  });

  it('reads viewMode from URL', () => {
    const { result } = renderHook(() => useUrlFilters([]), {
      wrapper: wrapper('/?view=table'),
    });

    expect(result.current.viewMode).toBe('table');
  });

  it('defaults viewMode to grid', () => {
    const { result } = renderHook(() => useUrlFilters([]), {
      wrapper: wrapper('/'),
    });

    expect(result.current.viewMode).toBe('grid');
  });

  it('reads page and pageSize from URL', () => {
    const { result } = renderHook(() => useUrlFilters([]), {
      wrapper: wrapper('/?page=2&pageSize=50'),
    });

    expect(result.current.page).toBe(2);
    expect(result.current.pageSize).toBe(50);
  });

  it('clamps pageSize between 1 and 100', () => {
    const { result } = renderHook(() => useUrlFilters([]), {
      wrapper: wrapper('/?pageSize=999'),
    });

    expect(result.current.pageSize).toBe(100);
  });
});
