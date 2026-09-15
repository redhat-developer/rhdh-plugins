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
  getAgentModel,
  getDistinctSpecField,
  getHandoffRefs,
  getModelsAvailable,
  getProvider,
  getSpecField,
  getSpecRemotes,
  getStringArraySpecField,
} from './entityFields';

const skill: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: { name: 'code-review', description: 'Automated code review skill' },
  spec: { type: 'skill', owner: 'team-ai' },
};

describe('entity field accessors', () => {
  it('reads the provider facet from the source annotation', () => {
    expect(
      getProvider({
        ...skill,
        metadata: {
          ...skill.metadata,
          annotations: { 'rhdh.io/ai-asset-source': 'ogx' },
        },
      }),
    ).toBe('ogx');
  });

  it('reads typed fields and ignores non-string values', () => {
    const entity = { ...skill, spec: { ...skill.spec, model: 'typed-model' } };
    expect(getAgentModel(entity)).toBe('typed-model');
    expect(getSpecField(entity, 'enabled')).toBeUndefined();
    expect(getSpecField({ ...skill, spec: undefined }, 'type')).toBeUndefined();
  });

  it('returns distinct spec text', () => {
    expect(
      getDistinctSpecField(
        {
          ...skill,
          spec: { ...skill.spec, instructions: 'Use the skill.' },
        },
        'instructions',
      ),
    ).toBe('Use the skill.');
    expect(
      getDistinctSpecField(
        {
          ...skill,
          spec: { ...skill.spec, instructions: skill.metadata.description },
        },
        'instructions',
      ),
    ).toBeUndefined();
  });

  it('deduplicates model, list, and handoff values', () => {
    expect(
      getModelsAvailable({
        ...skill,
        spec: { models: { available: ['model-a', 42, 'model-a', 'model-b'] } },
      }),
    ).toEqual(['model-a', 'model-b']);
    expect(
      getStringArraySpecField(
        {
          ...skill,
          spec: { categories: ['security', 'security', '', 42, ' quality '] },
        },
        'categories',
      ),
    ).toEqual(['security', 'quality']);
    expect(
      getHandoffRefs({
        ...skill,
        spec: {
          handoffs: [
            'airesource:default/legal',
            ' ',
            'airesource:default/legal',
          ],
        },
      }),
    ).toEqual(['airesource:default/legal']);
  });

  it('returns valid remote entries and ignores malformed values', () => {
    expect(
      getSpecRemotes({
        ...skill,
        spec: {
          remotes: [
            { url: 'https://mcp.example.com', type: 'streamable-http' },
            { url: '  ' },
            'invalid',
          ],
        },
      }),
    ).toEqual([{ url: 'https://mcp.example.com', type: 'streamable-http' }]);
  });
});
