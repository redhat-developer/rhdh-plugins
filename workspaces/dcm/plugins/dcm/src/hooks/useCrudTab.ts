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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { extractApiError } from '@red-hat-developer-hub/backstage-plugin-dcm-common';

// Module-level state-updater factories — defined outside the hook so they do
// not contribute to lexical function-nesting depth (typescript:S2004).

function appendItem<T>(item: T): (prev: T[]) => T[] {
  return prev => [...prev, item];
}

function replaceItemById<T>(
  id: string,
  updated: T,
  getId: (item: T) => string,
): (prev: T[]) => T[] {
  return prev => prev.map(item => (getId(item) === id ? updated : item));
}

function removeItemById<T>(
  id: string,
  getId: (item: T) => string,
): (prev: T[]) => T[] {
  return prev => prev.filter(item => getId(item) !== id);
}

/**
 * Configuration for the useCrudTab hook.
 *
 * @template T - The domain entity type (e.g. Provider, Policy)
 * @template F - The form state type (e.g. ProviderForm)
 */
export interface UseCrudTabOptions<T, F extends Record<string, unknown>> {
  /** Fetches all items from the API. May also set secondary state as a side effect. */
  loadFn: () => Promise<T[]>;
  /**
   * Creates a new item. Receives the raw form so the caller can apply any
   * transformation or pass extra params (e.g. a client-assigned ID).
   * Optional — if omitted the create dialog handlers are no-ops.
   */
  createFn?: (form: F) => Promise<T>;
  /**
   * Updates an existing item.
   * Optional — if omitted the edit dialog handlers are no-ops.
   */
  updateFn?: (id: string, form: F) => Promise<T>;
  /**
   * Deletes an item by its id.
   * Optional — if omitted the delete dialog handlers are no-ops.
   */
  deleteFn?: (id: string) => Promise<void>;
  /** Extracts the stable string identifier from an item. */
  getId: (item: T) => string;
  /**
   * Returns an array of strings to match against the search query.
   * Null/undefined values are safely skipped.
   */
  getSearchText: (item: T) => (string | null | undefined)[];
  /** Factory for a blank form (called when opening the create dialog). */
  emptyForm: () => F;
  /**
   * Returns true when the form is valid and the primary action should be
   * enabled. Evaluated on every render.
   */
  isValid: (form: F) => boolean;
  /**
   * Converts an existing item into a form for pre-populating the edit dialog.
   * Required when updateFn is provided.
   */
  itemToForm?: (item: T) => F;
}

type TouchedMap<F> = Partial<Record<keyof F, boolean>>;

export interface UseCrudTabResult<T, F extends Record<string, unknown>> {
  // ── List ──────────────────────────────────────────────────────────────────
  items: T[];
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  loading: boolean;
  loadError: string | null;
  reload: () => void;

  // ── Search + pagination ────────────────────────────────────────────────────
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  page: number;
  pageSize: number;
  filtered: T[];
  paginated: T[];
  onPageChange: (p: number, ps: number) => void;
  onRowsPerPageChange: (ps: number) => void;

  // ── Create dialog ──────────────────────────────────────────────────────────
  createOpen: boolean;
  createForm: F;
  setCreateForm: React.Dispatch<React.SetStateAction<F>>;
  createTouched: TouchedMap<F>;
  setCreateTouched: React.Dispatch<React.SetStateAction<TouchedMap<F>>>;
  createSubmitting: boolean;
  createError: string | null;
  handleOpenCreate: () => void;
  handleCloseCreate: () => void;
  handleCreateSubmit: () => void;

  // ── Edit dialog ────────────────────────────────────────────────────────────
  editOpen: boolean;
  editForm: F;
  setEditForm: React.Dispatch<React.SetStateAction<F>>;
  editTouched: TouchedMap<F>;
  setEditTouched: React.Dispatch<React.SetStateAction<TouchedMap<F>>>;
  editSubmitting: boolean;
  editError: string | null;
  handleOpenEdit: (item: T) => void;
  handleCloseEdit: () => void;
  handleEditSubmit: () => void;

  // ── Delete dialog ──────────────────────────────────────────────────────────
  deleteOpen: boolean;
  deletingItem: T | null;
  deleteError: string | null;
  setDeleteError: React.Dispatch<React.SetStateAction<string | null>>;
  handleOpenDelete: (item: T) => void;
  handleCloseDelete: () => void;
  handleDeleteConfirm: () => void;
}

/**
 * Centralises the repeated state machine found in every DCM CRUD tab:
 * data loading with error surfacing, client-side search + pagination, and
 * create/edit/delete dialog state with async submit handling.
 *
 * All option callbacks (loadFn, createFn, etc.) are stored in a ref so they
 * may be defined inline in the component without triggering re-renders or
 * infinite loops.
 *
 * @example
 * const crud = useCrudTab<Provider, ProviderForm>({
 *   loadFn: () => providersApi.listProviders().then(r => r.providers ?? []),
 *   createFn: form => providersApi.createProvider(formToProvider(form)),
 *   updateFn: (id, form) => providersApi.applyProvider(id, formToProvider(form)),
 *   deleteFn: id => providersApi.deleteProvider(id),
 *   getId: p => p.id ?? p.name ?? '',
 *   getSearchText: p => [p.name, p.display_name, p.service_type, p.endpoint],
 *   emptyForm,
 *   isValid: isFormValid,
 *   itemToForm: providerToForm,
 * });
 */
export function useCrudTab<T, F extends Record<string, unknown>>(
  options: UseCrudTabOptions<T, F>,
): UseCrudTabResult<T, F> {
  // Keep all callbacks in a ref so our own stable callbacks can always see
  // the latest version without having them in their own dep arrays.
  const optsRef = useRef(options);
  useEffect(() => {
    optsRef.current = options;
  });

  // ── List ─────────────────────────────────────────────────────────────────
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Search + pagination ──────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  // ── Create dialog ────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<F>(() => options.emptyForm());
  const [createTouched, setCreateTouched] = useState<TouchedMap<F>>({});
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ── Edit dialog ──────────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<F>(() => options.emptyForm());
  const [editTouched, setEditTouched] = useState<TouchedMap<F>>({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ── Delete dialog ────────────────────────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<T | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Keep latest mutable values in refs so stable callbacks can read them.
  const createFormRef = useRef(createForm);
  createFormRef.current = createForm;
  const createSubmittingRef = useRef(createSubmitting);
  createSubmittingRef.current = createSubmitting;

  const editFormRef = useRef(editForm);
  editFormRef.current = editForm;
  const editingIdRef = useRef(editingId);
  editingIdRef.current = editingId;
  const editSubmittingRef = useRef(editSubmitting);
  editSubmittingRef.current = editSubmitting;

  const deletingItemRef = useRef(deletingItem);
  deletingItemRef.current = deletingItem;

  // ── Load ─────────────────────────────────────────────────────────────────
  const reload = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    optsRef.current
      .loadFn()
      .then(setItems)
      .catch(err => {
        setLoadError(extractApiError(err));
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []); // stable — reads via ref

  useEffect(() => {
    reload();
  }, [reload]);

  // ── Search + pagination ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(item =>
      optsRef.current
        .getSearchText(item)
        .some(text => (text ?? '').toLowerCase().includes(q)),
    );
  }, [items, search]);

  const paginated = useMemo(() => {
    const start = page * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const onPageChange = useCallback((p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  const onRowsPerPageChange = useCallback((ps: number) => {
    setPageSize(ps);
    setPage(0);
  }, []);

  // ── Create ───────────────────────────────────────────────────────────────
  const handleOpenCreate = useCallback(() => {
    const empty = optsRef.current.emptyForm();
    setCreateForm(empty);
    setCreateTouched({});
    setCreateError(null);
    setCreateOpen(true);
  }, []);

  const handleCloseCreate = useCallback(() => {
    if (createSubmittingRef.current) return;
    setCreateOpen(false);
    setCreateForm(optsRef.current.emptyForm());
    setCreateTouched({});
    setCreateError(null);
  }, []);

  const handleCreateSubmit = useCallback(() => {
    const { createFn, isValid: iv, emptyForm: ef } = optsRef.current;
    const form = createFormRef.current;
    if (!createFn || !iv(form)) return;
    setCreateSubmitting(true);
    setCreateError(null);
    createFn(form)
      .then(created => {
        setItems(appendItem(created));
        setCreateOpen(false);
        setCreateForm(ef());
        setCreateTouched({});
      })
      .catch(err => setCreateError(extractApiError(err)))
      .finally(() => setCreateSubmitting(false));
  }, []);

  // ── Edit ─────────────────────────────────────────────────────────────────
  const handleOpenEdit = useCallback((item: T) => {
    const { getId: gId, itemToForm: itf, emptyForm: ef } = optsRef.current;
    setEditingId(gId(item));
    setEditForm(itf ? itf(item) : ef());
    setEditTouched({});
    setEditError(null);
    setEditOpen(true);
  }, []);

  const handleCloseEdit = useCallback(() => {
    if (editSubmittingRef.current) return;
    setEditOpen(false);
    setEditingId(null);
    setEditTouched({});
    setEditError(null);
  }, []);

  const handleEditSubmit = useCallback(() => {
    const { updateFn, isValid: iv, getId: gId } = optsRef.current;
    const form = editFormRef.current;
    const id = editingIdRef.current;
    if (!updateFn || !id || !iv(form)) return;
    setEditSubmitting(true);
    setEditError(null);
    updateFn(id, form)
      .then(updated => {
        setItems(replaceItemById(id, updated, gId));
        setEditOpen(false);
        setEditingId(null);
        setEditTouched({});
      })
      .catch(err => setEditError(extractApiError(err)))
      .finally(() => setEditSubmitting(false));
  }, []);

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleOpenDelete = useCallback((item: T) => {
    setDeletingItem(item);
    setDeleteError(null);
    setDeleteOpen(true);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setDeleteOpen(false);
    setDeletingItem(null);
    setDeleteError(null);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    const { deleteFn, getId: gId } = optsRef.current;
    const item = deletingItemRef.current;
    if (!deleteFn || !item) return;
    const id = gId(item);
    deleteFn(id)
      .then(() => {
        setItems(removeItemById(id, gId));
        setDeleteOpen(false);
        setDeletingItem(null);
      })
      .catch(err => {
        setDeleteError(extractApiError(err));
        setDeleteOpen(false);
        setDeletingItem(null);
      });
  }, []);

  return {
    // List
    items,
    setItems,
    loading,
    loadError,
    reload,

    // Search + pagination
    search,
    setSearch,
    page,
    pageSize,
    filtered,
    paginated,
    onPageChange,
    onRowsPerPageChange,

    // Create
    createOpen,
    createForm,
    setCreateForm,
    createTouched,
    setCreateTouched,
    createSubmitting,
    createError,
    handleOpenCreate,
    handleCloseCreate,
    handleCreateSubmit,

    // Edit
    editOpen,
    editForm,
    setEditForm,
    editTouched,
    setEditTouched,
    editSubmitting,
    editError,
    handleOpenEdit,
    handleCloseEdit,
    handleEditSubmit,

    // Delete
    deleteOpen,
    deletingItem,
    deleteError,
    setDeleteError,
    handleOpenDelete,
    handleCloseDelete,
    handleDeleteConfirm,
  };
}
