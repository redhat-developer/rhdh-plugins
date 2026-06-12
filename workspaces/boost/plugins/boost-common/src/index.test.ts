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
  boostAiProviderServiceRef,
  // Resource types
  RESOURCE_TYPE_BOOST_AGENT,
  RESOURCE_TYPE_BOOST_TOOL,
  // Agent lifecycle permissions
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
  // Tool lifecycle permissions
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
  // Access / admin
  boostAccessPermission,
  boostAdminPermission,
  // Conditional rules
  BOOST_RULE_IS_OWNER,
  BOOST_RULE_IS_NOT_CREATOR,
  BOOST_RULE_HAS_LIFECYCLE_STAGE,
  // Aggregated lists
  boostResourcePermissions,
  boostFunctionalPermissions,
  boostPermissions,
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

  describe('boostAiProviderServiceRef', () => {
    it('has the correct service ID', () => {
      expect(boostAiProviderServiceRef.id).toBe('boost.ai-provider');
    });

    it('has plugin scope', () => {
      expect(boostAiProviderServiceRef.scope).toBe('plugin');
    });
  });

  describe('resource types', () => {
    it('defines boost-agent resource type', () => {
      expect(RESOURCE_TYPE_BOOST_AGENT).toBe('boost-agent');
    });

    it('defines boost-tool resource type', () => {
      expect(RESOURCE_TYPE_BOOST_TOOL).toBe('boost-tool');
    });
  });

  describe('agent lifecycle permissions', () => {
    it('defines exactly 10 agent permissions', () => {
      const agentPerms = [
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
      expect(agentPerms).toHaveLength(10);
    });

    it('has correct permission names', () => {
      expect(boostAgentListPermission.name).toBe('boost.agent.list');
      expect(boostAgentRegisterPermission.name).toBe('boost.agent.register');
      expect(boostAgentPromotePermission.name).toBe('boost.agent.promote');
      expect(boostAgentApprovePermission.name).toBe('boost.agent.approve');
      expect(boostAgentDemotePermission.name).toBe('boost.agent.demote');
      expect(boostAgentPublishPermission.name).toBe('boost.agent.publish');
      expect(boostAgentUnpublishPermission.name).toBe('boost.agent.unpublish');
      expect(boostAgentWithdrawPermission.name).toBe('boost.agent.withdraw');
      expect(boostAgentDeletePermission.name).toBe('boost.agent.delete');
      expect(boostAgentConfigurePermission.name).toBe('boost.agent.configure');
    });

    it('resource permissions reference boost-agent type', () => {
      const resourcePerms = [
        boostAgentPromotePermission,
        boostAgentApprovePermission,
        boostAgentDemotePermission,
        boostAgentPublishPermission,
        boostAgentUnpublishPermission,
        boostAgentWithdrawPermission,
        boostAgentDeletePermission,
      ];
      for (const perm of resourcePerms) {
        expect(perm).toHaveProperty('resourceType', RESOURCE_TYPE_BOOST_AGENT);
      }
    });

    it('basic permissions do not have a resourceType', () => {
      const basicPerms = [
        boostAgentListPermission,
        boostAgentRegisterPermission,
        boostAgentConfigurePermission,
      ];
      for (const perm of basicPerms) {
        expect(perm).not.toHaveProperty('resourceType');
      }
    });
  });

  describe('tool lifecycle permissions', () => {
    it('defines exactly 5 tool permissions', () => {
      const toolPerms = [
        boostToolPromotePermission,
        boostToolApprovePermission,
        boostToolDemotePermission,
        boostToolPublishPermission,
        boostToolUnpublishPermission,
      ];
      expect(toolPerms).toHaveLength(5);
    });

    it('has correct permission names', () => {
      expect(boostToolPromotePermission.name).toBe('boost.tool.promote');
      expect(boostToolApprovePermission.name).toBe('boost.tool.approve');
      expect(boostToolDemotePermission.name).toBe('boost.tool.demote');
      expect(boostToolPublishPermission.name).toBe('boost.tool.publish');
      expect(boostToolUnpublishPermission.name).toBe('boost.tool.unpublish');
    });

    it('all tool permissions reference boost-tool type', () => {
      const toolPerms = [
        boostToolPromotePermission,
        boostToolApprovePermission,
        boostToolDemotePermission,
        boostToolPublishPermission,
        boostToolUnpublishPermission,
      ];
      for (const perm of toolPerms) {
        expect(perm).toHaveProperty('resourceType', RESOURCE_TYPE_BOOST_TOOL);
      }
    });
  });

  describe('infrastructure permission', () => {
    it('defines kagenti admin permission', () => {
      expect(boostKagentiAdminPermission.name).toBe('boost.kagenti.admin');
    });
  });

  describe('functional permissions', () => {
    it('defines exactly 5 functional permissions', () => {
      expect(boostFunctionalPermissions).toHaveLength(5);
    });

    it('has correct permission names', () => {
      expect(boostChatReadPermission.name).toBe('boost.chat.read');
      expect(boostChatCreatePermission.name).toBe('boost.chat.create');
      expect(boostDocumentsManagePermission.name).toBe(
        'boost.documents.manage',
      );
      expect(boostMcpManagePermission.name).toBe('boost.mcp.manage');
      expect(boostConfigManagePermission.name).toBe('boost.config.manage');
    });
  });

  describe('access and admin permissions', () => {
    it('defines access permission', () => {
      expect(boostAccessPermission.name).toBe('boost.access');
      expect(boostAccessPermission.attributes.action).toBe('read');
    });

    it('defines admin permission', () => {
      expect(boostAdminPermission.name).toBe('boost.admin');
      expect(boostAdminPermission.attributes.action).toBe('update');
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

  describe('aggregated permission lists', () => {
    it('resource permissions contain exactly 16 entries', () => {
      expect(boostResourcePermissions).toHaveLength(16);
    });

    it('functional permissions contain exactly 5 entries', () => {
      expect(boostFunctionalPermissions).toHaveLength(5);
    });

    it('total permissions contain 23 entries (16 + 5 + access + admin)', () => {
      expect(boostPermissions).toHaveLength(23);
    });
  });

  describe('type exports compile correctly', () => {
    it('AgenticProvider interface has expected shape', () => {
      // Type-level check: ensure the interface compiles with expected fields
      const provider: AgenticProvider = {
        descriptor: {
          id: 'test',
          name: 'Test Provider',
          capabilities: {},
        },
        chat: async () => ({ response: '', conversationId: '' }),
        chatStream: async function* chatStream() {
          yield { type: 'done' as const };
        },
      };
      expect(provider.descriptor.id).toBe('test');
      expect(provider.descriptor.name).toBe('Test Provider');
      expect(provider.descriptor.capabilities).toBeDefined();
    });

    it('ProviderDescriptor includes id, name, and capabilities', () => {
      const descriptor: ProviderDescriptor = {
        id: 'test',
        name: 'Test',
        capabilities: { rag: true, safety: false },
      };
      expect(descriptor.id).toBe('test');
      expect(descriptor.capabilities.rag).toBe(true);
    });

    it('ProviderCapabilities has optional boolean fields', () => {
      const caps: ProviderCapabilities = {};
      expect(caps.rag).toBeUndefined();
      expect(caps.safety).toBeUndefined();

      const fullCaps: ProviderCapabilities = {
        rag: true,
        safety: true,
        evaluation: true,
        conversationManagement: true,
        agentCatalog: true,
        namespaceScoping: false,
        devSpaces: false,
        buildPipelines: false,
      };
      expect(fullCaps.rag).toBe(true);
    });

    it('NormalizedStreamEvent union covers all event types', () => {
      const events: NormalizedStreamEvent[] = [
        { type: 'text', content: 'hello' },
        { type: 'tool_call_start', toolCallId: '1', toolName: 'test' },
        { type: 'tool_call_delta', toolCallId: '1', content: 'data' },
        { type: 'tool_call_end', toolCallId: '1' },
        { type: 'tool_result', toolCallId: '1', result: 'ok' },
        { type: 'error', message: 'fail' },
        { type: 'done' },
      ];
      expect(events).toHaveLength(7);
    });

    it('ConversationSummary has expected fields', () => {
      const summary: ConversationSummary = {
        id: '1',
        title: 'Test',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      expect(summary.id).toBe('1');
    });

    it('ConversationDetails includes items array', () => {
      const details: ConversationDetails = {
        id: '1',
        title: 'Test',
        items: [],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      expect(details.items).toEqual([]);
    });

    it('InputItem has role and content', () => {
      const item: InputItem = {
        id: '1',
        role: 'user',
        content: 'Hello',
        createdAt: '2026-01-01T00:00:00Z',
      };
      expect(item.role).toBe('user');
    });
  });

  describe('no provider-specific types in common package', () => {
    it('does not export LlamaStackConfig or KagentiConfig', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const exports = require('./index') as any;
      expect(exports.LlamaStackConfig).toBeUndefined();
      expect(exports.KagentiConfig).toBeUndefined();
      expect(exports.LlamaStackProvider).toBeUndefined();
      expect(exports.KagentiProvider).toBeUndefined();
    });
  });
});
