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
import { useListState, useResetPageOnFilterChange } from '../useListState';
import { FRONTEND_PAGINATION } from '@red-hat-developer-hub/backstage-plugin-konflux-common';

describe('useListState', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useListState());

    expect(result.current.page).toBe(FRONTEND_PAGINATION.DEFAULT_PAGE);
    expect(result.current.rowsPerPage).toBe(
      FRONTEND_PAGINATION.DEFAULT_ROWS_PER_PAGE,
    );
  });

  it('should initialize with custom values', () => {
    const { result } = renderHook(() =>
      useListState({ initialPage: 2, initialRowsPerPage: 10 }),
    );

    expect(result.current.page).toBe(2);
    expect(result.current.rowsPerPage).toBe(10);
  });

  it('should update page when setPage is called', () => {
    const { result } = renderHook(() => useListState());

    expect(result.current.page).toBe(0);

    act(() => {
      result.current.setPage(5);
    });

    expect(result.current.page).toBe(5);
  });

  it('should update rowsPerPage when setRowsPerPage is called', () => {
    const { result } = renderHook(() => useListState());

    expect(result.current.rowsPerPage).toBe(5);

    act(() => {
      result.current.setRowsPerPage(25);
    });

    expect(result.current.rowsPerPage).toBe(25);
  });

  it('should handle multiple state updates', () => {
    const { result } = renderHook(() => useListState());

    act(() => {
      result.current.setPage(3);
      result.current.setRowsPerPage(50);
    });

    expect(result.current.page).toBe(3);
    expect(result.current.rowsPerPage).toBe(50);
  });

  it('should maintain independent state for multiple instances', () => {
    const { result: result1 } = renderHook(() => useListState());
    const { result: result2 } = renderHook(() => useListState());

    act(() => {
      result1.current.setPage(2);
      result2.current.setPage(4);
    });

    expect(result1.current.page).toBe(2);
    expect(result2.current.page).toBe(4);
  });
});

describe('useResetPageOnFilterChange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reset page to default when filters change', () => {
    const setPage = jest.fn();
    const { rerender } = renderHook(
      ({ filters }) => useResetPageOnFilterChange(setPage, filters),
      {
        initialProps: { filters: ['filter1', 'filter2'] },
      },
    );

    // Initial render should reset page
    expect(setPage).toHaveBeenCalledWith(FRONTEND_PAGINATION.DEFAULT_PAGE);
    expect(setPage).toHaveBeenCalledTimes(1);

    // Change filters
    rerender({ filters: ['filter1', 'filter3'] });

    // Should reset page again
    expect(setPage).toHaveBeenCalledTimes(2);
    expect(setPage).toHaveBeenLastCalledWith(FRONTEND_PAGINATION.DEFAULT_PAGE);
  });

  it('should not reset page when filters do not change', () => {
    const setPage = jest.fn();
    const filters = ['filter1', 'filter2'];

    const { rerender } = renderHook(
      ({ filters: hookFilters }) =>
        useResetPageOnFilterChange(setPage, hookFilters),
      {
        initialProps: { filters },
      },
    );

    expect(setPage).toHaveBeenCalledTimes(1);

    rerender({ filters: [...filters] });

    // Should NOT reset because the filter values haven't changed
    expect(setPage).toHaveBeenCalledTimes(1);
  });

  it('should reset page when filter values change', () => {
    const setPage = jest.fn();
    const { rerender } = renderHook(
      ({ filters }) => useResetPageOnFilterChange(setPage, filters),
      {
        initialProps: { filters: ['filter1'] },
      },
    );

    expect(setPage).toHaveBeenCalledTimes(1);

    rerender({ filters: ['filter2'] });

    expect(setPage).toHaveBeenCalledTimes(2);
  });

  it('should reset page when filter array length changes', () => {
    const setPage = jest.fn();
    const { rerender } = renderHook(
      ({ filters }) => useResetPageOnFilterChange(setPage, filters),
      {
        initialProps: { filters: ['filter1'] },
      },
    );

    expect(setPage).toHaveBeenCalledTimes(1);

    rerender({ filters: ['filter1', 'filter2'] });

    expect(setPage).toHaveBeenCalledTimes(2);
  });

  it('should handle empty filter array', () => {
    const setPage = jest.fn();
    renderHook(() => useResetPageOnFilterChange(setPage, []));

    expect(setPage).toHaveBeenCalledWith(FRONTEND_PAGINATION.DEFAULT_PAGE);
  });

  it('should use stable setPage function', () => {
    const setPage1 = jest.fn();
    const setPage2 = jest.fn();

    const { rerender } = renderHook(
      ({ setPage, filters }) => useResetPageOnFilterChange(setPage, filters),
      {
        initialProps: { setPage: setPage1, filters: ['filter1'] },
      },
    );

    expect(setPage1).toHaveBeenCalledTimes(1);

    // Change setPage function
    rerender({ setPage: setPage2, filters: ['filter1'] });

    // Should call new setPage function
    expect(setPage2).toHaveBeenCalledTimes(1);
  });
});
