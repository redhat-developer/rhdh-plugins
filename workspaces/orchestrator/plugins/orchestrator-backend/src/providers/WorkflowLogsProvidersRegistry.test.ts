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

import { WorkflowLogsProvidersRegistry } from './WorkflowLogsProvidersRegistry';

describe('WorkflowLogsProvidersRegistry', () => {
  let registry: WorkflowLogsProvidersRegistry;

  beforeEach(() => {
    registry = new WorkflowLogsProvidersRegistry();
  });

  describe('register', () => {
    it('should register a provider successfully', () => {
      const mockProvider = {
        getProviderId: () => 'test-provider',
        getWorkflowLogs: jest.fn(),
      };

      registry.register(mockProvider as any);

      expect(registry.getProvider('test-provider')).toBe(mockProvider);
    });

    it('should allow multiple providers with different IDs', () => {
      const provider1 = {
        getProviderId: () => 'provider-1',
        getWorkflowLogs: jest.fn(),
      };
      const provider2 = {
        getProviderId: () => 'provider-2',
        getWorkflowLogs: jest.fn(),
      };

      registry.register(provider1 as any);
      registry.register(provider2 as any);

      expect(registry.getProvider('provider-1')).toBe(provider1);
      expect(registry.getProvider('provider-2')).toBe(provider2);
    });

    it('should throw ConflictError when registering provider with duplicate ID', () => {
      const provider1 = {
        getProviderId: () => 'test-provider',
        getWorkflowLogs: jest.fn(),
      };
      const provider2 = {
        getProviderId: () => 'test-provider',
        getWorkflowLogs: jest.fn(),
      };

      registry.register(provider1 as any);

      expect(() => registry.register(provider2 as any)).toThrow(ConflictError);
      expect(() => registry.register(provider2 as any)).toThrow(
        'Workflow Log Provider with ID test-provider has already been registered',
      );
    });
  });

  describe('getProvider', () => {
    it('should throw NotFoundError for non-existent provider', () => {
      expect(() => registry.getProvider('non-existent')).toThrow(NotFoundError);
      expect(() => registry.getProvider('non-existent')).toThrow(
        "Workflow Log Provider with ID 'non-existent' is not registered",
      );
    });

    it('should return the correct provider by ID', () => {
      const mockProvider = {
        getProviderId: () => 'loki-provider',
        getWorkflowLogs: jest.fn(),
      };

      registry.register(mockProvider as any);

      expect(registry.getProvider('loki-provider')).toBe(mockProvider);
    });

    it('should be case-sensitive when getting providers', () => {
      const mockProvider = {
        getProviderId: () => 'TestProvider',
        getWorkflowLogs: jest.fn(),
      };

      registry.register(mockProvider as any);

      expect(registry.getProvider('TestProvider')).toBe(mockProvider);
      expect(() => registry.getProvider('testprovider')).toThrow(NotFoundError);
    });
  });

  describe('listProviders', () => {
    it('should return empty array when no providers are registered', () => {
      expect(registry.listProviders()).toEqual([]);
    });

    it('should return all registered providers', () => {
      const provider1 = {
        getProviderId: () => 'provider-1',
        getWorkflowLogs: jest.fn(),
      };
      const provider2 = {
        getProviderId: () => 'provider-2',
        getWorkflowLogs: jest.fn(),
      };
      const provider3 = {
        getProviderId: () => 'provider-3',
        getWorkflowLogs: jest.fn(),
      };

      registry.register(provider1 as any);
      registry.register(provider2 as any);
      registry.register(provider3 as any);

      const providers = registry.listProviders();
      expect(providers).toHaveLength(3);
      expect(providers).toContain(provider1);
      expect(providers).toContain(provider2);
      expect(providers).toContain(provider3);
    });
  });
});
