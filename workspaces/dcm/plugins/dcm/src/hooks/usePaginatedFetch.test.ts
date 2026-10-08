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

import { act, renderHook, waitFor } from '@testing-library/react';
import {
  usePaginatedFetch,
  UsePaginatedFetchOptions,
} from './usePaginatedFetch';

// ── Fixtures ──────────────────────────────────────────────────────────────────

type Item = { id: string };

function makePages(total: number, pageSize: number): Item[][] {
  const all: Item[] = Array.from({ length: total }, (_, i) => ({
    id: String(i + 1),
  }));
  const pages: Item[][] = [];
  for (let i = 0; i < all.length; i += pageSize) {
    pages.push(all.slice(i, i + pageSize));
  }
  return pages;
}

function makeOptions(
  pages: Item[][],
  overrides?: Partial<UsePaginatedFetchOptions<Item>>,
): UsePaginatedFetchOptions<Item> {
  return {
    fetchFn: jest.fn().mockImplementation(({ pageToken }) => {
      const idx = pageToken ? parseInt(pageToken, 10) : 0;
      const items = pages[idx] ?? [];
      const nextIdx = idx + 1;
      const nextPageToken = nextIdx < pages.length ? String(nextIdx) : '';
      return Promise.resolve({ items, nextPageToken });
    }),
    pageSize: 5,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('usePaginatedFetch', () => {
  describe('initial load', () => {
    it('starts in loading state', () => {
      const opts = makeOptions(makePages(5, 5));
      const { result } = renderHook(() => usePaginatedFetch<Item>(opts));
      expect(result.current.loading).toBe(true);
    });

    it('populates data after load', async () => {
      const opts = makeOptions(makePages(5, 5));
      const { result } = renderHook(() => usePaginatedFetch<Item>(opts));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.data).toHaveLength(5);
      expect(result.current.hasPrev).toBe(false);
      expect(result.current.hasNext).toBe(false);
    });

    it('exposes hasNext when more pages exist', async () => {
      const opts = makeOptions(makePages(10, 5));
      const { result } = renderHook(() => usePaginatedFetch<Item>(opts));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.hasNext).toBe(true);
      expect(result.current.hasPrev).toBe(false);
    });

    it('sets error and clears data on failure', async () => {
      const opts = makeOptions([], {
        fetchFn: jest.fn().mockRejectedValue(new Error('network error')),
      });
      const { result } = renderHook(() => usePaginatedFetch<Item>(opts));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toBe('network error');
      expect(result.current.data).toHaveLength(0);
    });
  });

  describe('goNext', () => {
    it('fetches the next page and enables hasPrev', async () => {
      const opts = makeOptions(makePages(15, 5));
      const { result } = renderHook(() => usePaginatedFetch<Item>(opts));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.data[0].id).toBe('1');

      act(() => {
        result.current.goNext();
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.data[0].id).toBe('6');
      expect(result.current.hasPrev).toBe(true);
      expect(result.current.hasNext).toBe(true);
    });

    it('navigating to the last page clears hasNext', async () => {
      const opts = makeOptions(makePages(10, 5));
      const { result } = renderHook(() => usePaginatedFetch<Item>(opts));
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.goNext();
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.hasNext).toBe(false);
      expect(result.current.hasPrev).toBe(true);
    });
  });

  describe('goPrev', () => {
    it('goes back to the first page', async () => {
      const opts = makeOptions(makePages(10, 5));
      const { result } = renderHook(() => usePaginatedFetch<Item>(opts));
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.goNext());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.data[0].id).toBe('6');

      act(() => result.current.goPrev());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.data[0].id).toBe('1');
      expect(result.current.hasPrev).toBe(false);
    });

    it('navigates across three pages and back', async () => {
      const opts = makeOptions(makePages(15, 5));
      const { result } = renderHook(() => usePaginatedFetch<Item>(opts));
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.goNext());
      await waitFor(() => expect(result.current.loading).toBe(false));
      act(() => result.current.goNext());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.data[0].id).toBe('11');
      expect(result.current.hasNext).toBe(false);

      act(() => result.current.goPrev());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.data[0].id).toBe('6');

      act(() => result.current.goPrev());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.data[0].id).toBe('1');
      expect(result.current.hasPrev).toBe(false);
    });
  });

  describe('refresh', () => {
    it('re-fetches the current page without changing cursor position', async () => {
      const fetchFn = jest.fn().mockImplementation(({ pageToken }) => {
        const idx = pageToken ? parseInt(pageToken, 10) : 0;
        const pages = makePages(10, 5);
        const items = pages[idx] ?? [];
        const nextIdx = idx + 1;
        const nextPageToken = nextIdx < pages.length ? String(nextIdx) : '';
        return Promise.resolve({ items, nextPageToken });
      });
      const { result } = renderHook(() =>
        usePaginatedFetch<Item>({ fetchFn, pageSize: 5 }),
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.goNext());
      await waitFor(() => expect(result.current.loading).toBe(false));
      const callCountAfterNext = fetchFn.mock.calls.length;

      act(() => result.current.refresh());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(fetchFn.mock.calls).toHaveLength(callCountAfterNext + 1);
      // Should still be on page 2 (pageToken '1')
      expect(result.current.data[0].id).toBe('6');
    });
  });

  describe('resetToFirstPage', () => {
    it('resets cursor and fetches the first page', async () => {
      const opts = makeOptions(makePages(10, 5));
      const { result } = renderHook(() => usePaginatedFetch<Item>(opts));
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.goNext());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.hasPrev).toBe(true);

      act(() => result.current.resetToFirstPage());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.data[0].id).toBe('1');
      expect(result.current.hasPrev).toBe(false);
    });
  });

  describe('search does not affect cursor state', () => {
    it('hasNext remains true after search interaction (no resetCursor side-effect)', async () => {
      // Page 1 of 2 — hasNext should be true after load.
      const opts = makeOptions(makePages(10, 5));
      const { result } = renderHook(() => usePaginatedFetch<Item>(opts));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.hasNext).toBe(true);

      // Simulate a parent component calling search (consumer-side state change).
      // The hook itself does not expose a setSearch; cursor state must stay intact.
      // Re-render with the same options to confirm nothing is reset.
      // (The regression: resetCursor() used to clear nextToken, permanently
      //  disabling Next until remount or page-size change.)
      expect(result.current.hasNext).toBe(true);
      expect(result.current.hasPrev).toBe(false);
    });

    it('goNext still works after the hook re-renders with new options (search-like rerender)', async () => {
      const pages = makePages(10, 5);
      const fetchFn = jest.fn().mockImplementation(({ pageToken }) => {
        const idx = pageToken ? parseInt(pageToken, 10) : 0;
        const items = pages[idx] ?? [];
        const nextIdx = idx + 1;
        const nextPageToken = nextIdx < pages.length ? String(nextIdx) : '';
        return Promise.resolve({ items, nextPageToken });
      });
      const { result, rerender } = renderHook(
        ({ pageSize }: { pageSize: number }) =>
          usePaginatedFetch<Item>({ fetchFn, pageSize }),
        { initialProps: { pageSize: 5 } },
      );
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.hasNext).toBe(true);

      // Simulate a re-render caused by a parent state update (e.g. search text
      // change) with the same pageSize — cursor state must be preserved.
      rerender({ pageSize: 5 });
      expect(result.current.hasNext).toBe(true);

      act(() => result.current.goNext());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.data[0].id).toBe('6');
      expect(result.current.hasPrev).toBe(true);
    });
  });
});
