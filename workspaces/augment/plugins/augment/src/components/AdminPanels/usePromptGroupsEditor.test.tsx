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

import { renderHook, act, waitFor } from '@testing-library/react';
import { usePromptGroupsEditor } from './usePromptGroupsEditor';
import { createApiTestWrapper, createAdminMockApi } from '../../test-utils';
import type { PromptGroup } from '../../types';

describe('usePromptGroupsEditor', () => {
  const createWrapper = (api: ReturnType<typeof createAdminMockApi>) => {
    return createApiTestWrapper(api);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts with empty groups when no config', async () => {
      const api = createAdminMockApi();
      (api.getAdminConfig as jest.Mock).mockResolvedValue({
        entry: null,
        source: 'default',
      });
      (api.getPromptGroups as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => usePromptGroupsEditor(), {
        wrapper: createWrapper(api),
      });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      expect(result.current.groups).toEqual([]);
      expect(result.current.dirty).toBe(false);
    });

    it('loads groups from config entry when available', async () => {
      const groups: PromptGroup[] = [
        {
          id: 'group-1',
          title: 'Test Group',
          cards: [{ title: 'Card 1', prompt: 'Prompt 1' }],
          order: 1,
        },
      ];

      const api = createAdminMockApi();
      (api.getAdminConfig as jest.Mock).mockResolvedValue({
        entry: {
          configKey: 'promptGroups',
          configValue: groups,
          updatedAt: '2025-01-01T00:00:00Z',
          updatedBy: 'user:default/admin',
        },
        source: 'database',
      });
      (api.getPromptGroups as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => usePromptGroupsEditor(), {
        wrapper: createWrapper(api),
      });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      expect(result.current.groups).toHaveLength(1);
      expect(result.current.groups[0].title).toBe('Test Group');
      expect(result.current.groups[0].cards).toHaveLength(1);
      expect(result.current.groups[0].cards[0].title).toBe('Card 1');
      expect(result.current.groups[0].cards[0].prompt).toBe('Prompt 1');
    });
  });

  describe('addGroup', () => {
    it('creates a new group', async () => {
      const api = createAdminMockApi();
      (api.getAdminConfig as jest.Mock).mockResolvedValue({
        entry: null,
        source: 'default',
      });
      (api.getPromptGroups as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => usePromptGroupsEditor(), {
        wrapper: createWrapper(api),
      });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      act(() => {
        result.current.addGroup();
      });

      expect(result.current.groups).toHaveLength(1);
      expect(result.current.groups[0].title).toBe('');
      expect(result.current.groups[0].cards).toHaveLength(1);
      expect(result.current.groups[0].cards[0].title).toBe('');
      expect(result.current.groups[0].cards[0].prompt).toBe('');
    });
  });

  describe('removeGroup', () => {
    it('removes a group', async () => {
      const groups: PromptGroup[] = [
        {
          id: 'group-1',
          title: 'Group 1',
          cards: [],
          order: 1,
        },
        {
          id: 'group-2',
          title: 'Group 2',
          cards: [],
          order: 2,
        },
      ];

      const api = createAdminMockApi();
      (api.getAdminConfig as jest.Mock).mockResolvedValue({
        entry: {
          configKey: 'promptGroups',
          configValue: groups,
          updatedAt: '2025-01-01T00:00:00Z',
          updatedBy: 'user:default/admin',
        },
        source: 'database',
      });
      (api.getPromptGroups as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => usePromptGroupsEditor(), {
        wrapper: createWrapper(api),
      });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      const groupKey = result.current.groups[0]._key;

      act(() => {
        result.current.removeGroup(groupKey);
      });

      expect(result.current.groups).toHaveLength(1);
      expect(result.current.groups[0].title).toBe('Group 2');
    });
  });

  describe('updateGroup', () => {
    it('updates group properties', async () => {
      const groups: PromptGroup[] = [
        {
          id: 'group-1',
          title: 'Original',
          cards: [],
          order: 1,
        },
      ];

      const api = createAdminMockApi();
      (api.getAdminConfig as jest.Mock).mockResolvedValue({
        entry: {
          configKey: 'promptGroups',
          configValue: groups,
          updatedAt: '2025-01-01T00:00:00Z',
          updatedBy: 'user:default/admin',
        },
        source: 'database',
      });
      (api.getPromptGroups as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => usePromptGroupsEditor(), {
        wrapper: createWrapper(api),
      });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      const groupKey = result.current.groups[0]._key;

      act(() => {
        result.current.updateGroup(groupKey, {
          title: 'Updated Title',
          description: 'Updated Description',
        });
      });

      expect(result.current.groups[0].title).toBe('Updated Title');
      expect(result.current.groups[0].description).toBe('Updated Description');
    });
  });

  describe('addCard / removeCard / updateCard', () => {
    it('addCard adds a card to a group', async () => {
      const groups: PromptGroup[] = [
        {
          id: 'group-1',
          title: 'Group',
          cards: [{ title: 'Card 1', prompt: 'P1' }],
          order: 1,
        },
      ];

      const api = createAdminMockApi();
      (api.getAdminConfig as jest.Mock).mockResolvedValue({
        entry: {
          configKey: 'promptGroups',
          configValue: groups,
          updatedAt: '2025-01-01T00:00:00Z',
          updatedBy: 'user:default/admin',
        },
        source: 'database',
      });
      (api.getPromptGroups as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => usePromptGroupsEditor(), {
        wrapper: createWrapper(api),
      });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      const groupKey = result.current.groups[0]._key;

      act(() => {
        result.current.addCard(groupKey);
      });

      expect(result.current.groups[0].cards).toHaveLength(2);
      expect(result.current.groups[0].cards[1].title).toBe('');
      expect(result.current.groups[0].cards[1].prompt).toBe('');
    });

    it('removeCard removes a card from a group', async () => {
      const groups: PromptGroup[] = [
        {
          id: 'group-1',
          title: 'Group',
          cards: [
            { title: 'Card 1', prompt: 'P1' },
            { title: 'Card 2', prompt: 'P2' },
          ],
          order: 1,
        },
      ];

      const api = createAdminMockApi();
      (api.getAdminConfig as jest.Mock).mockResolvedValue({
        entry: {
          configKey: 'promptGroups',
          configValue: groups,
          updatedAt: '2025-01-01T00:00:00Z',
          updatedBy: 'user:default/admin',
        },
        source: 'database',
      });
      (api.getPromptGroups as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => usePromptGroupsEditor(), {
        wrapper: createWrapper(api),
      });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      const groupKey = result.current.groups[0]._key;
      const cardKey = result.current.groups[0].cards[1]._key;

      act(() => {
        result.current.removeCard(groupKey, cardKey);
      });

      expect(result.current.groups[0].cards).toHaveLength(1);
      expect(result.current.groups[0].cards[0].title).toBe('Card 1');
    });

    it('updateCard updates card properties', async () => {
      const groups: PromptGroup[] = [
        {
          id: 'group-1',
          title: 'Group',
          cards: [{ title: 'Card 1', prompt: 'P1' }],
          order: 1,
        },
      ];

      const api = createAdminMockApi();
      (api.getAdminConfig as jest.Mock).mockResolvedValue({
        entry: {
          configKey: 'promptGroups',
          configValue: groups,
          updatedAt: '2025-01-01T00:00:00Z',
          updatedBy: 'user:default/admin',
        },
        source: 'database',
      });
      (api.getPromptGroups as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => usePromptGroupsEditor(), {
        wrapper: createWrapper(api),
      });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      const groupKey = result.current.groups[0]._key;
      const cardKey = result.current.groups[0].cards[0]._key;

      act(() => {
        result.current.updateCard(groupKey, cardKey, {
          title: 'Updated Card',
          prompt: 'Updated Prompt',
        });
      });

      expect(result.current.groups[0].cards[0].title).toBe('Updated Card');
      expect(result.current.groups[0].cards[0].prompt).toBe('Updated Prompt');
    });
  });

  describe('validation', () => {
    it('handleSave with empty group title shows toast', async () => {
      const api = createAdminMockApi();
      (api.getAdminConfig as jest.Mock).mockResolvedValue({
        entry: null,
        source: 'default',
      });
      (api.getPromptGroups as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => usePromptGroupsEditor(), {
        wrapper: createWrapper(api),
      });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      act(() => {
        result.current.addGroup();
      });

      await act(async () => {
        await result.current.handleSave();
      });

      expect(result.current.toast).toBe(
        'Please fix validation errors before saving',
      );
      expect(result.current.validationErrors.groups.size).toBeGreaterThan(0);
    });

    it('handleSave with card missing prompt shows toast', async () => {
      const groups: PromptGroup[] = [
        {
          id: 'group-1',
          title: 'Group',
          cards: [{ title: 'Card 1', prompt: '' }],
          order: 1,
        },
      ];

      const api = createAdminMockApi();
      (api.getAdminConfig as jest.Mock).mockResolvedValue({
        entry: {
          configKey: 'promptGroups',
          configValue: groups,
          updatedAt: '2025-01-01T00:00:00Z',
          updatedBy: 'user:default/admin',
        },
        source: 'database',
      });
      (api.getPromptGroups as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => usePromptGroupsEditor(), {
        wrapper: createWrapper(api),
      });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      await act(async () => {
        await result.current.handleSave();
      });

      expect(result.current.toast).toBe(
        'Please fix validation errors before saving',
      );
      expect(result.current.validationErrors.cards.size).toBeGreaterThan(0);
    });

    it('handleSave with no groups shows toast', async () => {
      const api = createAdminMockApi();
      (api.getAdminConfig as jest.Mock).mockResolvedValue({
        entry: null,
        source: 'default',
      });
      (api.getPromptGroups as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => usePromptGroupsEditor(), {
        wrapper: createWrapper(api),
      });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      act(() => {
        result.current.addGroup();
      });

      await act(async () => {
        await result.current.handleSave();
      });

      expect(result.current.toast).toBe(
        'Please fix validation errors before saving',
      );
    });
  });

  describe('handleSave success', () => {
    it('saves valid groups and shows success toast', async () => {
      const groups: PromptGroup[] = [
        {
          id: 'group-1',
          title: 'Group',
          cards: [{ title: 'Card 1', prompt: 'Prompt 1' }],
          order: 1,
        },
      ];

      const api = createAdminMockApi();
      (api.getAdminConfig as jest.Mock).mockResolvedValue({
        entry: {
          configKey: 'promptGroups',
          configValue: groups,
          updatedAt: '2025-01-01T00:00:00Z',
          updatedBy: 'user:default/admin',
        },
        source: 'database',
      });
      (api.getPromptGroups as jest.Mock).mockResolvedValue([]);
      (api.setAdminConfig as jest.Mock).mockResolvedValue({
        warnings: undefined,
      });

      const { result } = renderHook(() => usePromptGroupsEditor(), {
        wrapper: createWrapper(api),
      });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      await act(async () => {
        await result.current.handleSave();
      });

      expect(result.current.toast).toBe('Prompt groups saved successfully');
      expect(api.setAdminConfig).toHaveBeenCalledWith(
        'promptGroups',
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Group',
            cards: expect.arrayContaining([
              expect.objectContaining({ title: 'Card 1', prompt: 'Prompt 1' }),
            ]),
          }),
        ]),
      );
    });
  });

  describe('dirty tracking', () => {
    it('is clean when no changes made', async () => {
      const groups: PromptGroup[] = [
        {
          id: 'group-1',
          title: 'Group',
          cards: [{ title: 'Card 1', prompt: 'P1' }],
          order: 1,
        },
      ];

      const api = createAdminMockApi();
      (api.getAdminConfig as jest.Mock).mockResolvedValue({
        entry: {
          configKey: 'promptGroups',
          configValue: groups,
          updatedAt: '2025-01-01T00:00:00Z',
          updatedBy: 'user:default/admin',
        },
        source: 'database',
      });
      (api.getPromptGroups as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => usePromptGroupsEditor(), {
        wrapper: createWrapper(api),
      });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      expect(result.current.dirty).toBe(false);
    });

    it('is dirty after modifying a group', async () => {
      const groups: PromptGroup[] = [
        {
          id: 'group-1',
          title: 'Group',
          cards: [{ title: 'Card 1', prompt: 'P1' }],
          order: 1,
        },
      ];

      const api = createAdminMockApi();
      (api.getAdminConfig as jest.Mock).mockResolvedValue({
        entry: {
          configKey: 'promptGroups',
          configValue: groups,
          updatedAt: '2025-01-01T00:00:00Z',
          updatedBy: 'user:default/admin',
        },
        source: 'database',
      });
      (api.getPromptGroups as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => usePromptGroupsEditor(), {
        wrapper: createWrapper(api),
      });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      const groupKey = result.current.groups[0]._key;

      act(() => {
        result.current.updateGroup(groupKey, { title: 'Modified' });
      });

      expect(result.current.dirty).toBe(true);
    });
  });

  describe('dismissToast', () => {
    it('clears toast', async () => {
      const api = createAdminMockApi();
      (api.getAdminConfig as jest.Mock).mockResolvedValue({
        entry: null,
        source: 'default',
      });
      (api.getPromptGroups as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => usePromptGroupsEditor(), {
        wrapper: createWrapper(api),
      });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      act(() => {
        result.current.addGroup();
      });

      await act(async () => {
        await result.current.handleSave();
      });

      expect(result.current.toast).not.toBeNull();

      act(() => {
        result.current.dismissToast();
      });

      expect(result.current.toast).toBeNull();
    });
  });
});
