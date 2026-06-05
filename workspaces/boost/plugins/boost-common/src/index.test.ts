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
  // Types — verify they compile with expected shapes
  type AgenticProvider,
  type ProviderDescriptor,
  type ProviderCapabilities,
  type NormalizedStreamEvent,
  type ConversationSummary,
  type ConversationDetails,
  type InputItem,
  type ChatRequest,
  type ChatResponse,
  // Service ref
  boostAiProviderServiceRef,
  // Resource types
  RESOURCE_TYPE_BOOST_AGENT,
  RESOURCE_TYPE_BOOST_TOOL,
  // Agent permissions
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
  // Tool permissions
  boostToolPromotePermission,
  boostToolApprovePermission,
  boostToolDemotePermission,
  boostToolPublishPermission,
  boostToolUnpublishPermission,
  // Infrastructure permission
  boostKagentiAdminPermission,
  // Functional permissions
  boostChatReadPermission,
  boostChatCreatePermission,
  boostDocumentsManagePermission,
  boostMcpManagePermission,
  boostConfigManagePermission,
  // Conditional rule names
  BOOST_RULE_IS_OWNER,
  BOOST_RULE_IS_NOT_CREATOR,
  BOOST_RULE_HAS_LIFECYCLE_STAGE,
  // Aggregated arrays
  boostAgentPermissions,
  boostToolPermissions,
  boostResourcePermissions,
  boostFunctionalPermissions,
  boostPermissions,
} from './index';

describe('boost-common', () => {
  describe('service ref', () => {
    it('should have the correct ID', () => {
      expect(boostAiProviderServiceRef.id).toBe('boost.ai-provider');
    });
  });

  describe('resource types', () => {
    it('should define boost-agent resource type', () => {
      expect(RESOURCE_TYPE_BOOST_AGENT).toBe('boost-agent');
    });

    it('should define boost-tool resource type', () => {
      expect(RESOURCE_TYPE_BOOST_TOOL).toBe('boost-tool');
    });
  });

  describe('permissions', () => {
    it('should export exactly 10 agent permissions', () => {
      expect(boostAgentPermissions).toHaveLength(10);
    });

    it('should export exactly 5 tool permissions', () => {
      expect(boostToolPermissions).toHaveLength(5);
    });

    it('should export exactly 16 resource permissions', () => {
      expect(boostResourcePermissions).toHaveLength(16);
    });

    it('should export exactly 5 functional permissions', () => {
      expect(boostFunctionalPermissions).toHaveLength(5);
    });

    it('should export exactly 21 total permissions', () => {
      expect(boostPermissions).toHaveLength(21);
    });

    it('should have correct agent permission names', () => {
      expect(boostAgentListPermission.name).toBe('boost.agent.list');
      expect(boostAgentRegisterPermission.name).toBe('boost.agent.register');
      expect(boostAgentPromotePermission.name).toBe('boost.agent.promote');
      expect(boostAgentApprovePermission.name).toBe('boost.agent.approve');
      expect(boostAgentDemotePermission.name).toBe('boost.agent.demote');
      expect(boostAgentPublishPermission.name).toBe('boost.agent.publish');
      expect(boostAgentUnpublishPermission.name).toBe('boost.agent.unpublish');
      expect(boostAgentWithdrawPermission.name).toBe('boost.agent.withdraw');
      expect(boostAgentDeletePermission.name).toBe('boost.agent.delete');
      expect(boostAgentConfigurePermission.name).toBe(
        'boost.agent.configure',
      );
    });

    it('should have correct tool permission names', () => {
      expect(boostToolPromotePermission.name).toBe('boost.tool.promote');
      expect(boostToolApprovePermission.name).toBe('boost.tool.approve');
      expect(boostToolDemotePermission.name).toBe('boost.tool.demote');
      expect(boostToolPublishPermission.name).toBe('boost.tool.publish');
      expect(boostToolUnpublishPermission.name).toBe('boost.tool.unpublish');
    });

    it('should have correct infrastructure permission name', () => {
      expect(boostKagentiAdminPermission.name).toBe('boost.kagenti.admin');
    });

    it('should have correct functional permission names', () => {
      expect(boostChatReadPermission.name).toBe('boost.chat.read');
      expect(boostChatCreatePermission.name).toBe('boost.chat.create');
      expect(boostDocumentsManagePermission.name).toBe(
        'boost.documents.manage',
      );
      expect(boostMcpManagePermission.name).toBe('boost.mcp.manage');
      expect(boostConfigManagePermission.name).toBe('boost.config.manage');
    });

    it('should assign resource types to agent lifecycle permissions', () => {
      const agentResourcePerms = [
        boostAgentPromotePermission,
        boostAgentApprovePermission,
        boostAgentDemotePermission,
        boostAgentPublishPermission,
        boostAgentUnpublishPermission,
        boostAgentWithdrawPermission,
        boostAgentDeletePermission,
      ];

      for (const perm of agentResourcePerms) {
        expect(perm.resourceType).toBe(RESOURCE_TYPE_BOOST_AGENT);
      }
    });

    it('should assign resource types to tool permissions', () => {
      const toolResourcePerms = [
        boostToolPromotePermission,
        boostToolApprovePermission,
        boostToolDemotePermission,
        boostToolPublishPermission,
        boostToolUnpublishPermission,
      ];

      for (const perm of toolResourcePerms) {
        expect(perm.resourceType).toBe(RESOURCE_TYPE_BOOST_TOOL);
      }
    });

    it('should not assign resource types to non-resource permissions', () => {
      const nonResourcePerms = [
        boostAgentListPermission,
        boostAgentRegisterPermission,
        boostAgentConfigurePermission,
        boostKagentiAdminPermission,
        boostChatReadPermission,
        boostChatCreatePermission,
        boostDocumentsManagePermission,
        boostMcpManagePermission,
        boostConfigManagePermission,
      ];

      for (const perm of nonResourcePerms) {
        expect((perm as any).resourceType).toBeUndefined();
      }
    });
  });

  describe('conditional rules', () => {
    it('should define IS_OWNER rule', () => {
      expect(BOOST_RULE_IS_OWNER).toBe('IS_OWNER');
    });

    it('should define IS_NOT_CREATOR rule', () => {
      expect(BOOST_RULE_IS_NOT_CREATOR).toBe('IS_NOT_CREATOR');
    });

    it('should define HAS_LIFECYCLE_STAGE rule', () => {
      expect(BOOST_RULE_HAS_LIFECYCLE_STAGE).toBe('HAS_LIFECYCLE_STAGE');
    });
  });

  describe('type shapes', () => {
    it('should compile ProviderCapabilities with all optional fields', () => {
      const caps: ProviderCapabilities = {};
      expect(caps).toBeDefined();

      const fullCaps: ProviderCapabilities = {
        agentCatalog: true,
        namespaceScoping: false,
        devSpaces: true,
        buildPipelines: false,
        rag: true,
        safety: false,
        evaluation: true,
        conversationManagement: true,
      };
      expect(fullCaps.agentCatalog).toBe(true);
    });

    it('should compile ProviderDescriptor', () => {
      const descriptor: ProviderDescriptor = {
        id: 'test-provider',
        name: 'Test Provider',
        capabilities: { agentCatalog: true },
      };
      expect(descriptor.id).toBe('test-provider');
    });

    it('should compile ConversationSummary', () => {
      const summary: ConversationSummary = {
        id: 'conv-1',
        title: 'Test Conversation',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      expect(summary.id).toBe('conv-1');
    });

    it('should compile ConversationDetails', () => {
      const details: ConversationDetails = {
        id: 'conv-1',
        title: 'Test',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        items: [{ role: 'user', content: 'hello' }],
      };
      expect(details.items).toHaveLength(1);
    });

    it('should compile InputItem', () => {
      const item: InputItem = {
        role: 'assistant',
        content: 'response',
        timestamp: '2026-01-01T00:00:00Z',
      };
      expect(item.role).toBe('assistant');
    });

    it('should compile NormalizedStreamEvent union', () => {
      const events: NormalizedStreamEvent[] = [
        { type: 'text_delta', content: 'hello' },
        { type: 'tool_call', callId: '1', toolName: 'search', args: '{}' },
        { type: 'tool_result', callId: '1', content: 'result' },
        { type: 'error', message: 'oops' },
        { type: 'done', conversationId: 'conv-1' },
      ];
      expect(events).toHaveLength(5);
    });

    it('should compile ChatRequest', () => {
      const req: ChatRequest = {
        input: [{ role: 'user', content: 'hello' }],
        conversationId: 'conv-1',
        agentId: 'agent-1',
      };
      expect(req.input).toHaveLength(1);
    });

    it('should compile ChatResponse', () => {
      const res: ChatResponse = {
        content: 'response',
        conversationId: 'conv-1',
      };
      expect(res.content).toBe('response');
    });
  });

  describe('no provider-specific types', () => {
    it('should not export any provider-specific types', () => {
      // Verify that common package exports do not include provider-specific
      // types like LlamaStackConfig, KagentiConfig, etc.
      const exports = require('./index');
      const exportNames = Object.keys(exports);

      const providerSpecificPatterns = [
        /LlamaStack/i,
        /Kagenti/i,
        /llamastack/i,
        /kagenti/i,
      ];

      const leakedExports = exportNames.filter(name =>
        providerSpecificPatterns.some(
          pattern =>
            pattern.test(name) &&
            // boostKagentiAdminPermission is allowed — it's a cross-cutting
            // admin permission, not a provider-specific type
            name !== 'boostKagentiAdminPermission',
        ),
      );

      expect(leakedExports).toEqual([]);
    });
  });
});
