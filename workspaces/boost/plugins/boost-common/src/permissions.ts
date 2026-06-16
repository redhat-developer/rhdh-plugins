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
  createPermission,
  type ResourcePermission,
} from '@backstage/plugin-permission-common';

// =============================================================================
// Resource Types
// =============================================================================

/**
 * Resource type for boost agents.
 * Used with resource-scoped permissions that support conditional rules.
 *
 * @public
 */
export const RESOURCE_TYPE_BOOST_AGENT = 'boost-agent';

/**
 * Resource type for boost tools.
 * Used with resource-scoped permissions that support conditional rules.
 *
 * @public
 */
export const RESOURCE_TYPE_BOOST_TOOL = 'boost-tool';

// =============================================================================
// Agent Lifecycle Permissions (Resource-Based)
// =============================================================================
// 10 agent permissions: 3 basic + 7 resource-scoped

/**
 * Permission to view the agent list.
 * @public
 */
export const boostAgentListPermission = createPermission({
  name: 'boost.agent.list',
  attributes: {
    action: 'read',
  },
});

/**
 * Permission to register an agent for governance.
 * @public
 */
export const boostAgentRegisterPermission = createPermission({
  name: 'boost.agent.register',
  attributes: {
    action: 'create',
  },
});

/**
 * Permission to submit a draft agent for review (draft -\> pending).
 * Conditional rules: IS_OWNER, HAS_LIFECYCLE_STAGE
 * @public
 */
export const boostAgentPromotePermission: ResourcePermission<'boost-agent'> =
  createPermission({
    name: 'boost.agent.promote',
    attributes: {
      action: 'update',
    },
    resourceType: RESOURCE_TYPE_BOOST_AGENT,
  });

/**
 * Permission to approve a pending agent (pending -\> published).
 * Conditional rules: IS_NOT_CREATOR, HAS_LIFECYCLE_STAGE
 * @public
 */
export const boostAgentApprovePermission: ResourcePermission<'boost-agent'> =
  createPermission({
    name: 'boost.agent.approve',
    attributes: {
      action: 'update',
    },
    resourceType: RESOURCE_TYPE_BOOST_AGENT,
  });

/**
 * Permission to demote/reject an agent.
 * @public
 */
export const boostAgentDemotePermission: ResourcePermission<'boost-agent'> =
  createPermission({
    name: 'boost.agent.demote',
    attributes: {
      action: 'update',
    },
    resourceType: RESOURCE_TYPE_BOOST_AGENT,
  });

/**
 * Permission to publish an approved agent.
 * @public
 */
export const boostAgentPublishPermission: ResourcePermission<'boost-agent'> =
  createPermission({
    name: 'boost.agent.publish',
    attributes: {
      action: 'update',
    },
    resourceType: RESOURCE_TYPE_BOOST_AGENT,
  });

/**
 * Permission to request unpublishing an agent.
 * Conditional rules: IS_OWNER
 * @public
 */
export const boostAgentUnpublishPermission: ResourcePermission<'boost-agent'> =
  createPermission({
    name: 'boost.agent.unpublish',
    attributes: {
      action: 'update',
    },
    resourceType: RESOURCE_TYPE_BOOST_AGENT,
  });

/**
 * Permission to withdraw a pending submission.
 * Conditional rules: IS_OWNER
 * @public
 */
export const boostAgentWithdrawPermission: ResourcePermission<'boost-agent'> =
  createPermission({
    name: 'boost.agent.withdraw',
    attributes: {
      action: 'update',
    },
    resourceType: RESOURCE_TYPE_BOOST_AGENT,
  });

/**
 * Permission to delete an agent.
 * Conditional rules: IS_OWNER, HAS_LIFECYCLE_STAGE
 * @public
 */
export const boostAgentDeletePermission: ResourcePermission<'boost-agent'> =
  createPermission({
    name: 'boost.agent.delete',
    attributes: {
      action: 'delete',
    },
    resourceType: RESOURCE_TYPE_BOOST_AGENT,
  });

/**
 * Permission to edit agent configuration.
 * @public
 */
export const boostAgentConfigurePermission = createPermission({
  name: 'boost.agent.configure',
  attributes: {
    action: 'update',
  },
});

// =============================================================================
// Tool Lifecycle Permissions (Resource-Based)
// =============================================================================
// 5 tool permissions: all resource-scoped

/**
 * Permission to promote a tool's lifecycle stage.
 * Conditional rules: IS_OWNER
 * @public
 */
export const boostToolPromotePermission: ResourcePermission<'boost-tool'> =
  createPermission({
    name: 'boost.tool.promote',
    attributes: {
      action: 'update',
    },
    resourceType: RESOURCE_TYPE_BOOST_TOOL,
  });

/**
 * Permission to approve a tool promotion.
 * Conditional rules: IS_NOT_CREATOR
 * @public
 */
export const boostToolApprovePermission: ResourcePermission<'boost-tool'> =
  createPermission({
    name: 'boost.tool.approve',
    attributes: {
      action: 'update',
    },
    resourceType: RESOURCE_TYPE_BOOST_TOOL,
  });

/**
 * Permission to demote a tool's lifecycle stage.
 * @public
 */
export const boostToolDemotePermission: ResourcePermission<'boost-tool'> =
  createPermission({
    name: 'boost.tool.demote',
    attributes: {
      action: 'update',
    },
    resourceType: RESOURCE_TYPE_BOOST_TOOL,
  });

/**
 * Permission to publish a tool.
 * @public
 */
export const boostToolPublishPermission: ResourcePermission<'boost-tool'> =
  createPermission({
    name: 'boost.tool.publish',
    attributes: {
      action: 'update',
    },
    resourceType: RESOURCE_TYPE_BOOST_TOOL,
  });

/**
 * Permission to unpublish a tool.
 * @public
 */
export const boostToolUnpublishPermission: ResourcePermission<'boost-tool'> =
  createPermission({
    name: 'boost.tool.unpublish',
    attributes: {
      action: 'update',
    },
    resourceType: RESOURCE_TYPE_BOOST_TOOL,
  });

// =============================================================================
// Infrastructure Permission
// =============================================================================

/**
 * Permission for Kagenti infrastructure operations
 * (namespace management, build pipelines, sandbox, platform links).
 * @public
 */
export const boostKagentiAdminPermission = createPermission({
  name: 'boost.kagenti.admin',
  attributes: {
    action: 'update',
  },
});

// =============================================================================
// Functional Permissions (non-lifecycle)
// =============================================================================

/**
 * Permission to view the chat interface and read messages.
 * @public
 */
export const boostChatReadPermission = createPermission({
  name: 'boost.chat.read',
  attributes: {
    action: 'read',
  },
});

/**
 * Permission to send messages and start sessions.
 * @public
 */
export const boostChatCreatePermission = createPermission({
  name: 'boost.chat.create',
  attributes: {
    action: 'create',
  },
});

/**
 * Permission to upload documents and sync RAG sources.
 * @public
 */
export const boostDocumentsManagePermission = createPermission({
  name: 'boost.documents.manage',
  attributes: {
    action: 'update',
  },
});

/**
 * Permission to configure MCP servers.
 * @public
 */
export const boostMcpManagePermission = createPermission({
  name: 'boost.mcp.manage',
  attributes: {
    action: 'update',
  },
});

/**
 * Permission to modify admin configuration.
 * @public
 */
export const boostConfigManagePermission = createPermission({
  name: 'boost.config.manage',
  attributes: {
    action: 'update',
  },
});

// =============================================================================
// Conditional Rule Names
// =============================================================================
//
// These are string constants for the conditional permission rules.
// The actual rule implementations live in boost-backend where
// the resource loader functions resolve agents/tools from the store.

/**
 * Conditional rule: checks resource.createdBy === currentUser.
 * Used for ownership-scoped actions.
 * @public
 */
export const BOOST_RULE_IS_OWNER = 'IS_OWNER';

/**
 * Conditional rule: checks resource.createdBy !== currentUser.
 * Used for separation-of-duties (e.g., no self-approval).
 * @public
 */
export const BOOST_RULE_IS_NOT_CREATOR = 'IS_NOT_CREATOR';

/**
 * Conditional rule: checks resource.lifecycleStage against allowed stages.
 * Used to enforce valid lifecycle transitions at the permission layer.
 * @public
 */
export const BOOST_RULE_HAS_LIFECYCLE_STAGE = 'HAS_LIFECYCLE_STAGE';

// =============================================================================
// Permission Aggregation
// =============================================================================

/**
 * All 10 agent permissions (3 basic + 7 resource-scoped).
 *
 * @public
 */
export const boostAgentPermissions = [
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
] as const;

/**
 * All 5 tool permissions (all resource-scoped).
 *
 * @public
 */
export const boostToolPermissions = [
  boostToolPromotePermission,
  boostToolApprovePermission,
  boostToolDemotePermission,
  boostToolPublishPermission,
  boostToolUnpublishPermission,
] as const;

/**
 * Infrastructure permissions (kagenti).
 *
 * @public
 */
export const boostInfraPermissions = [
  boostKagentiAdminPermission,
] as const;

/**
 * All 5 functional permissions (non-lifecycle).
 *
 * @public
 */
export const boostFunctionalPermissions = [
  boostChatReadPermission,
  boostChatCreatePermission,
  boostDocumentsManagePermission,
  boostMcpManagePermission,
  boostConfigManagePermission,
] as const;

/**
 * All boost permissions for registration via
 * `permissionsRegistry.addPermissions()`.
 *
 * @public
 */
export const boostPermissions = [
  ...boostAgentPermissions,
  ...boostToolPermissions,
  ...boostInfraPermissions,
  ...boostFunctionalPermissions,
] as const;
