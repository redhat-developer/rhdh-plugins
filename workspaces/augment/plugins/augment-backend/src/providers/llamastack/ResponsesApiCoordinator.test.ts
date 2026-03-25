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
import type {
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { ResponsesApiCoordinator } from './ResponsesApiCoordinator';
import { createMockLogger } from '../../test-utils/mocks';

jest.mock('./ConfigLoader');

function createMockConfig(): RootConfigService {
  return {
    getOptionalConfig: jest.fn().mockReturnValue(undefined),
    getConfig: jest.fn().mockReturnValue({
      getOptionalString: jest.fn().mockReturnValue(undefined),
      getOptional: jest.fn().mockReturnValue(undefined),
      getOptionalConfig: jest.fn().mockReturnValue(undefined),
      getOptionalConfigArray: jest.fn().mockReturnValue(undefined),
      getOptionalStringArray: jest.fn().mockReturnValue(undefined),
    }),
    getOptionalString: jest.fn().mockReturnValue(undefined),
    getOptional: jest.fn().mockReturnValue(undefined),
    getOptionalConfigArray: jest.fn().mockReturnValue(undefined),
    getOptionalStringArray: jest.fn().mockReturnValue(undefined),
    getString: jest.fn().mockReturnValue(''),
    has: jest.fn().mockReturnValue(false),
    keys: jest.fn().mockReturnValue([]),
  } as unknown as RootConfigService;
}

describe('ResponsesApiCoordinator', () => {
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockConfig: RootConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = createMockLogger();
    mockConfig = createMockConfig();
  });

  describe('constructor', () => {
    it('creates an instance without errors', () => {
      const orchestrator = new ResponsesApiCoordinator({
        logger: mockLogger as unknown as LoggerService,
        config: mockConfig,
      });
      expect(orchestrator).toBeDefined();
    });
  });

  describe('pre-initialization state', () => {
    it('getSecurityConfig returns default plugin-only mode', () => {
      const orchestrator = new ResponsesApiCoordinator({
        logger: mockLogger as unknown as LoggerService,
        config: mockConfig,
      });
      expect(orchestrator.getSecurityConfig()).toEqual({ mode: 'plugin-only' });
    });

    it('isVerboseStreamLoggingEnabled returns false', () => {
      const orchestrator = new ResponsesApiCoordinator({
        logger: mockLogger as unknown as LoggerService,
        config: mockConfig,
      });
      expect(orchestrator.isVerboseStreamLoggingEnabled()).toBe(false);
    });

    it('getDefaultVectorStoreId returns undefined via facade', () => {
      const orchestrator = new ResponsesApiCoordinator({
        logger: mockLogger as unknown as LoggerService,
        config: mockConfig,
      });
      expect(
        orchestrator.getVectorStoreFacade().getDefaultVectorStoreId(),
      ).toBeUndefined();
    });

    it('getSyncSchedule returns undefined via facade', () => {
      const orchestrator = new ResponsesApiCoordinator({
        logger: mockLogger as unknown as LoggerService,
        config: mockConfig,
      });
      expect(
        orchestrator.getVectorStoreFacade().getSyncSchedule(),
      ).toBeUndefined();
    });

    it('conversations getter returns null', () => {
      const orchestrator = new ResponsesApiCoordinator({
        logger: mockLogger as unknown as LoggerService,
        config: mockConfig,
      });
      expect(
        (orchestrator as unknown as { conversations: unknown }).conversations,
      ).toBeNull();
    });
  });

  describe('ensureInitialized guard (via facades)', () => {
    it('listConversations throws when not initialized', async () => {
      const orchestrator = new ResponsesApiCoordinator({
        logger: mockLogger as unknown as LoggerService,
        config: mockConfig,
      });
      await expect(
        orchestrator.getConversationFacade().listConversations(),
      ).rejects.toThrow('not initialized');
    });

    it('getConversation throws when not initialized', async () => {
      const orchestrator = new ResponsesApiCoordinator({
        logger: mockLogger as unknown as LoggerService,
        config: mockConfig,
      });
      await expect(
        orchestrator.getConversationFacade().getConversation('resp_1'),
      ).rejects.toThrow('not initialized');
    });

    it('syncDocuments throws when not initialized', async () => {
      const orchestrator = new ResponsesApiCoordinator({
        logger: mockLogger as unknown as LoggerService,
        config: mockConfig,
      });
      await expect(
        orchestrator.getVectorStoreFacade().syncDocuments(),
      ).rejects.toThrow('not initialized');
    });
  });

  describe('getStatus', () => {
    it('returns not-configured status when Llama Stack is not configured', async () => {
      const orchestrator = new ResponsesApiCoordinator({
        logger: mockLogger as unknown as LoggerService,
        config: mockConfig,
      });

      const status = await orchestrator.getStatus();
      expect(status.ready).toBe(false);
      expect(status.provider.connected).toBe(false);
      expect(status.provider.model).toBe('not configured');
      expect(status.configurationErrors).toEqual(
        expect.arrayContaining([expect.stringContaining('not configured')]),
      );
      expect(status.securityMode).toBe('plugin-only');
      expect(status.timestamp).toBeDefined();
    });
  });

  describe('initialize idempotency', () => {
    it('skips re-initialization if already initialized', async () => {
      const { ConfigLoader } = require('./ConfigLoader');
      ConfigLoader.mockImplementation(() => ({
        validateRequiredConfig: jest.fn().mockImplementation(() => {
          throw new Error('Config error on first call');
        }),
        loadSecurityConfig: jest.fn(),
        loadSystemPrompt: jest.fn().mockReturnValue('test prompt'),
        loadPostToolInstructions: jest.fn().mockReturnValue(undefined),
      }));

      const orchestrator = new ResponsesApiCoordinator({
        logger: mockLogger as unknown as LoggerService,
        config: mockConfig,
      });

      // First call fails because validateRequiredConfig throws
      await expect(orchestrator.initialize()).rejects.toThrow(
        'Config error on first call',
      );

      // The orchestrator is not marked as initialized, so calling again
      // should attempt initialization again (not silently return)
      await expect(orchestrator.initialize()).rejects.toThrow(
        'Config error on first call',
      );
    });
  });

  describe('invalidateRuntimeConfig', () => {
    it('calls invalidateToolCache on adkOrchestrator when initialized', () => {
      const coordinator = new ResponsesApiCoordinator({
        logger: mockLogger as unknown as LoggerService,
        config: mockConfig,
      });

      const mockInvalidateToolCache = jest.fn();
      const mockInvalidateGraphManager = jest.fn();

      (coordinator as any).adkOrchestrator = {
        invalidateToolCache: mockInvalidateToolCache,
      };
      (coordinator as any).agentGraphManager = {
        invalidate: mockInvalidateGraphManager,
      };

      coordinator.invalidateRuntimeConfig();

      expect(mockInvalidateToolCache).toHaveBeenCalledTimes(1);
      expect(mockInvalidateGraphManager).toHaveBeenCalledTimes(1);
    });

    it('does not throw when adkOrchestrator is null', () => {
      const coordinator = new ResponsesApiCoordinator({
        logger: mockLogger as unknown as LoggerService,
        config: mockConfig,
      });

      expect(() => coordinator.invalidateRuntimeConfig()).not.toThrow();
    });
  });

  describe('chat delegation', () => {
    it('throws when AdkOrchestrator is not initialized', async () => {
      const coordinator = new ResponsesApiCoordinator({
        logger: mockLogger as unknown as LoggerService,
        config: mockConfig,
      });

      await expect(
        coordinator.chat({ messages: [{ role: 'user', content: 'hi' }] }),
      ).rejects.toThrow('not initialized');
    });

    it('throws on chatStream when AdkOrchestrator is not initialized', async () => {
      const coordinator = new ResponsesApiCoordinator({
        logger: mockLogger as unknown as LoggerService,
        config: mockConfig,
      });

      await expect(
        coordinator.chatStream(
          { messages: [{ role: 'user', content: 'hi' }] },
          jest.fn(),
        ),
      ).rejects.toThrow('not initialized');
    });
  });
});
