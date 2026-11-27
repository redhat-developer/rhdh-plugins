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
import { validateAIAssetEntity } from './validateAIAssetEntity';

function makeEntity(annotations: Record<string, string>): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'AiResource',
    metadata: {
      name: 'test-entity',
      annotations,
    },
    spec: {
      type: 'agent',
    },
  };
}

describe('validateAIAssetEntity', () => {
  it('passes for a fully valid entity', () => {
    const entity = makeEntity({
      'rhdh.io/ai-asset-category': 'agent',
      'rhdh.io/ai-asset-version': '1.0.0',
      'rhdh.io/ai-asset-source': 'ogx/default',
    });
    expect(() => validateAIAssetEntity(entity)).not.toThrow();
  });

  it('throws when category is missing', () => {
    const entity = makeEntity({
      'rhdh.io/ai-asset-version': '1.0.0',
      'rhdh.io/ai-asset-source': 'ogx/default',
    });
    expect(() => validateAIAssetEntity(entity)).toThrow(
      new Error(
        'Invalid or missing rhdh.io/ai-asset-category annotation. Allowed values: agent, skill, rule, mcp-server, ai-model, model-server',
      ),
    );
  });

  it('throws when category has an invalid value', () => {
    const entity = makeEntity({
      'rhdh.io/ai-asset-category': 'invalid-category',
      'rhdh.io/ai-asset-version': '1.0.0',
      'rhdh.io/ai-asset-source': 'ogx/default',
    });
    expect(() => validateAIAssetEntity(entity)).toThrow(
      "Invalid rhdh.io/ai-asset-category value 'invalid-category'. Allowed: agent, skill, rule, mcp-server, ai-model, model-server",
    );
  });

  it('throws when version is missing', () => {
    const entity = makeEntity({
      'rhdh.io/ai-asset-category': 'agent',
      'rhdh.io/ai-asset-source': 'ogx/default',
    });
    expect(() => validateAIAssetEntity(entity)).toThrow(
      'Invalid or missing rhdh.io/ai-asset-version annotation',
    );
  });

  it.each([
    {
      name: 'newline, tab, and terminal escape',
      category: 'agent\nFORGED\t\u001b[31m',
      escaped: 'agent\\u000aFORGED\\u0009\\u001b[31m',
    },
    {
      name: 'NUL, carriage return, DEL, C1, and Unicode line separators',
      category: '\u0000bad\r\u007f\u0085\u2028\u2029',
      escaped: '\\u0000bad\\u000d\\u007f\\u0085\\u2028\\u2029',
    },
    {
      name: 'control character inside an otherwise valid category',
      category: 'ag\nent',
      escaped: 'ag\\u000aent',
    },
  ])(
    'escapes $name in a rejected category diagnostic',
    ({ category, escaped }) => {
      const entity = makeEntity({
        'rhdh.io/ai-asset-category': category,
        'rhdh.io/ai-asset-version': '1.0.0',
        'rhdh.io/ai-asset-source': 'ogx/default',
      });
      expect(() => validateAIAssetEntity(entity)).toThrow(
        new Error(
          `Invalid rhdh.io/ai-asset-category value '${escaped}'. Allowed: agent, skill, rule, mcp-server, ai-model, model-server`,
        ),
      );
    },
  );

  it('throws when source is missing', () => {
    const entity = makeEntity({
      'rhdh.io/ai-asset-category': 'agent',
      'rhdh.io/ai-asset-version': '1.0.0',
    });
    expect(() => validateAIAssetEntity(entity)).toThrow(
      'Invalid or missing rhdh.io/ai-asset-source annotation',
    );
  });

  it('accepts all valid category values', () => {
    const categories = [
      'agent',
      'skill',
      'rule',
      'mcp-server',
      'ai-model',
      'model-server',
    ];
    for (const category of categories) {
      const entity = makeEntity({
        'rhdh.io/ai-asset-category': category,
        'rhdh.io/ai-asset-version': '1.0.0',
        'rhdh.io/ai-asset-source': 'ogx/default',
      });
      expect(() => validateAIAssetEntity(entity)).not.toThrow();
    }
  });

  it('throws when annotations object is empty', () => {
    const entity = makeEntity({});
    expect(() => validateAIAssetEntity(entity)).toThrow(
      new Error(
        'Invalid or missing rhdh.io/ai-asset-category annotation. Allowed values: agent, skill, rule, mcp-server, ai-model, model-server',
      ),
    );
  });
});
