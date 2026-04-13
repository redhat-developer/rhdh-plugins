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
import type {
  PromptGroup,
  PromptCard,
  Workflow,
  QuickAction,
} from '../../types';

interface BuildPromptGroupsInput {
  readonly configPromptGroups?: readonly PromptGroup[];
  readonly workflows: readonly Workflow[];
  readonly quickActions: readonly QuickAction[];
  readonly fallbackColor: string;
}

/**
 * Resolves the effective prompt groups to display on the welcome screen.
 *
 * Priority:
 *  1. Config prompt groups with cards -> use directly (fully admin-driven)
 *  2. Fallback: group workflows/quickActions by category, apply config styling
 */
export function buildEffectivePromptGroups({
  configPromptGroups,
  workflows,
  quickActions,
  fallbackColor,
}: BuildPromptGroupsInput): PromptGroup[] {
  const configHasCards = configPromptGroups?.some(
    g => g.cards && g.cards.length > 0,
  );

  if (configHasCards && configPromptGroups) {
    return configPromptGroups
      .filter(g => g.cards && g.cards.length > 0)
      .map((g, i) => ({
        ...g,
        color: g.color || fallbackColor,
        order: g.order ?? i + 1,
      }))
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }

  const categoryMap = new Map<string, PromptCard[]>();

  for (const w of workflows) {
    const cat = w.category || 'General';
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push({
      title: w.name,
      description: w.description,
      prompt: w.steps[0]?.prompt || '',
      icon: w.icon,
      comingSoon: w.comingSoon,
      comingSoonLabel: w.comingSoonLabel,
    });
  }

  for (const a of quickActions) {
    const cat = a.category || 'General';
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push({
      title: a.title,
      description: a.description,
      prompt: a.prompt,
      icon: a.icon,
      comingSoon: a.comingSoon,
      comingSoonLabel: a.comingSoonLabel,
    });
  }

  const groups: PromptGroup[] = [];
  let orderIndex = 1;

  categoryMap.forEach((cards, category) => {
    const categoryId = category.toLowerCase().replaceAll(/\s+/g, '-');
    const configGroup = configPromptGroups?.find(
      g =>
        g.id === categoryId || g.title.toLowerCase() === category.toLowerCase(),
    );

    groups.push({
      id: configGroup?.id || categoryId,
      title: configGroup?.title || category,
      description: configGroup?.description || '',
      icon: configGroup?.icon || 'build',
      color: configGroup?.color || fallbackColor,
      order:
        configGroup?.order ?? (configGroup ? orderIndex++ : 999 + orderIndex++),
      cards,
    });
  });

  return groups.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}
