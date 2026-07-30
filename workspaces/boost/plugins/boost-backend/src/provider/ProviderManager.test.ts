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

import type { AgenticProvider } from '@red-hat-developer-hub/backstage-plugin-boost-common';
import { ProviderManager } from './ProviderManager';

function createMockProvider(id: string, name?: string): AgenticProvider {
  return {
    descriptor: {
      id,
      name: name ?? `${id} provider`,
      capabilities: {},
    },
    chat: async () => 'response',
    // eslint-disable-next-line func-names
    chatStream: async function* () {
      yield { type: 'done' as const };
    },
  };
}

describe('ProviderManager', () => {
  let manager: ProviderManager;

  beforeEach(() => {
    manager = new ProviderManager();
  });

  describe('registerProvider', () => {
    it('registers a provider', () => {
      const provider = createMockProvider('llamastack');
      manager.registerProvider(provider);

      expect(manager.hasProvider()).toBe(true);
      expect(manager.getRegisteredProviders()).toHaveLength(1);
      expect(manager.getRegisteredProviders()[0].id).toBe('llamastack');
    });

    it('first registered provider becomes active', () => {
      const provider = createMockProvider('llamastack');
      manager.registerProvider(provider);

      expect(manager.getActiveProvider()).toBe(provider);
    });

    it('second registered provider does not replace active', () => {
      const first = createMockProvider('llamastack');
      const second = createMockProvider('kagenti');
      manager.registerProvider(first);
      manager.registerProvider(second);

      expect(manager.getActiveProvider()).toBe(first);
    });

    it('rejects duplicate provider IDs', () => {
      manager.registerProvider(createMockProvider('llamastack'));

      expect(() =>
        manager.registerProvider(createMockProvider('llamastack')),
      ).toThrow('Provider "llamastack" is already registered');
    });
  });

  describe('getActiveProvider', () => {
    it('throws when no provider is registered', () => {
      expect(() => manager.getActiveProvider()).toThrow(
        'No AI provider is registered',
      );
    });

    it('returns the active provider', () => {
      const provider = createMockProvider('llamastack');
      manager.registerProvider(provider);

      expect(manager.getActiveProvider()).toBe(provider);
    });
  });

  describe('switchProvider', () => {
    it('switches to a registered provider', () => {
      const first = createMockProvider('llamastack');
      const second = createMockProvider('kagenti');
      manager.registerProvider(first);
      manager.registerProvider(second);

      manager.switchProvider('kagenti');
      expect(manager.getActiveProvider()).toBe(second);
    });

    it('throws for unregistered provider', () => {
      manager.registerProvider(createMockProvider('llamastack'));

      expect(() => manager.switchProvider('nonexistent')).toThrow(
        'Provider "nonexistent" is not registered',
      );
    });

    it('includes available providers in error message', () => {
      manager.registerProvider(createMockProvider('llamastack'));
      manager.registerProvider(createMockProvider('kagenti'));

      expect(() => manager.switchProvider('nonexistent')).toThrow(
        'Available providers: llamastack, kagenti',
      );
    });
  });

  describe('getRegisteredProviders', () => {
    it('returns empty array when no providers registered', () => {
      expect(manager.getRegisteredProviders()).toEqual([]);
    });

    it('returns descriptors for all registered providers', () => {
      manager.registerProvider(createMockProvider('llamastack', 'Llama Stack'));
      manager.registerProvider(createMockProvider('kagenti', 'Kagenti'));

      const descriptors = manager.getRegisteredProviders();
      expect(descriptors).toHaveLength(2);
      expect(descriptors[0].id).toBe('llamastack');
      expect(descriptors[0].name).toBe('Llama Stack');
      expect(descriptors[1].id).toBe('kagenti');
      expect(descriptors[1].name).toBe('Kagenti');
    });
  });

  describe('hasProvider', () => {
    it('returns false when no providers registered', () => {
      expect(manager.hasProvider()).toBe(false);
    });

    it('returns true when a provider is registered', () => {
      manager.registerProvider(createMockProvider('llamastack'));
      expect(manager.hasProvider()).toBe(true);
    });
  });
});
