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

import type { Entity } from '@backstage/catalog-model';

import {
  categoryFilterDefinition,
  providerFilterDefinition,
  ownerFilterDefinition,
  tagsFilterDefinition,
} from './builtInFilterDefinitions';

const skill: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'code-review',
    namespace: 'default',
    tags: ['security', 'quality'],
    annotations: { 'rhdh.io/ai-asset-source': 'github' },
  },
  spec: { type: 'skill', lifecycle: 'production', owner: 'team-ai' },
};

const agent: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'dev-assistant',
    namespace: 'default',
    tags: ['agent'],
    annotations: { 'rhdh.io/ai-asset-source': 'kagenti' },
  },
  spec: { type: 'ai-agent', lifecycle: 'experimental', owner: 'team-ml' },
};

const entities = [skill, agent];

describe('builtinFilters', () => {
  describe('categoryFilterDefinition', () => {
    it('returns all category options', () => {
      const options = categoryFilterDefinition.getOptions(entities);
      expect(options.length).toBeGreaterThanOrEqual(5);
      expect(options.find(o => o.id === 'skill')).toBeDefined();
      expect(options.find(o => o.id === 'ai-agent')).toBeDefined();
    });

    it('matches entity by spec.type', () => {
      expect(categoryFilterDefinition.matchEntity(skill, ['skill'])).toBe(true);
      expect(categoryFilterDefinition.matchEntity(skill, ['ai-agent'])).toBe(
        false,
      );
      expect(categoryFilterDefinition.matchEntity(agent, ['ai-agent'])).toBe(
        true,
      );
    });

    it('matches case-insensitively', () => {
      expect(categoryFilterDefinition.matchEntity(skill, ['SKILL'])).toBe(true);
    });

    it('has correct urlParam and priority', () => {
      expect(categoryFilterDefinition.urlParam).toBe('type');
      expect(categoryFilterDefinition.priority).toBe(100);
    });
  });

  describe('providerFilterDefinition', () => {
    it('returns unique sorted provider options', () => {
      const options = providerFilterDefinition.getOptions(entities);
      expect(options).toEqual([
        { id: 'github', label: 'github' },
        { id: 'kagenti', label: 'kagenti' },
      ]);
    });

    it('matches entity by annotation', () => {
      expect(providerFilterDefinition.matchEntity(skill, ['github'])).toBe(
        true,
      );
      expect(providerFilterDefinition.matchEntity(skill, ['kagenti'])).toBe(
        false,
      );
      expect(providerFilterDefinition.matchEntity(agent, ['kagenti'])).toBe(
        true,
      );
    });

    it('has correct urlParam', () => {
      expect(providerFilterDefinition.urlParam).toBe('provider');
    });
  });

  describe('ownerFilterDefinition', () => {
    it('returns unique sorted owner options', () => {
      const options = ownerFilterDefinition.getOptions(entities);
      expect(options).toEqual([
        { id: 'team-ai', label: 'team-ai' },
        { id: 'team-ml', label: 'team-ml' },
      ]);
    });

    it('matches entity by spec.owner', () => {
      expect(ownerFilterDefinition.matchEntity(skill, ['team-ai'])).toBe(true);
      expect(ownerFilterDefinition.matchEntity(skill, ['team-ml'])).toBe(false);
    });

    it('has correct urlParam', () => {
      expect(ownerFilterDefinition.urlParam).toBe('owner');
    });
  });

  describe('tagsFilterDefinition', () => {
    it('returns unique sorted tag options', () => {
      const options = tagsFilterDefinition.getOptions(entities);
      expect(options).toEqual([
        { id: 'agent', label: 'agent' },
        { id: 'quality', label: 'quality' },
        { id: 'security', label: 'security' },
      ]);
    });

    it('matches entity when any tag matches', () => {
      expect(tagsFilterDefinition.matchEntity(skill, ['security'])).toBe(true);
      expect(tagsFilterDefinition.matchEntity(skill, ['agent'])).toBe(false);
      expect(tagsFilterDefinition.matchEntity(agent, ['agent'])).toBe(true);
    });

    it('matches case-insensitively', () => {
      expect(tagsFilterDefinition.matchEntity(skill, ['SECURITY'])).toBe(true);
    });

    it('has correct urlParam', () => {
      expect(tagsFilterDefinition.urlParam).toBe('tag');
    });
  });

  describe('priority ordering', () => {
    it('built-in filters have ascending priorities', () => {
      const priorities = [
        categoryFilterDefinition.priority,
        providerFilterDefinition.priority,
        ownerFilterDefinition.priority,
        tagsFilterDefinition.priority,
      ];
      for (let i = 1; i < priorities.length; i++) {
        expect(priorities[i]).toBeGreaterThan(priorities[i - 1]);
      }
    });
  });
});
