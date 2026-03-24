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

import { buildEffectivePromptGroups } from './buildEffectivePromptGroups';
import type { PromptGroup, Workflow, QuickAction } from '../../types';

describe('buildEffectivePromptGroups', () => {
  const fallbackColor = '#1e40af';

  describe('config-driven prompt groups', () => {
    it('returns config groups when they have cards', () => {
      const configPromptGroups: PromptGroup[] = [
        {
          id: 'group-1',
          title: 'Getting Started',
          cards: [{ title: 'Hello', prompt: 'Say hello' }],
        },
      ];

      const result = buildEffectivePromptGroups({
        configPromptGroups,
        workflows: [],
        quickActions: [],
        fallbackColor,
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('group-1');
      expect(result[0].cards).toHaveLength(1);
    });

    it('applies fallback color when config group has no color', () => {
      const configPromptGroups: PromptGroup[] = [
        {
          id: 'group-1',
          title: 'Test',
          cards: [{ title: 'Card', prompt: 'Prompt' }],
        },
      ];

      const result = buildEffectivePromptGroups({
        configPromptGroups,
        workflows: [],
        quickActions: [],
        fallbackColor,
      });

      expect(result[0].color).toBe(fallbackColor);
    });

    it('preserves config color when provided', () => {
      const configPromptGroups: PromptGroup[] = [
        {
          id: 'group-1',
          title: 'Test',
          color: '#ff0000',
          cards: [{ title: 'Card', prompt: 'Prompt' }],
        },
      ];

      const result = buildEffectivePromptGroups({
        configPromptGroups,
        workflows: [],
        quickActions: [],
        fallbackColor,
      });

      expect(result[0].color).toBe('#ff0000');
    });

    it('filters out config groups with empty cards', () => {
      const configPromptGroups: PromptGroup[] = [
        {
          id: 'empty',
          title: 'Empty',
          cards: [],
        },
        {
          id: 'full',
          title: 'Full',
          cards: [{ title: 'Card', prompt: 'Prompt' }],
        },
      ];

      const result = buildEffectivePromptGroups({
        configPromptGroups,
        workflows: [],
        quickActions: [],
        fallbackColor,
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('full');
    });

    it('sorts config groups by order', () => {
      const configPromptGroups: PromptGroup[] = [
        {
          id: 'c',
          title: 'C',
          order: 3,
          cards: [{ title: 'Card', prompt: 'P' }],
        },
        {
          id: 'a',
          title: 'A',
          order: 1,
          cards: [{ title: 'Card', prompt: 'P' }],
        },
        {
          id: 'b',
          title: 'B',
          order: 2,
          cards: [{ title: 'Card', prompt: 'P' }],
        },
      ];

      const result = buildEffectivePromptGroups({
        configPromptGroups,
        workflows: [],
        quickActions: [],
        fallbackColor,
      });

      expect(result.map(g => g.id)).toEqual(['a', 'b', 'c']);
    });
  });

  describe('fallback: category grouping', () => {
    it('groups workflows by category', () => {
      const workflows: Workflow[] = [
        {
          id: 'wf-1',
          name: 'Migration',
          description: 'Migrate apps',
          category: 'DevOps',
          steps: [{ title: 'Step 1', prompt: 'Analyze' }],
        },
        {
          id: 'wf-2',
          name: 'Deploy',
          description: 'Deploy apps',
          category: 'DevOps',
          steps: [{ title: 'Step 1', prompt: 'Deploy' }],
        },
      ];

      const result = buildEffectivePromptGroups({
        workflows,
        quickActions: [],
        fallbackColor,
      });

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('DevOps');
      expect(result[0].cards).toHaveLength(2);
    });

    it('groups quick actions by category', () => {
      const quickActions: QuickAction[] = [
        { title: 'Help', prompt: 'Help me', category: 'Support' },
        { title: 'FAQ', prompt: 'FAQ', category: 'Support' },
      ];

      const result = buildEffectivePromptGroups({
        workflows: [],
        quickActions,
        fallbackColor,
      });

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Support');
      expect(result[0].cards).toHaveLength(2);
    });

    it('defaults to "General" category when none specified', () => {
      const quickActions: QuickAction[] = [
        { title: 'Help', prompt: 'Help me' },
      ];

      const result = buildEffectivePromptGroups({
        workflows: [],
        quickActions,
        fallbackColor,
      });

      expect(result[0].title).toBe('General');
      expect(result[0].id).toBe('general');
    });

    it('mixes workflows and quick actions in same category', () => {
      const workflows: Workflow[] = [
        {
          id: 'wf-1',
          name: 'WF',
          description: 'Workflow',
          category: 'Dev',
          steps: [{ title: 'S', prompt: 'P' }],
        },
      ];
      const quickActions: QuickAction[] = [
        { title: 'QA', prompt: 'P', category: 'Dev' },
      ];

      const result = buildEffectivePromptGroups({
        workflows,
        quickActions,
        fallbackColor,
      });

      expect(result).toHaveLength(1);
      expect(result[0].cards).toHaveLength(2);
    });

    it('returns empty array when no data', () => {
      const result = buildEffectivePromptGroups({
        workflows: [],
        quickActions: [],
        fallbackColor,
      });

      expect(result).toEqual([]);
    });

    it('uses first workflow step prompt for card prompt', () => {
      const workflows: Workflow[] = [
        {
          id: 'wf-1',
          name: 'WF',
          description: 'Desc',
          steps: [
            { title: 'Step 1', prompt: 'First step prompt' },
            { title: 'Step 2', prompt: 'Second' },
          ],
        },
      ];

      const result = buildEffectivePromptGroups({
        workflows,
        quickActions: [],
        fallbackColor,
      });

      expect(result[0].cards[0].prompt).toBe('First step prompt');
    });

    it('handles workflow with no steps gracefully', () => {
      const workflows: Workflow[] = [
        {
          id: 'wf-1',
          name: 'Empty WF',
          description: 'No steps',
          steps: [],
        },
      ];

      const result = buildEffectivePromptGroups({
        workflows,
        quickActions: [],
        fallbackColor,
      });

      expect(result[0].cards[0].prompt).toBe('');
    });

    it('applies config group styling to fallback categories', () => {
      const configPromptGroups: PromptGroup[] = [
        {
          id: 'dev',
          title: 'Dev',
          icon: 'code',
          color: '#ff0000',
          order: 1,
          cards: [],
        },
      ];
      const quickActions: QuickAction[] = [
        { title: 'Help', prompt: 'P', category: 'Dev' },
      ];

      const result = buildEffectivePromptGroups({
        configPromptGroups,
        workflows: [],
        quickActions,
        fallbackColor,
      });

      expect(result[0].color).toBe('#ff0000');
      expect(result[0].icon).toBe('code');
      expect(result[0].order).toBe(1);
    });
  });
});
