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
  BOOST_AGENT_RESOURCE_TYPE,
  BOOST_TOOL_RESOURCE_TYPE,
  AI_CATALOG_ASSET_RESOURCE_TYPE,
  BOOST_RULE_IS_OWNER,
  BOOST_RULE_IS_NOT_CREATOR,
  BOOST_RULE_HAS_LIFECYCLE_STAGE,
  boostAgentPermissions,
  boostToolPermissions,
  boostEntityPermissions,
  boostFunctionalPermissions,
  boostPermissions,
  boostAgentResourcePermissions,
  boostToolResourcePermissions,
  boostAiCatalogResourcePermissions,
  boostAiCatalogUsageDocsPermission,
  boostAccessPermission,
  boostAdminPermission,
  boostAgentListPermission,
  boostAgentPromotePermission,
  boostToolPromotePermission,
  boostKagentiAdminPermission,
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
    it('exports boost-agent resource type', () => {
      expect(BOOST_AGENT_RESOURCE_TYPE).toBe('boost-agent');
    });

    it('exports boost-tool resource type', () => {
      expect(BOOST_TOOL_RESOURCE_TYPE).toBe('boost-tool');
    });
  });

  describe('conditional rule names', () => {
    it('exports IS_OWNER rule name', () => {
      expect(BOOST_RULE_IS_OWNER).toBe('IS_OWNER');
    });

    it('exports IS_NOT_CREATOR rule name', () => {
      expect(BOOST_RULE_IS_NOT_CREATOR).toBe('IS_NOT_CREATOR');
    });

    it('exports HAS_LIFECYCLE_STAGE rule name', () => {
      expect(BOOST_RULE_HAS_LIFECYCLE_STAGE).toBe('HAS_LIFECYCLE_STAGE');
    });
  });

  describe('agent permissions', () => {
    it('exports exactly 10 agent permissions', () => {
      expect(boostAgentPermissions).toHaveLength(10);
    });

    it('agent permissions use boost.agent.* naming', () => {
      for (const perm of boostAgentPermissions) {
        expect(perm.name).toMatch(/^boost\.agent\./);
      }
    });

    it('exports 7 resource-scoped agent permissions', () => {
      expect(boostAgentResourcePermissions).toHaveLength(7);
      for (const perm of boostAgentResourcePermissions) {
        expect(perm.resourceType).toBe(BOOST_AGENT_RESOURCE_TYPE);
      }
    });

    it('basic agent permissions have no resourceType', () => {
      expect(boostAgentListPermission).not.toHaveProperty('resourceType');
    });

    it('resource agent permissions have resourceType', () => {
      expect(boostAgentPromotePermission.resourceType).toBe(
        BOOST_AGENT_RESOURCE_TYPE,
      );
    });
  });

  describe('tool permissions', () => {
    it('exports exactly 5 tool permissions', () => {
      expect(boostToolPermissions).toHaveLength(5);
    });

    it('all tool permissions are resource-scoped', () => {
      expect(boostToolResourcePermissions).toHaveLength(5);
      for (const perm of boostToolResourcePermissions) {
        expect(perm.resourceType).toBe(BOOST_TOOL_RESOURCE_TYPE);
      }
    });

    it('tool permissions use boost.tool.* naming', () => {
      for (const perm of boostToolPermissions) {
        expect(perm.name).toMatch(/^boost\.tool\./);
      }
    });

    it('resource tool permissions have resourceType', () => {
      expect(boostToolPromotePermission.resourceType).toBe(
        BOOST_TOOL_RESOURCE_TYPE,
      );
    });
  });

  describe('resource permissions', () => {
    it('exports exactly 16 resource permissions (10 agent + 5 tool + 1 kagenti-infra)', () => {
      expect(boostEntityPermissions).toHaveLength(16);
    });

    it('includes kagenti admin permission', () => {
      expect(boostEntityPermissions).toContain(boostKagentiAdminPermission);
      expect(boostKagentiAdminPermission.name).toBe('boost.kagenti.admin');
    });
  });

  describe('ai catalog permissions', () => {
    it('exports exactly 1 ai catalog permission', () => {
      expect(boostAiCatalogResourcePermissions).toHaveLength(1);
    });

    it('is resource-scoped with resourceType ai-catalog-asset', () => {
      expect(boostAiCatalogUsageDocsPermission.resourceType).toBe(
        AI_CATALOG_ASSET_RESOURCE_TYPE,
      );
    });

    it('uses the ai-catalog.asset.read.usage-docs name', () => {
      expect(boostAiCatalogUsageDocsPermission.name).toBe(
        'ai-catalog.asset.read.usage-docs',
      );
    });
  });

  describe('functional permissions', () => {
    it('exports exactly 5 functional permissions', () => {
      expect(boostFunctionalPermissions).toHaveLength(5);
    });

    it('includes expected functional permission names', () => {
      const names = boostFunctionalPermissions.map(p => p.name);
      expect(names).toContain('boost.chat.read');
      expect(names).toContain('boost.chat.create');
      expect(names).toContain('boost.documents.manage');
      expect(names).toContain('boost.mcp.manage');
      expect(names).toContain('boost.config.manage');
    });
  });

  describe('top-level gate permissions', () => {
    it('exports boost.access permission', () => {
      expect(boostAccessPermission.name).toBe('boost.access');
    });

    it('exports boost.admin permission', () => {
      expect(boostAdminPermission.name).toBe('boost.admin');
    });
  });

  describe('combined permissions', () => {
    it('includes all 24 permissions (16 resource + 1 ai-catalog + 5 functional + 2 gate)', () => {
      expect(boostPermissions).toHaveLength(24);
    });

    it('all permission names are unique', () => {
      const names = boostPermissions.map(p => p.name);
      expect(new Set(names).size).toBe(names.length);
    });
  });

  describe('type interfaces compile correctly', () => {
    it('AgenticProvider interface has expected shape', () => {
      const descriptor: ProviderDescriptor = {
        id: 'test',
        name: 'Test Provider',
        capabilities: {},
      };

      // This is a compile-time check — if the interface is wrong,
      // TypeScript will fail before this test runs
      const mockProvider: AgenticProvider = {
        descriptor,
        chat: async (_messages: InputItem[]) => 'response',
        chatStream: async function* (_messages: InputItem[]) {
          const event: NormalizedStreamEvent = {
            type: 'text',
            text: 'hello',
          };
          yield event;
        },
      };

      expect(mockProvider.descriptor.id).toBe('test');
      expect(mockProvider.descriptor.capabilities).toBeDefined();
    });

    it('ProviderCapabilities flags are optional', () => {
      const empty: ProviderCapabilities = {};
      const full: ProviderCapabilities = {
        agentCatalog: true,
        namespaceScoping: false,
        devSpaces: true,
        buildPipelines: false,
      };
      expect(empty).toBeDefined();
      expect(full.agentCatalog).toBe(true);
    });

    it('NormalizedStreamEvent is a discriminated union', () => {
      const events: NormalizedStreamEvent[] = [
        { type: 'text', text: 'hello' },
        { type: 'reasoning', text: 'thinking...' },
        {
          type: 'tool_call',
          toolCallId: 'tc1',
          toolName: 'search',
          args: '{}',
        },
        { type: 'tool_result', toolCallId: 'tc1', content: 'result' },
        { type: 'rag_result', content: 'retrieved chunk' },
        { type: 'handoff', sourceAgent: 'agent-a', targetAgent: 'agent-b' },
        { type: 'approval', requestId: 'req-1' },
        { type: 'form', formId: 'form-1' },
        { type: 'auth' },
        { type: 'artifact', artifactId: 'art-1', content: 'code here' },
        { type: 'citation', title: 'Source', url: 'https://example.com' },
        { type: 'error', message: 'fail' },
        { type: 'done' },
      ];
      expect(events).toHaveLength(13);
      expect(events[0].type).toBe('text');
    });

    it('ConversationSummary has expected fields', () => {
      const summary: ConversationSummary = {
        id: '1',
        title: 'Test',
        createdBy: 'user:default/testuser',
        providerId: 'test-provider',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      expect(summary.id).toBe('1');
    });

    it('ConversationDetails includes messages', () => {
      const details: ConversationDetails = {
        id: '1',
        title: 'Test',
        createdBy: 'user:default/testuser',
        providerId: 'test-provider',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        messages: [
          {
            id: 'm1',
            role: 'user',
            content: 'hello',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ],
      };
      expect(details.messages).toHaveLength(1);
    });

    it('InputItem supports text, file, and image types', () => {
      const items: InputItem[] = [
        { type: 'text', text: 'hello' },
        { type: 'file', url: 'file://test.pdf', mimeType: 'application/pdf' },
        { type: 'image', url: 'https://example.com/img.png' },
      ];
      expect(items).toHaveLength(3);
    });
  });

  describe('no provider-specific types', () => {
    it('does not export provider-specific configuration types', () => {
      // This is a static verification — the common package must not
      // contain LlamaStackConfig, KagentiConfig, or similar types.
      // If someone adds them, they must add them to this deny list
      // and this test will fail the review.
      const exports = require('./index');
      const exportNames = Object.keys(exports);
      const providerSpecificPatterns = [
        /LlamaStack/i,
        /Kagenti(?!Admin)/i,
        /ResponsesApi/i,
      ];
      for (const name of exportNames) {
        for (const pattern of providerSpecificPatterns) {
          expect(name).not.toMatch(pattern);
        }
      }
    });
  });
});
