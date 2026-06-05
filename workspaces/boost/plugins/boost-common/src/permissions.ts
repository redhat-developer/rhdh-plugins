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

import { createPermission } from '@backstage/plugin-permission-common';

// =============================================================================
// Resource Types
// =============================================================================

/**
 * Resource type for Boost agents subject to lifecycle governance.
 * @public
 */
export const BOOST_AGENT_RESOURCE_TYPE = 'boost-agent';

/**
 * Resource type for Boost tools (Kagenti tools) subject to lifecycle governance.
 * @public
 */
export const BOOST_TOOL_RESOURCE_TYPE = 'boost-tool';

// =============================================================================
// Top-Level Permissions
// =============================================================================

/**
 * Permission to access the Boost plugin.
 *
 * Controls access to ALL Boost features. Serves as a top-level gate:
 * if denied, all sub-permissions are denied.
 *
 * @public
 */
export const boostAccessPermission = createPermission({
  name: 'boost.access',
  attributes: {
    action: 'read',
  },
});

/**
 * Permission for coarse-grained admin access.
 *
 * Deployments that prefer a single admin permission over fine-grained
 * control can grant this. The `authorizeLifecycleAction` middleware
 * falls back to this on fine-grained DENY.
 *
 * @public
 */
export const boostAdminPermission = createPermission({
  name: 'boost.admin',
  attributes: {
    action: 'update',
  },
});

// =============================================================================
// Agent Lifecycle Permissions (Resource-Based)
// =============================================================================

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
 * Permission to promote an agent (draft -> pending).
 * Conditional rules: IS_OWNER, HAS_LIFECYCLE_STAGE.
 * @public
 */
export const boostAgentPromotePermission = createPermission({
  name: 'boost.agent.promote',
  attributes: {
    action: 'update',
  },
  resourceType: BOOST_AGENT_RESOURCE_TYPE,
});

/**
 * Permission to approve a pending agent (pending -> published).
 * Conditional rules: IS_NOT_CREATOR, HAS_LIFECYCLE_STAGE.
 * @public
 */
export const boostAgentApprovePermission = createPermission({
  name: 'boost.agent.approve',
  attributes: {
    action: 'update',
  },
  resourceType: BOOST_AGENT_RESOURCE_TYPE,
});

/**
 * Permission to demote an agent (reject, request-unpublish, approve-unpublish).
 * @public
 */
export const boostAgentDemotePermission = createPermission({
  name: 'boost.agent.demote',
  attributes: {
    action: 'update',
  },
  resourceType: BOOST_AGENT_RESOURCE_TYPE,
});

/**
 * Permission to publish an approved agent.
 * @public
 */
export const boostAgentPublishPermission = createPermission({
  name: 'boost.agent.publish',
  attributes: {
    action: 'update',
  },
  resourceType: BOOST_AGENT_RESOURCE_TYPE,
});

/**
 * Permission to request unpublishing of an agent.
 * Conditional rule: IS_OWNER.
 * @public
 */
export const boostAgentUnpublishPermission = createPermission({
  name: 'boost.agent.unpublish',
  attributes: {
    action: 'update',
  },
  resourceType: BOOST_AGENT_RESOURCE_TYPE,
});

/**
 * Permission to withdraw a pending agent submission.
 * Conditional rule: IS_OWNER.
 * @public
 */
export const boostAgentWithdrawPermission = createPermission({
  name: 'boost.agent.withdraw',
  attributes: {
    action: 'update',
  },
  resourceType: BOOST_AGENT_RESOURCE_TYPE,
});

/**
 * Permission to delete an agent.
 * Conditional rules: IS_OWNER, HAS_LIFECYCLE_STAGE.
 * @public
 */
export const boostAgentDeletePermission = createPermission({
  name: 'boost.agent.delete',
  attributes: {
    action: 'delete',
  },
  resourceType: BOOST_AGENT_RESOURCE_TYPE,
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

/**
 * Permission to promote a tool's lifecycle stage.
 * Conditional rule: IS_OWNER.
 * @public
 */
export const boostToolPromotePermission = createPermission({
  name: 'boost.tool.promote',
  attributes: {
    action: 'update',
  },
  resourceType: BOOST_TOOL_RESOURCE_TYPE,
});

/**
 * Permission to approve tool promotion.
 * Conditional rule: IS_NOT_CREATOR.
 * @public
 */
export const boostToolApprovePermission = createPermission({
  name: 'boost.tool.approve',
  attributes: {
    action: 'update',
  },
  resourceType: BOOST_TOOL_RESOURCE_TYPE,
});

/**
 * Permission to demote a tool's lifecycle stage.
 * @public
 */
export const boostToolDemotePermission = createPermission({
  name: 'boost.tool.demote',
  attributes: {
    action: 'update',
  },
  resourceType: BOOST_TOOL_RESOURCE_TYPE,
});

/**
 * Permission to publish a tool.
 * @public
 */
export const boostToolPublishPermission = createPermission({
  name: 'boost.tool.publish',
  attributes: {
    action: 'update',
  },
  resourceType: BOOST_TOOL_RESOURCE_TYPE,
});

/**
 * Permission to unpublish a tool.
 * @public
 */
export const boostToolUnpublishPermission = createPermission({
  name: 'boost.tool.unpublish',
  attributes: {
    action: 'update',
  },
  resourceType: BOOST_TOOL_RESOURCE_TYPE,
});

// =============================================================================
// Infrastructure Permission
// =============================================================================

/**
 * Permission for Kagenti infrastructure operations.
 *
 * Covers namespace management, build pipelines, sandbox, and platform links.
 *
 * @public
 */
export const boostKagentiAdminPermission = createPermission({
  name: 'boost.kagenti.admin',
  attributes: {
    action: 'update',
  },
});

// =============================================================================
// Functional Area Permissions (non-lifecycle)
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
// Conditional Permission Rules
// =============================================================================

/**
 * Conditional rule names for use in permission policies.
 *
 * These are string identifiers that the permission policy evaluates
 * against loaded resources:
 *
 * - `IS_OWNER`: `resource.createdBy === currentUser`
 * - `IS_NOT_CREATOR`: `resource.createdBy !== currentUser` (separation of duties)
 * - `HAS_LIFECYCLE_STAGE`: `resource.lifecycleStage in allowedStages`
 *
 * @public
 */
export const BOOST_PERMISSION_RULES = {
  IS_OWNER: 'IS_OWNER',
  IS_NOT_CREATOR: 'IS_NOT_CREATOR',
  HAS_LIFECYCLE_STAGE: 'HAS_LIFECYCLE_STAGE',
} as const;

// =============================================================================
// Permission Collection
// =============================================================================

/**
 * All Boost permissions.
 *
 * Register these via `permissionsRegistry.addPermissions()` in the backend plugin.
 *
 * @example
 * ```yaml
 * permission:
 *   enabled: true
 *   rbac:
 *     policies:
 *       - g, group:default/boost-users, role:default/boost-user
 *       - p, role:default/boost-user, boost.access, read, allow
 *       - p, role:default/boost-user, boost.chat.read, read, allow
 *       - p, role:default/boost-user, boost.chat.create, create, allow
 *       - g, group:default/boost-admins, role:default/boost-admin
 *       - p, role:default/boost-admin, boost.admin, update, allow
 * ```
 *
 * @public
 */
export const boostPermissions = [
  // Top-level
  boostAccessPermission,
  boostAdminPermission,
  // Agent lifecycle
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
  // Tool lifecycle
  boostToolPromotePermission,
  boostToolApprovePermission,
  boostToolDemotePermission,
  boostToolPublishPermission,
  boostToolUnpublishPermission,
  // Infrastructure
  boostKagentiAdminPermission,
  // Functional
  boostChatReadPermission,
  boostChatCreatePermission,
  boostDocumentsManagePermission,
  boostMcpManagePermission,
  boostConfigManagePermission,
];
