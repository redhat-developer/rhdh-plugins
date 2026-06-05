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
  boostAccessPermission,
  boostAdminPermission,
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
  boostPermissions,
  BOOST_AGENT_RESOURCE_TYPE,
  BOOST_TOOL_RESOURCE_TYPE,
  BOOST_PERMISSION_RULES,
} from './permissions';

describe('permissions', () => {
  describe('top-level permissions', () => {
    it('boostAccessPermission has the correct name and action', () => {
      expect(boostAccessPermission.name).toBe('boost.access');
      expect(boostAccessPermission.attributes).toEqual({ action: 'read' });
    });

    it('boostAdminPermission has the correct name and action', () => {
      expect(boostAdminPermission.name).toBe('boost.admin');
      expect(boostAdminPermission.attributes).toEqual({ action: 'update' });
    });
  });

  describe('agent lifecycle permissions', () => {
    it('defines all 10 agent permissions with correct names', () => {
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

    it('resource-based agent permissions declare the boost-agent resource type', () => {
      const resourcePermissions = [
        boostAgentPromotePermission,
        boostAgentApprovePermission,
        boostAgentDemotePermission,
        boostAgentPublishPermission,
        boostAgentUnpublishPermission,
        boostAgentWithdrawPermission,
        boostAgentDeletePermission,
      ];
      for (const perm of resourcePermissions) {
        expect(perm.resourceType).toBe(BOOST_AGENT_RESOURCE_TYPE);
      }
    });

    it('non-resource agent permissions do not have a resource type', () => {
      expect('resourceType' in boostAgentListPermission).toBe(false);
      expect('resourceType' in boostAgentRegisterPermission).toBe(false);
      expect('resourceType' in boostAgentConfigurePermission).toBe(false);
    });

    it('boostAgentDeletePermission has delete action', () => {
      expect(boostAgentDeletePermission.attributes).toEqual({
        action: 'delete',
      });
    });
  });

  describe('tool lifecycle permissions', () => {
    it('defines all 5 tool permissions with correct names', () => {
      expect(boostToolPromotePermission.name).toBe('boost.tool.promote');
      expect(boostToolApprovePermission.name).toBe('boost.tool.approve');
      expect(boostToolDemotePermission.name).toBe('boost.tool.demote');
      expect(boostToolPublishPermission.name).toBe('boost.tool.publish');
      expect(boostToolUnpublishPermission.name).toBe('boost.tool.unpublish');
    });

    it('all tool permissions declare the boost-tool resource type', () => {
      const toolPermissions = [
        boostToolPromotePermission,
        boostToolApprovePermission,
        boostToolDemotePermission,
        boostToolPublishPermission,
        boostToolUnpublishPermission,
      ];
      for (const perm of toolPermissions) {
        expect(perm.resourceType).toBe(BOOST_TOOL_RESOURCE_TYPE);
      }
    });
  });

  describe('infrastructure permission', () => {
    it('boostKagentiAdminPermission has the correct name', () => {
      expect(boostKagentiAdminPermission.name).toBe('boost.kagenti.admin');
      expect(boostKagentiAdminPermission.attributes).toEqual({
        action: 'update',
      });
    });
  });

  describe('functional permissions', () => {
    it('defines all 5 functional permissions', () => {
      expect(boostChatReadPermission.name).toBe('boost.chat.read');
      expect(boostChatReadPermission.attributes).toEqual({ action: 'read' });

      expect(boostChatCreatePermission.name).toBe('boost.chat.create');
      expect(boostChatCreatePermission.attributes).toEqual({
        action: 'create',
      });

      expect(boostDocumentsManagePermission.name).toBe(
        'boost.documents.manage',
      );
      expect(boostDocumentsManagePermission.attributes).toEqual({
        action: 'update',
      });

      expect(boostMcpManagePermission.name).toBe('boost.mcp.manage');
      expect(boostMcpManagePermission.attributes).toEqual({
        action: 'update',
      });

      expect(boostConfigManagePermission.name).toBe('boost.config.manage');
      expect(boostConfigManagePermission.attributes).toEqual({
        action: 'update',
      });
    });
  });

  describe('resource types', () => {
    it('defines the correct resource type strings', () => {
      expect(BOOST_AGENT_RESOURCE_TYPE).toBe('boost-agent');
      expect(BOOST_TOOL_RESOURCE_TYPE).toBe('boost-tool');
    });
  });

  describe('conditional permission rules', () => {
    it('defines all three conditional rules', () => {
      expect(BOOST_PERMISSION_RULES.IS_OWNER).toBe('IS_OWNER');
      expect(BOOST_PERMISSION_RULES.IS_NOT_CREATOR).toBe('IS_NOT_CREATOR');
      expect(BOOST_PERMISSION_RULES.HAS_LIFECYCLE_STAGE).toBe(
        'HAS_LIFECYCLE_STAGE',
      );
    });
  });

  describe('boostPermissions collection', () => {
    it('contains all 23 permissions', () => {
      expect(boostPermissions).toHaveLength(23);
    });

    it('includes top-level permissions', () => {
      expect(boostPermissions).toContain(boostAccessPermission);
      expect(boostPermissions).toContain(boostAdminPermission);
    });

    it('includes all agent lifecycle permissions', () => {
      expect(boostPermissions).toContain(boostAgentListPermission);
      expect(boostPermissions).toContain(boostAgentRegisterPermission);
      expect(boostPermissions).toContain(boostAgentPromotePermission);
      expect(boostPermissions).toContain(boostAgentApprovePermission);
      expect(boostPermissions).toContain(boostAgentDemotePermission);
      expect(boostPermissions).toContain(boostAgentPublishPermission);
      expect(boostPermissions).toContain(boostAgentUnpublishPermission);
      expect(boostPermissions).toContain(boostAgentWithdrawPermission);
      expect(boostPermissions).toContain(boostAgentDeletePermission);
      expect(boostPermissions).toContain(boostAgentConfigurePermission);
    });

    it('includes all tool lifecycle permissions', () => {
      expect(boostPermissions).toContain(boostToolPromotePermission);
      expect(boostPermissions).toContain(boostToolApprovePermission);
      expect(boostPermissions).toContain(boostToolDemotePermission);
      expect(boostPermissions).toContain(boostToolPublishPermission);
      expect(boostPermissions).toContain(boostToolUnpublishPermission);
    });

    it('includes infrastructure permission', () => {
      expect(boostPermissions).toContain(boostKagentiAdminPermission);
    });

    it('includes functional permissions', () => {
      expect(boostPermissions).toContain(boostChatReadPermission);
      expect(boostPermissions).toContain(boostChatCreatePermission);
      expect(boostPermissions).toContain(boostDocumentsManagePermission);
      expect(boostPermissions).toContain(boostMcpManagePermission);
      expect(boostPermissions).toContain(boostConfigManagePermission);
    });

    it('all permissions have names starting with boost.', () => {
      for (const perm of boostPermissions) {
        expect(perm.name).toMatch(/^boost\./);
      }
    });

    it('all permission names are unique', () => {
      const names = boostPermissions.map(p => p.name);
      expect(new Set(names).size).toBe(names.length);
    });
  });
});
