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

import { ConflictError, NotFoundError } from '@backstage/errors';

import {
  lokiLogProvider,
  MockWorkflowLogProviders,
  randomLogProviderThatDoesntExist,
} from '../../__fixtures__/mockProviders';
import { WorkflowLogsProvidersRegistry } from './WorkflowLogsProvidersRegistry';

describe('WorkflowLogsProviderRegistry', () => {
  let registry: WorkflowLogsProvidersRegistry;

  beforeEach(() => {
    registry = new WorkflowLogsProvidersRegistry();
  });
  // listProviders
  describe('register providers', () => {
    it('should register log providers with different IDs successfully', () => {
      expect(() => registry.register(lokiLogProvider)).not.toThrow();
      expect(() =>
        registry.register(randomLogProviderThatDoesntExist),
      ).not.toThrow();
    });

    it('should throw a ConflictError when registring providers with duplicate names', () => {
      const provider1 = new MockWorkflowLogProviders('loki', 'url');
      const provider2 = new MockWorkflowLogProviders('loki', 'url');

      registry.register(provider1);
      expect(() => registry.register(provider2)).toThrow(
        new ConflictError(
          'Workflow Log Provider with ID loki has already been registered',
        ),
      );
    });
  });

  describe('getProvider', () => {
    it('should return provider for registered provider', () => {
      registry.register(lokiLogProvider);
      const provider = registry.getProvider('loki');
      expect(provider).toEqual(lokiLogProvider);
    });

    it('should throw NotFoundError for unregistered provider', () => {
      expect(() => registry.getProvider('nope')).toThrow(
        new NotFoundError(
          "Workflow Log Provider with ID 'nope' is not registered",
        ),
      );
    });
  });

  describe('listProviders', () => {
    it('should return an empty array when no providers are registered', () => {
      const providers = registry.listProviders();
      expect(providers).toEqual([]);
    });

    it('should return all registered providers', () => {
      registry.register(lokiLogProvider);
      registry.register(randomLogProviderThatDoesntExist);

      const providers = registry.listProviders();

      expect(providers).toHaveLength(2);
      expect(providers).toContain(lokiLogProvider);
      expect(providers).toContain(randomLogProviderThatDoesntExist);
    });
  });
});
