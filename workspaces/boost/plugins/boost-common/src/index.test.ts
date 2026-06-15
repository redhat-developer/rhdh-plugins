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

import {
  BOOST_PLUGIN_ID,
  RESOURCE_TYPE_BOOST_AGENT,
  RESOURCE_TYPE_BOOST_TOOL,
  boostResourcePermissions,
  boostFunctionalPermissions,
  boostPermissions,
  boostAgentListPermission,
  boostAgentRegisterPermission,
  boostAgentPromotePermission,
  boostAgentApprovePermission,
  boostAgentDemotePermission,
  boostAgentPublishPermission,
  boostAgentUnpublishPermission,
  boostAgentWithdrawPermission,
  boostAgentDeletePermission,
  boostAgentConfigurePermission,
  boostToolPromotePermission,
  boostToolApprovePermission,
  boostToolDemotePermission,
  boostToolPublishPermission,
  boostToolUnpublishPermission,
  boostKagentiAdminPermission,
  boostChatReadPermission,
  boostChatCreatePermission,
  boostDocumentsManagePermission,
  boostMcpManagePermission,
  boostConfigManagePermission,
  BOOST_RULE_IS_OWNER,
  BOOST_RULE_IS_NOT_CREATOR,
  BOOST_RULE_HAS_LIFECYCLE_STAGE,
} from './index';

import type {
  AgenticProvider,
  ProviderDescriptor,
  ProviderCapabilities,
  NormalizedStreamEvent,
  ConversationSummary,
  ConversationDetails,
  InputItem,
} from './index';

describe('boost-common', () => {
  it('exports the boost plugin ID', () => {
    expect(BOOST_PLUGIN_ID).toBe('boost');
  });

  describe('resource types', () => {
    it('defines boost-agent resource type', () => {
      expect(RESOURCE_TYPE_BOOST_AGENT).toBe('boost-agent');
    });

    it('defines boost-tool resource type', () => {
      expect(RESOURCE_TYPE_BOOST_TOOL).toBe('boost-tool');
    });
  });

  describe('permissions', () => {
    it('exports exactly 16 resource permissions', () => {
      expect(boostResourcePermissions).toHaveLength(16);
    });

    it('exports exactly 5 functional permissions', () => {
      expect(boostFunctionalPermissions).toHaveLength(5);
    });

    it('exports 21 total permissions', () => {
      expect(boostPermissions).toHaveLength(21);
    });

    describe('agent permissions', () => {
      it('defines 10 agent permissions with boost.agent.* names', () => {
        const agentPermissions = [
          boostAgentListPermission,
          boostAgentRegisterPermission,
          boostAgentPromotePermission,
          boostAgentApprovePermission,
          boostAgentDemotePermission,
          boostAgentPublishPermission,
          boostAgentUnpublishPermission,
          boostAgentWithdrawPermission,
          boostAgentDeletePermission,
          boostAgentConfigurePermission,
        ];

        for (const perm of agentPermissions) {
          expect(perm.name).toMatch(/^boost\.agent\./);
        }
        expect(agentPermissions).toHaveLength(10);
      });

      it('scopes resource permissions to boost-agent', () => {
        const resourceScoped = [
          boostAgentPromotePermission,
          boostAgentApprovePermission,
          boostAgentDemotePermission,
          boostAgentPublishPermission,
          boostAgentUnpublishPermission,
          boostAgentWithdrawPermission,
          boostAgentDeletePermission,
        ];

        for (const perm of resourceScoped) {
          expect(perm.resourceType).toBe(RESOURCE_TYPE_BOOST_AGENT);
        }
      });

      it('defines basic agent permissions without resource type', () => {
        expect(boostAgentListPermission).not.toHaveProperty('resourceType');
        expect(boostAgentRegisterPermission).not.toHaveProperty('resourceType');
        expect(boostAgentConfigurePermission).not.toHaveProperty(
          'resourceType',
        );
      });
    });

    describe('tool permissions', () => {
      it('defines 5 tool permissions with boost.tool.* names', () => {
        const toolPermissions = [
          boostToolPromotePermission,
          boostToolApprovePermission,
          boostToolDemotePermission,
          boostToolPublishPermission,
          boostToolUnpublishPermission,
        ];

        for (const perm of toolPermissions) {
          expect(perm.name).toMatch(/^boost\.tool\./);
        }
        expect(toolPermissions).toHaveLength(5);
      });

      it('scopes all tool permissions to boost-tool', () => {
        const toolPermissions = [
          boostToolPromotePermission,
          boostToolApprovePermission,
          boostToolDemotePermission,
          boostToolPublishPermission,
          boostToolUnpublishPermission,
        ];

        for (const perm of toolPermissions) {
          expect(perm.resourceType).toBe(RESOURCE_TYPE_BOOST_TOOL);
        }
      });
    });

    describe('kagenti admin permission', () => {
      it('defines kagenti admin permission', () => {
        expect(boostKagentiAdminPermission.name).toBe('boost.kagenti.admin');
      });
    });

    describe('functional permissions', () => {
      it('defines chat.read permission', () => {
        expect(boostChatReadPermission.name).toBe('boost.chat.read');
        expect(boostChatReadPermission.attributes.action).toBe('read');
      });

      it('defines chat.create permission', () => {
        expect(boostChatCreatePermission.name).toBe('boost.chat.create');
        expect(boostChatCreatePermission.attributes.action).toBe('create');
      });

      it('defines documents.manage permission', () => {
        expect(boostDocumentsManagePermission.name).toBe(
          'boost.documents.manage',
        );
        expect(boostDocumentsManagePermission.attributes.action).toBe('update');
      });

      it('defines mcp.manage permission', () => {
        expect(boostMcpManagePermission.name).toBe('boost.mcp.manage');
        expect(boostMcpManagePermission.attributes.action).toBe('update');
      });

      it('defines config.manage permission', () => {
        expect(boostConfigManagePermission.name).toBe('boost.config.manage');
        expect(boostConfigManagePermission.attributes.action).toBe('update');
      });
    });

    it('has no duplicate permission names', () => {
      const names = boostPermissions.map(p => p.name);
      expect(new Set(names).size).toBe(names.length);
    });
  });

  describe('conditional rules', () => {
    it('defines IS_OWNER rule', () => {
      expect(BOOST_RULE_IS_OWNER).toBe('IS_OWNER');
    });

    it('defines IS_NOT_CREATOR rule', () => {
      expect(BOOST_RULE_IS_NOT_CREATOR).toBe('IS_NOT_CREATOR');
    });

    it('defines HAS_LIFECYCLE_STAGE rule', () => {
      expect(BOOST_RULE_HAS_LIFECYCLE_STAGE).toBe('HAS_LIFECYCLE_STAGE');
    });
  });

  describe('type exports', () => {
    it('exports AgenticProvider interface', () => {
      // Type-level test: verify the interface shape compiles correctly
      const provider: AgenticProvider = {
        id: 'test',
        displayName: 'Test Provider',
        initialize: async () => {},
        postInitialize: async () => {},
        getStatus: async () => ({
          provider: {
            connected: true,
            baseUrl: 'http://localhost',
            model: 'test-model',
          },
          timestamp: new Date().toISOString(),
          ready: true,
          configurationErrors: [],
        }),
        chat: async () => ({ message: 'hello' }),
        chatStream: async () => {},
      };

      expect(provider.id).toBe('test');
      expect(provider.displayName).toBe('Test Provider');
    });

    it('exports ProviderDescriptor interface', () => {
      const descriptor: ProviderDescriptor = {
        id: 'test',
        displayName: 'Test',
        description: 'A test provider',
        implemented: true,
        capabilities: {
          chat: true,
          rag: false,
          safety: false,
          evaluation: false,
          conversations: false,
          mcpTools: false,
          tools: false,
          toolLifecycle: false,
          agentLifecycle: false,
          devSpaces: false,
          contextHydration: false,
          providerRoutes: false,
        },
        configFields: [],
      };

      expect(descriptor.id).toBe('test');
      expect(descriptor.capabilities.chat).toBe(true);
    });

    it('exports ProviderCapabilities interface', () => {
      const capabilities: ProviderCapabilities = {
        chat: true,
        rag: true,
        safety: false,
        evaluation: false,
        conversations: true,
        mcpTools: true,
        tools: false,
        toolLifecycle: false,
        agentLifecycle: false,
        devSpaces: false,
        contextHydration: false,
        providerRoutes: false,
      };

      expect(capabilities.chat).toBe(true);
      expect(capabilities.rag).toBe(true);
      expect(capabilities.safety).toBe(false);
    });

    it('exports NormalizedStreamEvent union type', () => {
      const events: NormalizedStreamEvent[] = [
        { type: 'stream.started', responseId: 'r1' },
        { type: 'stream.text.delta', delta: 'hello' },
        { type: 'stream.text.done', text: 'hello world' },
        { type: 'stream.error', error: 'something failed' },
        { type: 'stream.completed' },
      ];

      expect(events).toHaveLength(5);
      expect(events[0].type).toBe('stream.started');
    });

    it('exports ConversationSummary interface', () => {
      const summary: ConversationSummary = {
        responseId: 'r1',
        preview: 'Hello',
        createdAt: new Date(),
        model: 'test-model',
        status: 'completed',
      };

      expect(summary.responseId).toBe('r1');
      expect(summary.status).toBe('completed');
    });

    it('exports ConversationDetails interface', () => {
      const details: ConversationDetails = {
        id: 'c1',
        model: 'test-model',
        status: 'completed',
        createdAt: new Date(),
        input: [],
        output: [],
      };

      expect(details.id).toBe('c1');
    });

    it('exports InputItem interface', () => {
      const item: InputItem = {
        type: 'message',
        role: 'user',
        content: 'Hello',
      };

      expect(item.type).toBe('message');
      expect(item.role).toBe('user');
    });
  });

  describe('no provider-specific types', () => {
    it('does not export provider-specific types', () => {
      // This test verifies the design principle that no provider-specific
      // types (e.g., LlamaStackConfig, KagentiConfig) exist in the
      // common package. If any such type is added, it should be caught
      // in code review.
      const exports = require('./index');
      const exportNames = Object.keys(exports);

      // Should not contain provider-specific prefixes
      const providerSpecific = exportNames.filter(
        name =>
          name.startsWith('Kagenti') ||
          name.startsWith('kagenti') ||
          name.startsWith('LlamaStack') ||
          name.startsWith('llamastack') ||
          name.startsWith('Adk') ||
          name.startsWith('adk'),
      );

      // boostKagentiAdminPermission is expected — it's a permission name,
      // not a provider-specific type
      const filtered = providerSpecific.filter(
        name => name !== 'boostKagentiAdminPermission',
      );

      expect(filtered).toEqual([]);
    });
  });

  describe('no @backstage/backend-plugin-api dependency', () => {
    it('does not depend on backend-plugin-api', () => {
      // eslint-disable-next-line @backstage/no-relative-monorepo-imports
      const pkg = require('../package.json');
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.peerDependencies,
      };
      expect(allDeps).not.toHaveProperty('@backstage/backend-plugin-api');
    });
  });
});
