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
import { useCrudTab, UseCrudTabOptions } from './useCrudTab';

// ── Fixtures ──────────────────────────────────────────────────────────────────

type Item = { id: string; name: string };
type Form = { name: string; [key: string]: unknown };

const ITEMS: Item[] = [
  { id: '1', name: 'Alpha' },
  { id: '2', name: 'Beta' },
  { id: '3', name: 'Gamma' },
];

function makeOptions(
  overrides?: Partial<UseCrudTabOptions<Item, Form>>,
): UseCrudTabOptions<Item, Form> {
  return {
    loadFn: jest.fn().mockResolvedValue([...ITEMS]),
    createFn: jest
      .fn()
      .mockImplementation((form: Form) =>
        Promise.resolve({ id: '99', name: form.name } as Item),
      ),
    updateFn: jest
      .fn()
      .mockImplementation((id: string, form: Form) =>
        Promise.resolve({ id, name: form.name } as Item),
      ),
    deleteFn: jest.fn().mockResolvedValue(undefined),
    getId: (item: Item) => item.id,
    getSearchText: (item: Item) => [item.name],
    emptyForm: () => ({ name: '' } as Form),
    isValid: (form: Form) => Boolean(form.name?.trim()),
    itemToForm: (item: Item) => ({ name: item.name } as Form),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useCrudTab', () => {
  const render = () => renderHook(() => useCrudTab<Item, Form>(makeOptions()));

  describe('initial load', () => {
    it('starts in loading state', () => {
      const { result } = render();
      expect(result.current.loading).toBe(true);
    });

    it('populates items after load resolves', async () => {
      const { result } = render();
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.items).toHaveLength(3);
      expect(result.current.items[0].name).toBe('Alpha');
    });

    it('sets loadError and empties items when load fails', async () => {
      const opts = makeOptions({
        loadFn: jest.fn().mockRejectedValue(new Error('network error')),
      });
      const { result } = renderHook(() => useCrudTab<Item, Form>(opts));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.loadError).toBe('network error');
      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('search and pagination', () => {
    it('filters items by search text', async () => {
      const { result } = render();
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.setSearch('alpha'));
      expect(result.current.filtered).toHaveLength(1);
      expect(result.current.filtered[0].name).toBe('Alpha');
    });

    it('returns all items when search is empty', async () => {
      const { result } = render();
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.filtered).toHaveLength(3);
    });

    it('paginates filtered items', async () => {
      const { result } = render();
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.onPageChange(0, 2));
      expect(result.current.paginated).toHaveLength(2);
      expect(result.current.paginated[0].name).toBe('Alpha');
    });

    it('resets to page 0 when rows-per-page changes', async () => {
      const { result } = render();
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.onPageChange(1, 5));
      act(() => result.current.onRowsPerPageChange(10));
      expect(result.current.page).toBe(0);
    });
  });

  describe('create flow', () => {
    it('opens the create dialog with an empty form', async () => {
      const { result } = render();
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.handleOpenCreate());
      expect(result.current.createOpen).toBe(true);
      expect(result.current.createForm.name).toBe('');
    });

    it('appends the created item and closes the dialog on success', async () => {
      const { result } = render();
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.handleOpenCreate());
      act(() => result.current.setCreateForm({ name: 'Delta' } as Form));
      act(() => result.current.handleCreateSubmit());

      await waitFor(() => expect(result.current.createOpen).toBe(false));
      expect(result.current.items.find(i => i.name === 'Delta')).toBeDefined();
    });

    it('sets createError and keeps dialog open on failure', async () => {
      const opts = makeOptions({
        createFn: jest.fn().mockRejectedValue(new Error('create failed')),
      });
      const { result } = renderHook(() => useCrudTab<Item, Form>(opts));
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.handleOpenCreate());
      act(() => result.current.setCreateForm({ name: 'Delta' } as Form));
      act(() => result.current.handleCreateSubmit());

      await waitFor(() =>
        expect(result.current.createError).toBe('create failed'),
      );
      expect(result.current.createOpen).toBe(true);
    });

    it('does not call createFn when the form is invalid', async () => {
      const opts = makeOptions();
      const { result } = renderHook(() => useCrudTab<Item, Form>(opts));
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.handleOpenCreate());
      // form.name is '' → isValid returns false
      act(() => result.current.handleCreateSubmit());

      expect(opts.createFn).not.toHaveBeenCalled();
    });

    it('closes the dialog without calling createFn when not submitting', async () => {
      const { result } = render();
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.handleOpenCreate());
      act(() => result.current.handleCloseCreate());
      expect(result.current.createOpen).toBe(false);
    });
  });

  describe('edit flow', () => {
    it('opens the edit dialog pre-populated with the item form', async () => {
      const { result } = render();
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.handleOpenEdit(ITEMS[0]));
      expect(result.current.editOpen).toBe(true);
      expect(result.current.editForm.name).toBe('Alpha');
    });

    it('updates the item in the list on successful edit', async () => {
      const { result } = render();
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.handleOpenEdit(ITEMS[0]));
      act(() => result.current.setEditForm({ name: 'Alpha Updated' } as Form));
      act(() => result.current.handleEditSubmit());

      await waitFor(() => expect(result.current.editOpen).toBe(false));
      const updated = result.current.items.find(i => i.id === '1');
      expect(updated?.name).toBe('Alpha Updated');
    });

    it('sets editError on failure', async () => {
      const opts = makeOptions({
        updateFn: jest.fn().mockRejectedValue(new Error('update failed')),
      });
      const { result } = renderHook(() => useCrudTab<Item, Form>(opts));
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.handleOpenEdit(ITEMS[0]));
      act(() => result.current.setEditForm({ name: 'Alpha Updated' } as Form));
      act(() => result.current.handleEditSubmit());

      await waitFor(() =>
        expect(result.current.editError).toBe('update failed'),
      );
    });
  });

  describe('delete flow', () => {
    it('opens the delete dialog with the selected item', async () => {
      const { result } = render();
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.handleOpenDelete(ITEMS[1]));
      expect(result.current.deleteOpen).toBe(true);
      expect(result.current.deletingItem?.id).toBe('2');
    });

    it('removes the item from the list on successful delete', async () => {
      const { result } = render();
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.handleOpenDelete(ITEMS[1]));
      act(() => result.current.handleDeleteConfirm());

      await waitFor(() => expect(result.current.deleteOpen).toBe(false));
      expect(result.current.items.find(i => i.id === '2')).toBeUndefined();
    });

    it('sets deleteError and closes dialog on failure', async () => {
      const opts = makeOptions({
        deleteFn: jest.fn().mockRejectedValue(new Error('delete failed')),
      });
      const { result } = renderHook(() => useCrudTab<Item, Form>(opts));
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.handleOpenDelete(ITEMS[0]));
      act(() => result.current.handleDeleteConfirm());

      await waitFor(() =>
        expect(result.current.deleteError).toBe('delete failed'),
      );
      expect(result.current.deleteOpen).toBe(false);
      // Item should NOT be removed from the list
      expect(result.current.items.find(i => i.id === '1')).toBeDefined();
    });

    it('closes without calling deleteFn when cancelled', async () => {
      const opts = makeOptions();
      const { result } = renderHook(() => useCrudTab<Item, Form>(opts));
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.handleOpenDelete(ITEMS[0]));
      act(() => result.current.handleCloseDelete());

      expect(result.current.deleteOpen).toBe(false);
      expect(opts.deleteFn).not.toHaveBeenCalled();
    });
  });

  describe('reload', () => {
    it('re-fetches items when reload is called', async () => {
      const loadFn = jest.fn().mockResolvedValue([...ITEMS]);
      const { result } = renderHook(() =>
        useCrudTab<Item, Form>(makeOptions({ loadFn })),
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(loadFn).toHaveBeenCalledTimes(1);
      act(() => result.current.reload());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(loadFn).toHaveBeenCalledTimes(2);
    });

    it('clears loadError on successful reload', async () => {
      let callCount = 0;
      const loadFn = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.reject(new Error('first fail'));
        return Promise.resolve([...ITEMS]);
      });
      const { result } = renderHook(() =>
        useCrudTab<Item, Form>(makeOptions({ loadFn })),
      );
      await waitFor(() => expect(result.current.loadError).toBe('first fail'));

      act(() => result.current.reload());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.loadError).toBeNull();
      expect(result.current.items).toHaveLength(3);
    });
  });
});
