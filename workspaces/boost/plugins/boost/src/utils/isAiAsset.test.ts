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

import { isAiAsset } from './isAiAsset';

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
    expect(isAiAsset({ kind, spec: { type } })).toBe(true);
  });

  it('returns true for AiResource without spec.type', () => {
    expect(isAiAsset({ kind: 'AiResource' })).toBe(true);
    expect(isAiAsset({ kind: 'AiResource', spec: {} })).toBe(true);
  });

  it('is case-insensitive for kind', () => {
    expect(isAiAsset({ kind: 'airesource', spec: { type: 'skill' } })).toBe(
      true,
    );
    expect(isAiAsset({ kind: 'AIRESOURCE', spec: { type: 'rule' } })).toBe(
      true,
    );
  });

  it('is case-insensitive for spec.type', () => {
    expect(isAiAsset({ kind: 'AiResource', spec: { type: 'SKILL' } })).toBe(
      true,
    );
    expect(isAiAsset({ kind: 'API', spec: { type: 'MCP-SERVER' } })).toBe(true);
    expect(isAiAsset({ kind: 'Resource', spec: { type: 'Ai-Model' } })).toBe(
      true,
    );
  });

  it('returns false for AiResource with unrecognized spec.type', () => {
    expect(
      isAiAsset({ kind: 'AiResource', spec: { type: 'custom-unknown' } }),
    ).toBe(false);
  });

  it.each([
    ['Component', 'service'],
    ['API', 'openapi'],
    ['Resource', 'database'],
    ['System', undefined],
    ['Group', undefined],
  ])('returns false for non-AI entity %s / %s', (kind, type) => {
    expect(isAiAsset({ kind, spec: type ? { type } : undefined })).toBe(false);
  });
});
