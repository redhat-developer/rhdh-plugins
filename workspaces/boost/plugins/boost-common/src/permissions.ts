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
  ResourcePermission,
} from '@backstage/plugin-permission-common';

// ---------------------------------------------------------------------------
// Resource types
// ---------------------------------------------------------------------------

/**
 * Resource type for boost agents (lifecycle-governed domain objects).
 *
 * @public
 */
export const RESOURCE_TYPE_BOOST_AGENT = 'boost-agent';

/**
 * Resource type for boost tools (Kagenti tools with lifecycle governance).
 *
 * @public
 */
export const RESOURCE_TYPE_BOOST_TOOL = 'boost-tool';

// ---------------------------------------------------------------------------
// Convenience types
// ---------------------------------------------------------------------------

/**
 * @public
 */
export type BoostAgentPermission = ResourcePermission<
  typeof RESOURCE_TYPE_BOOST_AGENT
>;

/**
 * @public
 */
export type BoostToolPermission = ResourcePermission<
  typeof RESOURCE_TYPE_BOOST_TOOL
>;

// ---------------------------------------------------------------------------
// Agent lifecycle permissions (10 total)
// ---------------------------------------------------------------------------

/**
 * Permission to view the agent list (visibility filtering).
 *
 * @public
 */
export const boostAgentListPermission = createPermission({
  name: 'boost.agent.list',
  attributes: { action: 'read' },
});

/**
 * Permission to register an agent for governance.
 *
 * @public
 */
export const boostAgentRegisterPermission = createPermission({
  name: 'boost.agent.register',
  attributes: { action: 'create' },
});

/**
 * Permission to submit a draft agent for review (draft → pending).
 * Conditional rules: IS_OWNER, HAS_LIFECYCLE_STAGE.
 *
 * @public
 */
export const boostAgentPromotePermission = createPermission({
  name: 'boost.agent.promote',
  attributes: { action: 'update' },
  resourceType: RESOURCE_TYPE_BOOST_AGENT,
});

/**
 * Permission to approve a pending agent (pending → published).
 * Conditional rules: IS_NOT_CREATOR, HAS_LIFECYCLE_STAGE.
 *
 * @public
 */
export const boostAgentApprovePermission = createPermission({
  name: 'boost.agent.approve',
  attributes: { action: 'update' },
  resourceType: RESOURCE_TYPE_BOOST_AGENT,
});

/**
 * Permission to demote an agent (reject, request-unpublish, approve-unpublish).
 *
 * @public
 */
export const boostAgentDemotePermission = createPermission({
  name: 'boost.agent.demote',
  attributes: { action: 'update' },
  resourceType: RESOURCE_TYPE_BOOST_AGENT,
});

/**
 * Permission to publish an approved agent.
 *
 * @public
 */
export const boostAgentPublishPermission = createPermission({
  name: 'boost.agent.publish',
  attributes: { action: 'update' },
  resourceType: RESOURCE_TYPE_BOOST_AGENT,
});

/**
 * Permission to request unpublishing an agent.
 * Conditional rules: IS_OWNER.
 *
 * @public
 */
export const boostAgentUnpublishPermission = createPermission({
  name: 'boost.agent.unpublish',
  attributes: { action: 'update' },
  resourceType: RESOURCE_TYPE_BOOST_AGENT,
});

/**
 * Permission to withdraw a pending submission.
 * Conditional rules: IS_OWNER.
 *
 * @public
 */
export const boostAgentWithdrawPermission = createPermission({
  name: 'boost.agent.withdraw',
  attributes: { action: 'update' },
  resourceType: RESOURCE_TYPE_BOOST_AGENT,
});

/**
 * Permission to delete an agent.
 * Conditional rules: IS_OWNER, HAS_LIFECYCLE_STAGE.
 *
 * @public
 */
export const boostAgentDeletePermission = createPermission({
  name: 'boost.agent.delete',
  attributes: { action: 'delete' },
  resourceType: RESOURCE_TYPE_BOOST_AGENT,
});

/**
 * Permission to edit agent configuration.
 *
 * @public
 */
export const boostAgentConfigurePermission = createPermission({
  name: 'boost.agent.configure',
  attributes: { action: 'update' },
});

// ---------------------------------------------------------------------------
// Tool lifecycle permissions (5 total)
// ---------------------------------------------------------------------------

/**
 * Permission to promote a tool's lifecycle stage.
 * Conditional rules: IS_OWNER.
 *
 * @public
 */
export const boostToolPromotePermission = createPermission({
  name: 'boost.tool.promote',
  attributes: { action: 'update' },
  resourceType: RESOURCE_TYPE_BOOST_TOOL,
});

/**
 * Permission to approve a tool promotion.
 * Conditional rules: IS_NOT_CREATOR.
 *
 * @public
 */
export const boostToolApprovePermission = createPermission({
  name: 'boost.tool.approve',
  attributes: { action: 'update' },
  resourceType: RESOURCE_TYPE_BOOST_TOOL,
});

/**
 * Permission to demote a tool's lifecycle stage.
 *
 * @public
 */
export const boostToolDemotePermission = createPermission({
  name: 'boost.tool.demote',
  attributes: { action: 'update' },
  resourceType: RESOURCE_TYPE_BOOST_TOOL,
});

/**
 * Permission to publish a tool.
 *
 * @public
 */
export const boostToolPublishPermission = createPermission({
  name: 'boost.tool.publish',
  attributes: { action: 'update' },
  resourceType: RESOURCE_TYPE_BOOST_TOOL,
});

/**
 * Permission to unpublish a tool.
 *
 * @public
 */
export const boostToolUnpublishPermission = createPermission({
  name: 'boost.tool.unpublish',
  attributes: { action: 'update' },
  resourceType: RESOURCE_TYPE_BOOST_TOOL,
});

// ---------------------------------------------------------------------------
// Infrastructure permission (1 total)
// ---------------------------------------------------------------------------

/**
 * Permission for Kagenti infrastructure operations
 * (namespace management, build pipelines, sandbox, platform links).
 *
 * @public
 */
export const boostKagentiAdminPermission = createPermission({
  name: 'boost.kagenti.admin',
  attributes: { action: 'update' },
});

// ---------------------------------------------------------------------------
// Functional permissions (5 total)
// ---------------------------------------------------------------------------

/**
 * Permission to view the chat interface and read messages.
 *
 * @public
 */
export const boostChatReadPermission = createPermission({
  name: 'boost.chat.read',
  attributes: { action: 'read' },
});

/**
 * Permission to send messages and start sessions.
 *
 * @public
 */
export const boostChatCreatePermission = createPermission({
  name: 'boost.chat.create',
  attributes: { action: 'create' },
});

/**
 * Permission to upload documents and sync RAG sources.
 *
 * @public
 */
export const boostDocumentsManagePermission = createPermission({
  name: 'boost.documents.manage',
  attributes: { action: 'update' },
});

/**
 * Permission to configure MCP servers.
 *
 * @public
 */
export const boostMcpManagePermission = createPermission({
  name: 'boost.mcp.manage',
  attributes: { action: 'update' },
});

/**
 * Permission to modify admin configuration.
 *
 * @public
 */
export const boostConfigManagePermission = createPermission({
  name: 'boost.config.manage',
  attributes: { action: 'update' },
});

// ---------------------------------------------------------------------------
// Top-level access and admin permissions
// ---------------------------------------------------------------------------

/**
 * Top-level gate permission. If denied, all sub-permissions are denied.
 *
 * @public
 */
export const boostAccessPermission = createPermission({
  name: 'boost.access',
  attributes: { action: 'read' },
});

/**
 * Coarse-grained admin permission for deployments that prefer
 * a single admin toggle over fine-grained permissions.
 *
 * @public
 */
export const boostAdminPermission = createPermission({
  name: 'boost.admin',
  attributes: { action: 'update' },
});

// ---------------------------------------------------------------------------
// Conditional rule names
// ---------------------------------------------------------------------------

/**
 * Conditional rule: checks `resource.createdBy === userRef`.
 *
 * @public
 */
export const BOOST_RULE_IS_OWNER = 'IS_OWNER';

/**
 * Conditional rule: checks `resource.createdBy !== userRef`.
 * Enforces separation of duties (no self-approval).
 *
 * @public
 */
export const BOOST_RULE_IS_NOT_CREATOR = 'IS_NOT_CREATOR';

/**
 * Conditional rule: checks `resource.lifecycleStage` against
 * the allowed stages for the action.
 *
 * @public
 */
export const BOOST_RULE_HAS_LIFECYCLE_STAGE = 'HAS_LIFECYCLE_STAGE';

// ---------------------------------------------------------------------------
// Aggregated permission lists
// ---------------------------------------------------------------------------

/**
 * All 16 resource permissions (10 agent + 5 tool + 1 kagenti-infra).
 *
 * @public
 */
export const boostResourcePermissions = [
  // Agent lifecycle (10)
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
  // Tool lifecycle (5)
  boostToolPromotePermission,
  boostToolApprovePermission,
  boostToolDemotePermission,
  boostToolPublishPermission,
  boostToolUnpublishPermission,
  // Infrastructure (1)
  boostKagentiAdminPermission,
];

/**
 * All 5 functional permissions.
 *
 * @public
 */
export const boostFunctionalPermissions = [
  boostChatReadPermission,
  boostChatCreatePermission,
  boostDocumentsManagePermission,
  boostMcpManagePermission,
  boostConfigManagePermission,
];

/**
 * All boost permissions (resource + functional + access/admin).
 *
 * @public
 */
export const boostPermissions = [
  ...boostResourcePermissions,
  ...boostFunctionalPermissions,
  boostAccessPermission,
  boostAdminPermission,
];
