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
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { augmentApiRef } from '../../api';
import { useAdminConfig } from '../../hooks';
import type { PromptGroup, PromptCard } from '../../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Card with a stable React key for list identity. */
export interface EditableCard extends PromptCard {
  readonly _key: string;
}

/** Group with a stable React key for list identity. */
export interface EditableGroup extends Omit<PromptGroup, 'cards'> {
  readonly _key: string;
  cards: EditableCard[];
}

/** Per-field validation errors keyed by path. */
export interface ValidationErrors {
  readonly groups: ReadonlyMap<string, string>;
  readonly cards: ReadonlyMap<string, string>;
}

const EMPTY_VALIDATION: ValidationErrors = {
  groups: new Map(),
  cards: new Map(),
};

// ---------------------------------------------------------------------------
// Stable key generator (avoids Date.now() collisions)
// ---------------------------------------------------------------------------

let nextId = 0;
function stableKey(prefix: string): string {
  nextId += 1;
  return `${prefix}-${nextId}`;
}

// ---------------------------------------------------------------------------
// Data transforms
// ---------------------------------------------------------------------------

function tagCard(c: PromptCard): EditableCard {
  return { ...c, _key: stableKey('card') };
}

function tagGroup(g: PromptGroup): EditableGroup {
  return { ...g, _key: stableKey('group'), cards: g.cards.map(tagCard) };
}

function toEditable(data: readonly PromptGroup[]): EditableGroup[] {
  return data.map(tagGroup);
}

function stripCard({ _key, ...rest }: EditableCard): PromptCard {
  return rest;
}

function toCleanGroups(groups: readonly EditableGroup[]): PromptGroup[] {
  return groups
    .filter(g => g.title.trim())
    .map(({ _key, ...rest }, i) => ({
      ...rest,
      id: rest.id || `group-${i}`,
      order: i + 1,
      cards: rest.cards
        .filter(c => c.title.trim() && c.prompt.trim())
        .map(stripCard),
    }));
}

function groupsEqual(
  a: readonly PromptGroup[],
  b: readonly PromptGroup[],
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const ga = a[i];
    const gb = b[i];
    if (
      ga.title !== gb.title ||
      ga.icon !== gb.icon ||
      ga.color !== gb.color ||
      ga.description !== gb.description ||
      ga.cards.length !== gb.cards.length
    ) {
      return false;
    }
    for (let j = 0; j < ga.cards.length; j++) {
      const ca = ga.cards[j];
      const cb = gb.cards[j];
      if (
        ca.title !== cb.title ||
        ca.prompt !== cb.prompt ||
        ca.description !== cb.description ||
        ca.icon !== cb.icon
      ) {
        return false;
      }
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate(groups: readonly EditableGroup[]): ValidationErrors {
  const groupErrors = new Map<string, string>();
  const cardErrors = new Map<string, string>();

  for (const group of groups) {
    if (!group.title.trim()) {
      groupErrors.set(`${group._key}:title`, 'Group title is required');
    }
    const filledCards = group.cards.filter(
      c => c.title.trim() || c.prompt.trim(),
    );
    if (filledCards.length === 0 && group.title.trim()) {
      groupErrors.set(`${group._key}:cards`, 'At least one card is required');
    }
    for (const card of group.cards) {
      if (card.title.trim() && !card.prompt.trim()) {
        cardErrors.set(`${card._key}:prompt`, 'Prompt is required');
      }
      if (!card.title.trim() && card.prompt.trim()) {
        cardErrors.set(`${card._key}:title`, 'Title is required');
      }
    }
  }

  if (groupErrors.size === 0 && cardErrors.size === 0) {
    return EMPTY_VALIDATION;
  }
  return { groups: groupErrors, cards: cardErrors };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePromptGroupsEditor() {
  const api = useApi(augmentApiRef);
  const { entry, source, loading, saving, error, save, reset } =
    useAdminConfig('promptGroups');

  const [groups, setGroups] = useState<EditableGroup[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] =
    useState<ValidationErrors>(EMPTY_VALIDATION);
  const baselineRef = useRef<PromptGroup[]>([]);

  // Single initialization effect: DB entry takes priority, then YAML fallback
  useEffect(() => {
    if (loading || initialized) return undefined;

    if (entry) {
      const data = entry.configValue as PromptGroup[];
      if (Array.isArray(data)) {
        setGroups(toEditable(data));
        baselineRef.current = data;
      }
      setInitialized(true);
      return undefined;
    }

    let cancelled = false;
    api
      .getPromptGroups()
      .then(yamlGroups => {
        if (cancelled) return;
        baselineRef.current = yamlGroups;
        setGroups(yamlGroups.length > 0 ? toEditable(yamlGroups) : []);
        setInitialized(true);
      })
      .catch(() => {
        if (!cancelled) setInitialized(true);
      });

    return () => {
      cancelled = true;
    };
  }, [loading, initialized, entry, api]);

  const handleSave = useCallback(async () => {
    const errors = validate(groups);
    setValidationErrors(errors);
    if (errors.groups.size > 0 || errors.cards.size > 0) {
      setToast('Please fix validation errors before saving');
      return;
    }

    const cleanGroups = toCleanGroups(groups);
    if (cleanGroups.length === 0) {
      setToast('At least one group with a title is required');
      return;
    }

    try {
      await save(cleanGroups);
    } catch {
      return;
    }
    baselineRef.current = cleanGroups;
    setToast('Prompt groups saved successfully');
  }, [groups, save]);

  const handleReset = useCallback(async () => {
    try {
      await reset();
    } catch {
      return;
    }
    const yamlGroups = await api.getPromptGroups();
    baselineRef.current = yamlGroups;
    setGroups(yamlGroups.length > 0 ? toEditable(yamlGroups) : []);
    setValidationErrors(EMPTY_VALIDATION);
    setToast('Reset to YAML defaults');
  }, [reset, api]);

  const updateGroup = useCallback(
    (
      groupKey: string,
      updates: Partial<Omit<EditableGroup, '_key' | 'cards'>>,
    ) => {
      setGroups(prev =>
        prev.map(g => (g._key === groupKey ? { ...g, ...updates } : g)),
      );
      setValidationErrors(EMPTY_VALIDATION);
    },
    [],
  );

  const updateCard = useCallback(
    (
      groupKey: string,
      cardKey: string,
      updates: Partial<Omit<EditableCard, '_key'>>,
    ) => {
      setGroups(prev =>
        prev.map(g => {
          if (g._key !== groupKey) return g;
          return {
            ...g,
            cards: g.cards.map(c =>
              c._key === cardKey ? { ...c, ...updates } : c,
            ),
          };
        }),
      );
      setValidationErrors(EMPTY_VALIDATION);
    },
    [],
  );

  const addCard = useCallback((groupKey: string) => {
    const card = tagCard({ title: '', prompt: '', description: '' });
    setGroups(prev =>
      prev.map(g =>
        g._key === groupKey ? { ...g, cards: [...g.cards, card] } : g,
      ),
    );
  }, []);

  const removeCard = useCallback((groupKey: string, cardKey: string) => {
    setGroups(prev =>
      prev.map(g => {
        if (g._key !== groupKey) return g;
        return { ...g, cards: g.cards.filter(c => c._key !== cardKey) };
      }),
    );
  }, []);

  const addGroup = useCallback(() => {
    const group = tagGroup({
      id: stableKey('group'),
      title: '',
      cards: [{ title: '', prompt: '', description: '' }],
      order: 0,
    });
    setGroups(prev => [...prev, group]);
  }, []);

  const removeGroup = useCallback((groupKey: string) => {
    setGroups(prev => prev.filter(g => g._key !== groupKey));
  }, []);

  const moveGroup = useCallback((fromIndex: number, toIndex: number) => {
    setGroups(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const moveCard = useCallback(
    (groupKey: string, fromIndex: number, toIndex: number) => {
      setGroups(prev =>
        prev.map(g => {
          if (g._key !== groupKey) return g;
          const cards = [...g.cards];
          const [moved] = cards.splice(fromIndex, 1);
          cards.splice(toIndex, 0, moved);
          return { ...g, cards };
        }),
      );
    },
    [],
  );

  const dismissToast = useCallback(() => setToast(null), []);

  const previewGroups = useMemo(() => toCleanGroups(groups), [groups]);

  const dirty = useMemo(
    () => !groupsEqual(previewGroups, baselineRef.current),
    [previewGroups],
  );

  return useMemo(
    () => ({
      groups,
      previewGroups,
      initialized,
      dirty,
      loading,
      saving,
      error,
      source,
      toast,
      validationErrors,
      handleSave,
      handleReset,
      updateGroup,
      updateCard,
      addCard,
      removeCard,
      addGroup,
      removeGroup,
      moveGroup,
      moveCard,
      dismissToast,
    }),
    [
      groups,
      previewGroups,
      initialized,
      dirty,
      loading,
      saving,
      error,
      source,
      toast,
      validationErrors,
      handleSave,
      handleReset,
      updateGroup,
      updateCard,
      addCard,
      removeCard,
      addGroup,
      removeGroup,
      moveGroup,
      moveCard,
      dismissToast,
    ],
  );
}
