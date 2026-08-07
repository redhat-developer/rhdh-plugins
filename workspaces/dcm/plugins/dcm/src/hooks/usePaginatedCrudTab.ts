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

import { useCallback, useRef, useState } from 'react';
import {
  useCrudTab,
  type PagedLoadResult,
  type UseCrudTabOptions,
  type UseCrudTabResult,
} from './useCrudTab';
import { usePersistedPageSize } from './usePersistedPageSize';
import type { CursorPaginationControlsProps } from '../components/CursorPaginationControls';

/** Parameters injected into the load function on every page request. */
export interface PaginatedLoadParams {
  /** Opaque cursor for the current page, or undefined for the first page. */
  pageToken: string | undefined;
  /** Number of items to request per page. */
  pageSize: number;
}

/**
 * Options for {@link usePaginatedCrudTab}.
 *
 * Extends {@link UseCrudTabOptions} but replaces the no-arg `loadFn` with one
 * that receives `{ pageToken, pageSize }`, and makes `storageKey` required (the
 * hook always persists the page size).
 */
export interface UsePaginatedCrudTabOptions<
  T,
  F extends Record<string, unknown>,
> extends Omit<UseCrudTabOptions<T, F>, 'loadFn' | 'storageKey'> {
  /**
   * Fetches one page of items. Receives cursor params so the implementation
   * never needs to manage pagination refs directly. Return a plain array for
   * client-side pagination or a {@link PagedLoadResult} for server cursor mode.
   */
  loadFn: (params: PaginatedLoadParams) => Promise<T[] | PagedLoadResult<T>>;
  /**
   * `localStorage` key used to persist the selected page size (e.g.
   * `'providers'`, `'policies'`).  Must be unique per table.
   */
  storageKey: string;
}

/** Alias kept for backwards compatibility — use {@link CursorPaginationControlsProps} directly when possible. */
export type CursorPaginationProps = CursorPaginationControlsProps;

/**
 * Result returned by {@link usePaginatedCrudTab}.
 *
 * Everything from {@link UseCrudTabResult} plus pre-built navigation helpers
 * and a `cursorPagination` object ready to be spread onto `DcmCrudTabLayout`.
 */
export interface UsePaginatedCrudTabResult<T, F extends Record<string, unknown>>
  extends UseCrudTabResult<T, F> {
  goNext: () => void;
  goPrev: () => void;
  /**
   * Drop-in replacement for `crud.setSearch`. Search is client-side filtering
   * on the loaded page; cursor state (Prev/Next) is unchanged.
   */
  handleSearchChange: (value: React.SetStateAction<string>) => void;
  /**
   * Changes the page size, resets cursor navigation to page 1, and reloads.
   * Updates `localStorage` via {@link usePersistedPageSize}.
   */
  handlePageSizeChange: (size: number) => void;
  /** Ready-made object for the `cursorPagination` prop of `DcmCrudTabLayout`. */
  cursorPagination: CursorPaginationProps;
}

/**
 * Wrapper around {@link useCrudTab} that adds server-side cursor pagination.
 *
 * Encapsulates the token-stack pattern so individual tab components no longer
 * need to manage `currentTokenRef`, `tokenStackRef`, `goNext`, `goPrev`, or
 * `handleSearchChange` themselves.
 *
 * @example
 * const crud = usePaginatedCrudTab<Provider, ProviderForm>({
 *   loadFn: ({ pageToken, pageSize }) =>
 *     providersApi.listProviders({ page_token: pageToken, max_page_size: pageSize })
 *       .then(r => ({ items: r.providers ?? [], nextPageToken: r.next_page_token })),
 *   storageKey: 'providers',
 *   createFn: form => providersApi.createProvider(form),
 *   ...
 * });
 *
 * // In JSX:
 * <DcmCrudTabLayout
 *   onSearchChange={crud.handleSearchChange}
 *   cursorPagination={crud.cursorPagination}
 *   ...
 * />
 */
export function usePaginatedCrudTab<T, F extends Record<string, unknown>>(
  options: UsePaginatedCrudTabOptions<T, F>,
): UsePaginatedCrudTabResult<T, F> {
  // Destructure storageKey so it is NOT forwarded to useCrudTab, which would
  // create a second usePersistedPageSize call on the same localStorage key.
  const { storageKey, ...crudOptions } = options;

  const [pageSize, setPageSize] = usePersistedPageSize(storageKey);
  const pageSizeRef = useRef(pageSize);
  pageSizeRef.current = pageSize;

  // Token for the CURRENT page. Updated via ref synchronously before reload.
  const currentTokenRef = useRef<string | undefined>(undefined);

  // Stack of tokens for previously-visited pages (enables Previous navigation).
  const [tokenStack, setTokenStack] = useState<string[]>([]);
  const tokenStackRef = useRef<string[]>([]);

  // Keep the latest options in a ref so the stable loadFn wrapper always
  // calls the freshest implementation without needing it in its dep array.
  const optsRef = useRef(options);
  optsRef.current = options;

  const crud = useCrudTab<T, F>({
    ...crudOptions,
    loadFn: () =>
      optsRef.current.loadFn({
        pageToken: currentTokenRef.current,
        pageSize: pageSizeRef.current,
      }),
  });

  const { nextPageToken, reload: crudReload, setSearch: setCrudSearch } = crud;

  // ── Cursor navigation ────────────────────────────────────────────────────

  const goNext = useCallback(() => {
    const tokenToPush = currentTokenRef.current ?? '';
    currentTokenRef.current = nextPageToken || undefined;
    tokenStackRef.current = [...tokenStackRef.current, tokenToPush];
    setTokenStack(tokenStackRef.current);
    crudReload();
  }, [nextPageToken, crudReload]);

  const goPrev = useCallback(() => {
    const stack = tokenStackRef.current;
    const prevToken = stack.at(-1);
    currentTokenRef.current = prevToken || undefined;
    tokenStackRef.current = stack.slice(0, -1);
    setTokenStack(tokenStackRef.current);
    crudReload();
  }, [crudReload]);

  // When the page size changes, update the ref immediately (so the next reload
  // uses the new size without waiting for a re-render), reset the cursor to the
  // first page, and trigger a reload.
  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      pageSizeRef.current = newSize;
      setPageSize(newSize);
      currentTokenRef.current = undefined;
      tokenStackRef.current = [];
      setTokenStack([]);
      crudReload();
    },
    [setPageSize, crudReload],
  );

  // Search is client-side filtering on the already-loaded page; cursor state
  // (Prev/Next) stays tied to the server page that was fetched.
  const handleSearchChange = useCallback(
    (value: React.SetStateAction<string>) => {
      setCrudSearch(value);
    },
    [setCrudSearch],
  );

  return {
    ...crud,
    goNext,
    goPrev,
    handleSearchChange,
    handlePageSizeChange,
    cursorPagination: {
      hasNext: Boolean(nextPageToken),
      hasPrev: tokenStack.length > 0,
      onNext: goNext,
      onPrev: goPrev,
      loading: crud.loading || crud.refreshing,
      pageSize,
      onPageSizeChange: handlePageSizeChange,
    },
  };
}
