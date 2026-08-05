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
  usePaginatedCrudTab,
  UsePaginatedCrudTabOptions,
} from './usePaginatedCrudTab';
import type { PaginatedLoadParams } from './usePaginatedCrudTab';

// ── Fixtures ──────────────────────────────────────────────────────────────────

type Item = { id: string; name: string };
type Form = { name: string; [key: string]: unknown };

const PAGE_1: Item[] = [
  { id: '1', name: 'Alpha' },
  { id: '2', name: 'Beta' },
];
const PAGE_2: Item[] = [{ id: '3', name: 'Gamma' }];

const STORAGE_KEY = 'test-hook';

function makeOptions(
  overrides?: Partial<UsePaginatedCrudTabOptions<Item, Form>>,
): UsePaginatedCrudTabOptions<Item, Form> {
  return {
    loadFn: jest
      .fn()
      .mockResolvedValue({ items: [...PAGE_1], nextPageToken: 'tok2' }),
    createFn: jest
      .fn()
      .mockImplementation((form: Form) =>
        Promise.resolve({ id: '99', name: form.name } as Item),
      ),
    deleteFn: jest.fn().mockResolvedValue(undefined),
    getId: (item: Item) => item.id,
    getSearchText: (item: Item) => [item.name],
    emptyForm: () => ({ name: '' } as Form),
    isValid: (form: Form) => Boolean(form.name?.trim()),
    storageKey: STORAGE_KEY,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('usePaginatedCrudTab', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── Initial load ────────────────────────────────────────────────────────────

  describe('initial load', () => {
    it('calls loadFn with pageToken=undefined and the persisted page size', async () => {
      const opts = makeOptions();
      renderHook(() => usePaginatedCrudTab<Item, Form>(opts));

      await waitFor(() => expect(opts.loadFn as jest.Mock).toHaveBeenCalled());

      const firstCall = (
        (opts.loadFn as jest.Mock).mock.calls[0] as [PaginatedLoadParams]
      )[0];
      expect(firstCall.pageToken).toBeUndefined();
      expect(firstCall.pageSize).toBeGreaterThan(0);
    });

    it('populates items and sets hasNext when nextPageToken is returned', async () => {
      const opts = makeOptions();
      const { result } = renderHook(() =>
        usePaginatedCrudTab<Item, Form>(opts),
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.items).toHaveLength(PAGE_1.length);
      expect(result.current.cursorPagination.hasNext).toBe(true);
      expect(result.current.cursorPagination.hasPrev).toBe(false);
    });

    it('hasPrev is false on the first page', async () => {
      const opts = makeOptions();
      const { result } = renderHook(() =>
        usePaginatedCrudTab<Item, Form>(opts),
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.cursorPagination.hasPrev).toBe(false);
    });
  });

  // ── goNext ──────────────────────────────────────────────────────────────────

  describe('goNext', () => {
    it('passes the nextPageToken to loadFn and sets hasPrev=true', async () => {
      const loadFn = jest
        .fn()
        .mockResolvedValueOnce({ items: [...PAGE_1], nextPageToken: 'tok2' })
        .mockResolvedValueOnce({ items: [...PAGE_2], nextPageToken: '' });

      const opts = makeOptions({ loadFn });
      const { result } = renderHook(() =>
        usePaginatedCrudTab<Item, Form>(opts),
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.cursorPagination.hasNext).toBe(true);

      act(() => result.current.goNext());

      await waitFor(() => expect(result.current.loading).toBe(false));

      const secondCallArgs = (loadFn.mock.calls[1] as [PaginatedLoadParams])[0];
      expect(secondCallArgs.pageToken).toBe('tok2');

      expect(result.current.cursorPagination.hasPrev).toBe(true);
      expect(result.current.cursorPagination.hasNext).toBe(false);
      expect(result.current.items).toHaveLength(PAGE_2.length);
    });
  });

  // ── goPrev ──────────────────────────────────────────────────────────────────

  describe('goPrev', () => {
    it('returns to the first page token and shrinks the token stack', async () => {
      const loadFn = jest
        .fn()
        .mockResolvedValueOnce({ items: [...PAGE_1], nextPageToken: 'tok2' })
        .mockResolvedValueOnce({ items: [...PAGE_2], nextPageToken: '' })
        .mockResolvedValueOnce({ items: [...PAGE_1], nextPageToken: 'tok2' });

      const opts = makeOptions({ loadFn });
      const { result } = renderHook(() =>
        usePaginatedCrudTab<Item, Form>(opts),
      );

      // load page 1
      await waitFor(() => expect(result.current.loading).toBe(false));

      // go to page 2
      act(() => result.current.goNext());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.cursorPagination.hasPrev).toBe(true);

      // go back to page 1
      act(() => result.current.goPrev());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const thirdCallArgs = (loadFn.mock.calls[2] as [PaginatedLoadParams])[0];
      expect(thirdCallArgs.pageToken).toBeUndefined();

      expect(result.current.cursorPagination.hasPrev).toBe(false);
      expect(result.current.items).toHaveLength(PAGE_1.length);
    });
  });

  // ── handlePageSizeChange ────────────────────────────────────────────────────

  describe('handlePageSizeChange', () => {
    it('resets to page 1 (undefined token) and reloads with the new size', async () => {
      const loadFn = jest
        .fn()
        .mockResolvedValueOnce({ items: [...PAGE_1], nextPageToken: 'tok2' })
        .mockResolvedValueOnce({ items: [...PAGE_2], nextPageToken: '' })
        .mockResolvedValue({ items: [...PAGE_1], nextPageToken: '' });

      const opts = makeOptions({ loadFn });
      const { result } = renderHook(() =>
        usePaginatedCrudTab<Item, Form>(opts),
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      // navigate to page 2 to build up a token stack
      act(() => result.current.goNext());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.cursorPagination.hasPrev).toBe(true);

      const newSize = 25;
      act(() => result.current.handlePageSizeChange(newSize));
      await waitFor(() => expect(result.current.loading).toBe(false));

      // cursor must be reset
      const lastCallArgs = (
        loadFn.mock.calls[loadFn.mock.calls.length - 1] as [PaginatedLoadParams]
      )[0];
      expect(lastCallArgs.pageToken).toBeUndefined();
      expect(lastCallArgs.pageSize).toBe(newSize);

      // hasPrev must be gone — token stack cleared
      expect(result.current.cursorPagination.hasPrev).toBe(false);
    });

    it('persists the new page size to localStorage', async () => {
      const opts = makeOptions();
      const { result } = renderHook(() =>
        usePaginatedCrudTab<Item, Form>(opts),
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.handlePageSizeChange(15));

      expect(localStorage.getItem(`dcm:pageSize:${STORAGE_KEY}`)).toBe('15');
    });
  });

  // ── handleSearchChange ──────────────────────────────────────────────────────

  describe('handleSearchChange', () => {
    it('filters the current page client-side without re-calling loadFn', async () => {
      const loadFn = jest
        .fn()
        .mockResolvedValue({ items: [...PAGE_1], nextPageToken: 'tok2' });
      const opts = makeOptions({ loadFn });
      const { result } = renderHook(() =>
        usePaginatedCrudTab<Item, Form>(opts),
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      const callsBefore = (loadFn as jest.Mock).mock.calls.length;

      act(() => result.current.handleSearchChange('alpha'));

      // loadFn must NOT have been called again
      expect((loadFn as jest.Mock).mock.calls).toHaveLength(callsBefore);

      // Only "Alpha" should pass the filter
      expect(result.current.filtered).toHaveLength(1);
      expect(result.current.filtered[0].name).toBe('Alpha');
    });

    it('leaves the cursor token stack untouched', async () => {
      const loadFn = jest
        .fn()
        .mockResolvedValueOnce({ items: [...PAGE_1], nextPageToken: 'tok2' })
        .mockResolvedValueOnce({ items: [...PAGE_2], nextPageToken: '' });

      const opts = makeOptions({ loadFn });
      const { result } = renderHook(() =>
        usePaginatedCrudTab<Item, Form>(opts),
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      // advance to page 2 so token stack is non-empty
      act(() => result.current.goNext());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.cursorPagination.hasPrev).toBe(true);

      act(() => result.current.handleSearchChange('gamma'));

      // hasPrev (token stack) must be unchanged
      expect(result.current.cursorPagination.hasPrev).toBe(true);
    });
  });
});
