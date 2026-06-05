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

// ---------------------------------------------------------------------------
// Resource types
// ---------------------------------------------------------------------------

/**
 * Resource type for boost agents subject to lifecycle governance.
 * @public
 */
export const RESOURCE_TYPE_BOOST_AGENT = 'boost-agent';

/**
 * Resource type for boost tools (Kagenti tools with lifecycle governance).
 * @public
 */
export const RESOURCE_TYPE_BOOST_TOOL = 'boost-tool';

// ---------------------------------------------------------------------------
// Agent permissions (10 resource permissions)
// ---------------------------------------------------------------------------

/**
 * Permission to view the agent list (visibility filtering).
 * @public
 */
export const boostAgentListPermission = createPermission({
  name: 'boost.agent.list',
  attributes: { action: 'read' },
});

/**
 * Permission to register an agent for governance.
 * @public
 */
export const boostAgentRegisterPermission = createPermission({
  name: 'boost.agent.register',
  attributes: { action: 'create' },
});

/**
 * Permission to submit a draft agent for review (draft to pending).
 * Conditional rules: IS_OWNER, HAS_LIFECYCLE_STAGE.
 * @public
 */
export const boostAgentPromotePermission = createPermission({
  name: 'boost.agent.promote',
  attributes: { action: 'update' },
  resourceType: RESOURCE_TYPE_BOOST_AGENT,
});

/**
 * Permission to approve a pending agent (pending to published).
 * Conditional rules: IS_NOT_CREATOR, HAS_LIFECYCLE_STAGE.
 * @public
 */
export const boostAgentApprovePermission = createPermission({
  name: 'boost.agent.approve',
  attributes: { action: 'update' },
  resourceType: RESOURCE_TYPE_BOOST_AGENT,
});

/**
 * Permission to demote an agent (reject, request-unpublish, approve-unpublish).
 * @public
 */
export const boostAgentDemotePermission = createPermission({
  name: 'boost.agent.demote',
  attributes: { action: 'update' },
  resourceType: RESOURCE_TYPE_BOOST_AGENT,
});

/**
 * Permission to publish an approved agent.
 * @public
 */
export const boostAgentPublishPermission = createPermission({
  name: 'boost.agent.publish',
  attributes: { action: 'update' },
  resourceType: RESOURCE_TYPE_BOOST_AGENT,
});

/**
 * Permission to request unpublishing of an agent.
 * Conditional rules: IS_OWNER.
 * @public
 */
export const boostAgentUnpublishPermission = createPermission({
  name: 'boost.agent.unpublish',
  attributes: { action: 'update' },
  resourceType: RESOURCE_TYPE_BOOST_AGENT,
});

/**
 * Permission to withdraw a pending agent submission.
 * Conditional rules: IS_OWNER.
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
 * @public
 */
export const boostAgentDeletePermission = createPermission({
  name: 'boost.agent.delete',
  attributes: { action: 'delete' },
  resourceType: RESOURCE_TYPE_BOOST_AGENT,
});

/**
 * Permission to edit agent configuration.
 * @public
 */
export const boostAgentConfigurePermission = createPermission({
  name: 'boost.agent.configure',
  attributes: { action: 'update' },
});

// ---------------------------------------------------------------------------
// Tool permissions (5 resource permissions)
// ---------------------------------------------------------------------------

/**
 * Permission to promote a tool lifecycle stage.
 * Conditional rules: IS_OWNER.
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
 * @public
 */
export const boostToolApprovePermission = createPermission({
  name: 'boost.tool.approve',
  attributes: { action: 'update' },
  resourceType: RESOURCE_TYPE_BOOST_TOOL,
});

/**
 * Permission to demote a tool lifecycle stage.
 * @public
 */
export const boostToolDemotePermission = createPermission({
  name: 'boost.tool.demote',
  attributes: { action: 'update' },
  resourceType: RESOURCE_TYPE_BOOST_TOOL,
});

/**
 * Permission to publish a tool.
 * @public
 */
export const boostToolPublishPermission = createPermission({
  name: 'boost.tool.publish',
  attributes: { action: 'update' },
  resourceType: RESOURCE_TYPE_BOOST_TOOL,
});

/**
 * Permission to unpublish a tool.
 * @public
 */
export const boostToolUnpublishPermission = createPermission({
  name: 'boost.tool.unpublish',
  attributes: { action: 'update' },
  resourceType: RESOURCE_TYPE_BOOST_TOOL,
});

// ---------------------------------------------------------------------------
// Infrastructure permission (1)
// ---------------------------------------------------------------------------

/**
 * Permission for Kagenti infrastructure operations (namespace management,
 * build pipelines, sandbox, platform links).
 * @public
 */
export const boostKagentiAdminPermission = createPermission({
  name: 'boost.kagenti.admin',
  attributes: { action: 'update' },
});

// ---------------------------------------------------------------------------
// Functional permissions (5)
// ---------------------------------------------------------------------------

/**
 * Permission to view the chat interface and read messages.
 * @public
 */
export const boostChatReadPermission = createPermission({
  name: 'boost.chat.read',
  attributes: { action: 'read' },
});

/**
 * Permission to send messages and start sessions.
 * @public
 */
export const boostChatCreatePermission = createPermission({
  name: 'boost.chat.create',
  attributes: { action: 'create' },
});

/**
 * Permission to upload documents and sync RAG sources.
 * @public
 */
export const boostDocumentsManagePermission = createPermission({
  name: 'boost.documents.manage',
  attributes: { action: 'update' },
});

/**
 * Permission to configure MCP servers.
 * @public
 */
export const boostMcpManagePermission = createPermission({
  name: 'boost.mcp.manage',
  attributes: { action: 'update' },
});

/**
 * Permission to modify admin configuration.
 * @public
 */
export const boostConfigManagePermission = createPermission({
  name: 'boost.config.manage',
  attributes: { action: 'update' },
});

// ---------------------------------------------------------------------------
// Conditional rule names
// ---------------------------------------------------------------------------

/**
 * Conditional rule name: checks resource.createdBy === currentUser.
 * Used for ownership-scoped actions (promote, unpublish, withdraw, delete).
 * @public
 */
export const BOOST_RULE_IS_OWNER = 'IS_OWNER';

/**
 * Conditional rule name: checks resource.createdBy !== currentUser.
 * Enforces separation of duties (no self-approval).
 * @public
 */
export const BOOST_RULE_IS_NOT_CREATOR = 'IS_NOT_CREATOR';

/**
 * Conditional rule name: checks resource.lifecycleStage against
 * allowed stages for the action. Blocks invalid lifecycle transitions.
 * @public
 */
export const BOOST_RULE_HAS_LIFECYCLE_STAGE = 'HAS_LIFECYCLE_STAGE';

// ---------------------------------------------------------------------------
// Aggregated permission arrays
// ---------------------------------------------------------------------------

/**
 * All 10 agent permissions.
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
];

/**
 * All 5 tool permissions.
 * @public
 */
export const boostToolPermissions = [
  boostToolPromotePermission,
  boostToolApprovePermission,
  boostToolDemotePermission,
  boostToolPublishPermission,
  boostToolUnpublishPermission,
];

/**
 * All 16 resource permissions (10 agent + 5 tool + 1 kagenti-infra).
 * @public
 */
export const boostResourcePermissions = [
  ...boostAgentPermissions,
  ...boostToolPermissions,
  boostKagentiAdminPermission,
];

/**
 * All 5 functional permissions.
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
 * All 21 boost permissions (16 resource + 5 functional).
 * @public
 */
export const boostPermissions = [
  ...boostResourcePermissions,
  ...boostFunctionalPermissions,
];
