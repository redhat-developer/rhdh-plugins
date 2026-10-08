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

import { getAssetDetailsData, hasAssetDetails } from './assetDetailsData';

const baseEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: { name: 'test-asset' },
  spec: { type: 'agent' },
};

describe('getAssetDetailsData', () => {
  it('keeps fields isolated to the detected asset type', () => {
    const data = getAssetDetailsData({
      ...baseEntity,
      spec: {
        type: 'skill',
        model: 'should-not-render',
        disciplines: ['development'],
      },
    });

    expect(data.typeDetails).toEqual({
      type: 'skill',
      disciplines: ['development'],
      categories: [],
      agents: [],
    });
  });

  it('preserves false boolean values and model server data', () => {
    const data = getAssetDetailsData({
      ...baseEntity,
      spec: {
        type: 'ai-model-server',
        serverType: 'openapi-v1',
        requiresApiKey: false,
        models: {
          default: 'model-a',
          available: ['model-a', 'model-a', 'model-b'],
        },
      },
    });

    expect(data.typeDetails).toEqual({
      type: 'ai-model-server',
      serverType: 'openapi-v1',
      defaultModel: 'model-a',
      requiresApiKey: false,
      modelsAvailable: ['model-a', 'model-b'],
    });
  });

  it('extracts MCP remotes and agent handoffs', () => {
    expect(
      getAssetDetailsData({
        ...baseEntity,
        spec: {
          type: 'mcp-server',
          remotes: [
            { url: 'https://mcp.example.com', type: 'streamable-http' },
          ],
          definition: 'openapi: 3.0.0',
        },
      }).typeDetails,
    ).toEqual({
      type: 'mcp-server',
      remotes: [{ url: 'https://mcp.example.com', type: 'streamable-http' }],
      definition: 'openapi: 3.0.0',
    });

    expect(
      getAssetDetailsData({
        ...baseEntity,
        spec: {
          type: 'agent',
          handoffs: [
            'airesource:default/support',
            'airesource:default/support',
          ],
        },
      }).typeDetails,
    ).toMatchObject({
      type: 'agent',
      handoffRefs: ['airesource:default/support'],
    });
  });

  it('reports whether a card has displayable content', () => {
    const emptyData = getAssetDetailsData(baseEntity);
    expect(emptyData.typeDetails).toBeUndefined();
    expect(hasAssetDetails(emptyData)).toBe(false);
    expect(
      hasAssetDetails(
        getAssetDetailsData({
          ...baseEntity,
          metadata: { ...baseEntity.metadata, description: 'Description' },
        }),
      ),
    ).toBe(true);
  });
});
