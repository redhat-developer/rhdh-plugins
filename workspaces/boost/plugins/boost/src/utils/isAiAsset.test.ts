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
import { isAiAsset } from './isAiAsset';

function entity(kind: string, specType?: string): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind,
    metadata: { name: 'test', namespace: 'default' },
    spec: specType ? { type: specType } : undefined,
  } as Entity;
}

describe('isAiAsset', () => {
  it.each([
    ['AiResource', 'skill'],
    ['AiResource', 'rule'],
    ['API', 'mcp-server'],
    ['Component', 'ai-agent'],
    ['Resource', 'ai-model'],
    ['Resource', 'ai-tool'],
    ['Resource', 'vector-store'],
  ])('returns true for %s with spec.type %s', (kind, type) => {
    expect(isAiAsset(entity(kind, type))).toBe(true);
  });

  it('is case-insensitive for kind', () => {
    expect(isAiAsset(entity('airesource', 'skill'))).toBe(true);
    expect(isAiAsset(entity('AIRESOURCE', 'rule'))).toBe(true);
  });

  it('is case-insensitive for spec.type', () => {
    expect(isAiAsset(entity('AiResource', 'SKILL'))).toBe(true);
    expect(isAiAsset(entity('API', 'MCP-SERVER'))).toBe(true);
    expect(isAiAsset(entity('Resource', 'Ai-Model'))).toBe(true);
  });

  it('returns false for AiResource without spec.type', () => {
    expect(isAiAsset(entity('AiResource'))).toBe(false);
    expect(isAiAsset(entity('AiResource', undefined))).toBe(false);
  });

  it('returns false for AiResource with unrecognized spec.type', () => {
    expect(isAiAsset(entity('AiResource', 'custom-unknown'))).toBe(false);
  });

  it.each([
    ['Component', 'service'],
    ['API', 'openapi'],
    ['Resource', 'database'],
    ['System', undefined],
    ['Group', undefined],
  ])('returns false for non-AI entity %s / %s', (kind, type) => {
    expect(isAiAsset(entity(kind, type))).toBe(false);
  });
});
