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

import { AI_ASSET_CATEGORIES } from '@red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk';
import { MAPPING_RULES } from './mappings';

describe('MAPPING_RULES', () => {
  it('has a mapping rule for every AI asset category', () => {
    for (const category of AI_ASSET_CATEGORIES) {
      expect(MAPPING_RULES[category]).toBeDefined();
    }
  });

  it('covers exactly the seven defined categories', () => {
    expect(Object.keys(MAPPING_RULES).sort()).toEqual(
      [...AI_ASSET_CATEGORIES].sort(),
    );
  });

  it('assigns high confidence to mcp-server (kind-aligned)', () => {
    const rule = MAPPING_RULES['mcp-server'];
    expect(rule.confidence).toBe('high');
    expect(rule.targetKind).toBe('API');
    expect(rule.targetModel).toBe('McpServerApiEntity');
  });

  it('assigns medium-high confidence to skills and rules', () => {
    expect(MAPPING_RULES.skill.confidence).toBe('medium-high');
    expect(MAPPING_RULES.rule.confidence).toBe('medium-high');
    expect(MAPPING_RULES.skill.targetKind).toBe('AiResource');
    expect(MAPPING_RULES.rule.targetKind).toBe('AiResource');
  });

  it('assigns medium-low confidence to model-server', () => {
    const rule = MAPPING_RULES['model-server'];
    expect(rule.confidence).toBe('medium-low');
    expect(rule.targetKind).toBe('API');
  });

  it('assigns low confidence to categories without upstream kinds', () => {
    expect(MAPPING_RULES['ai-model'].confidence).toBe('low');
    expect(MAPPING_RULES['skill-bundle'].confidence).toBe('low');
    expect(MAPPING_RULES.agent.confidence).toBe('low');
  });

  it('does not suggest kind:McpServer rename', () => {
    for (const [, rule] of Object.entries(MAPPING_RULES)) {
      expect(rule.targetKind).not.toBe('McpServer');
      for (const t of rule.transformations) {
        expect(t).not.toContain('McpServer');
      }
    }
  });

  it('has non-empty transformations for every category', () => {
    for (const [, rule] of Object.entries(MAPPING_RULES)) {
      expect(rule.transformations.length).toBeGreaterThan(0);
    }
  });

  it('has rfcIds for categories with upstream targets', () => {
    expect(MAPPING_RULES['mcp-server'].rfcIds.length).toBeGreaterThan(0);
    expect(MAPPING_RULES.skill.rfcIds.length).toBeGreaterThan(0);
    expect(MAPPING_RULES.rule.rfcIds.length).toBeGreaterThan(0);
    expect(MAPPING_RULES['model-server'].rfcIds.length).toBeGreaterThan(0);
  });
});
