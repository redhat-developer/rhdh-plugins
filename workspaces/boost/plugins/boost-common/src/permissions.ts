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

// ---------------------------------------------------------------------------
// Resource types
// ---------------------------------------------------------------------------

/**
 * Resource type for boost agents.
 *
 * @public
 */
export const BOOST_AGENT_RESOURCE_TYPE = 'boost-agent';

/**
 * Resource type for boost tools (Kagenti tools with lifecycle governance).
 *
 * @public
 */
export const BOOST_TOOL_RESOURCE_TYPE = 'boost-tool';

// ---------------------------------------------------------------------------
// Agent permissions — 10 total (3 basic + 7 resource-scoped)
// ---------------------------------------------------------------------------

/**
 * View agent list (visibility filtering).
 *
 * @public
 */
export const boostAgentListPermission = createPermission({
  name: 'boost.agent.list',
  attributes: { action: 'read' },
});

/**
 * Register an agent for governance.
 *
 * @public
 */
export const boostAgentRegisterPermission = createPermission({
  name: 'boost.agent.register',
  attributes: { action: 'create' },
});

/**
 * Edit agent configuration.
 *
 * @public
 */
export const boostAgentConfigurePermission = createPermission({
  name: 'boost.agent.configure',
  attributes: { action: 'update' },
});

/**
 * Submit draft for review (draft → pending).
 * Conditional rules: IS_OWNER, HAS_LIFECYCLE_STAGE.
 *
 * @public
 */
export const boostAgentPromotePermission = createPermission({
  name: 'boost.agent.promote',
  attributes: { action: 'update' },
  resourceType: BOOST_AGENT_RESOURCE_TYPE,
});

/**
 * Approve pending agent (pending → published).
 * Conditional rules: IS_NOT_CREATOR, HAS_LIFECYCLE_STAGE.
 *
 * @public
 */
export const boostAgentApprovePermission = createPermission({
  name: 'boost.agent.approve',
  attributes: { action: 'update' },
  resourceType: BOOST_AGENT_RESOURCE_TYPE,
});

/**
 * Reject, request-unpublish, or approve-unpublish an agent.
 *
 * @public
 */
export const boostAgentDemotePermission = createPermission({
  name: 'boost.agent.demote',
  attributes: { action: 'update' },
  resourceType: BOOST_AGENT_RESOURCE_TYPE,
});

/**
 * Publish an approved agent.
 *
 * @public
 */
export const boostAgentPublishPermission = createPermission({
  name: 'boost.agent.publish',
  attributes: { action: 'update' },
  resourceType: BOOST_AGENT_RESOURCE_TYPE,
});

/**
 * Request unpublishing of a published agent.
 * Conditional rules: IS_OWNER.
 *
 * @public
 */
export const boostAgentUnpublishPermission = createPermission({
  name: 'boost.agent.unpublish',
  attributes: { action: 'update' },
  resourceType: BOOST_AGENT_RESOURCE_TYPE,
});

/**
 * Withdraw a pending submission.
 * Conditional rules: IS_OWNER.
 *
 * @public
 */
export const boostAgentWithdrawPermission = createPermission({
  name: 'boost.agent.withdraw',
  attributes: { action: 'update' },
  resourceType: BOOST_AGENT_RESOURCE_TYPE,
});

/**
 * Delete an agent.
 * Conditional rules: IS_OWNER, HAS_LIFECYCLE_STAGE.
 *
 * @public
 */
export const boostAgentDeletePermission = createPermission({
  name: 'boost.agent.delete',
  attributes: { action: 'delete' },
  resourceType: BOOST_AGENT_RESOURCE_TYPE,
});

// ---------------------------------------------------------------------------
// Tool permissions — 5 total (all resource-scoped)
// ---------------------------------------------------------------------------

/**
 * Promote tool lifecycle.
 * Conditional rules: IS_OWNER.
 *
 * @public
 */
export const boostToolPromotePermission = createPermission({
  name: 'boost.tool.promote',
  attributes: { action: 'update' },
  resourceType: BOOST_TOOL_RESOURCE_TYPE,
});

/**
 * Approve tool promotion.
 * Conditional rules: IS_NOT_CREATOR.
 *
 * @public
 */
export const boostToolApprovePermission = createPermission({
  name: 'boost.tool.approve',
  attributes: { action: 'update' },
  resourceType: BOOST_TOOL_RESOURCE_TYPE,
});

/**
 * Demote tool lifecycle stage.
 * Conditional rules: IS_OWNER, HAS_LIFECYCLE_STAGE.
 *
 * @public
 */
export const boostToolDemotePermission = createPermission({
  name: 'boost.tool.demote',
  attributes: { action: 'update' },
  resourceType: BOOST_TOOL_RESOURCE_TYPE,
});

/**
 * Publish a tool.
 * Conditional rules: HAS_LIFECYCLE_STAGE.
 *
 * @public
 */
export const boostToolPublishPermission = createPermission({
  name: 'boost.tool.publish',
  attributes: { action: 'update' },
  resourceType: BOOST_TOOL_RESOURCE_TYPE,
});

/**
 * Unpublish a tool.
 * Conditional rules: IS_OWNER.
 *
 * @public
 */
export const boostToolUnpublishPermission = createPermission({
  name: 'boost.tool.unpublish',
  attributes: { action: 'update' },
  resourceType: BOOST_TOOL_RESOURCE_TYPE,
});

// ---------------------------------------------------------------------------
// Infrastructure permissions — 1 total
// ---------------------------------------------------------------------------

/**
 * Kagenti infrastructure admin operations (namespace management,
 * build pipelines, sandbox, platform links).
 *
 * @remarks
 * This is intentionally coarse-grained as a {@link @backstage/plugin-permission-common#BasicPermission | BasicPermission}.
 * If fine-grained infrastructure access control is needed later, consider
 * splitting this into a {@link @backstage/plugin-permission-common#ResourcePermission | ResourcePermission}
 * scoped to individual infrastructure resources.
 *
 * @public
 */
export const boostKagentiAdminPermission = createPermission({
  name: 'boost.kagenti.admin',
  attributes: { action: 'update' },
});

// ---------------------------------------------------------------------------
// Functional permissions — 5 total
// ---------------------------------------------------------------------------

/**
 * View chat interface and read messages.
 *
 * @public
 */
export const boostChatReadPermission = createPermission({
  name: 'boost.chat.read',
  attributes: { action: 'read' },
});

/**
 * Send messages and start sessions.
 *
 * @public
 */
export const boostChatCreatePermission = createPermission({
  name: 'boost.chat.create',
  attributes: { action: 'create' },
});

/**
 * Upload documents and sync RAG sources.
 *
 * @public
 */
export const boostDocumentsManagePermission = createPermission({
  name: 'boost.documents.manage',
  attributes: { action: 'update' },
});

/**
 * Configure MCP servers.
 *
 * @public
 */
export const boostMcpManagePermission = createPermission({
  name: 'boost.mcp.manage',
  attributes: { action: 'update' },
});

/**
 * Modify admin configuration.
 *
 * @public
 */
export const boostConfigManagePermission = createPermission({
  name: 'boost.config.manage',
  attributes: { action: 'update' },
});

// ---------------------------------------------------------------------------
// Top-level gate permissions
// ---------------------------------------------------------------------------

/**
 * Top-level gate permission for boost access. If denied, all
 * sub-permissions are denied.
 *
 * @public
 */
export const boostAccessPermission = createPermission({
  name: 'boost.access',
  attributes: { action: 'read' },
});

/**
 * Coarse-grained admin permission for deployments that prefer
 * a single admin gate over fine-grained permissions.
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
 * Conditional rule: checks `resource.createdBy !== userRef` for
 * separation of duties (no self-approval).
 *
 * @public
 */
export const BOOST_RULE_IS_NOT_CREATOR = 'IS_NOT_CREATOR';

/**
 * Conditional rule: checks `resource.lifecycleStage` against
 * allowed stages for the action.
 *
 * @public
 */
export const BOOST_RULE_HAS_LIFECYCLE_STAGE = 'HAS_LIFECYCLE_STAGE';

// ---------------------------------------------------------------------------
// Aggregated permission arrays
// ---------------------------------------------------------------------------

/**
 * All 10 agent permissions.
 *
 * @public
 */
export const boostAgentPermissions = [
  boostAgentListPermission,
  boostAgentRegisterPermission,
  boostAgentConfigurePermission,
  boostAgentPromotePermission,
  boostAgentApprovePermission,
  boostAgentDemotePermission,
  boostAgentPublishPermission,
  boostAgentUnpublishPermission,
  boostAgentWithdrawPermission,
  boostAgentDeletePermission,
] as const;

/**
 * All 5 tool permissions.
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
 * All 16 entity permissions (10 agent + 5 tool + 1 kagenti-infra).
 *
 * @public
 */
export const boostEntityPermissions = [
  ...boostAgentPermissions,
  ...boostToolPermissions,
  boostKagentiAdminPermission,
] as const;

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
] as const;

/**
 * All agent resource permissions (those with resourceType `boost-agent`).
 *
 * @public
 */
export const boostAgentResourcePermissions: ResourcePermission<
  typeof BOOST_AGENT_RESOURCE_TYPE
>[] = [
  boostAgentPromotePermission,
  boostAgentApprovePermission,
  boostAgentDemotePermission,
  boostAgentPublishPermission,
  boostAgentUnpublishPermission,
  boostAgentWithdrawPermission,
  boostAgentDeletePermission,
];

/**
 * All tool resource permissions (those with resourceType `boost-tool`).
 *
 * @public
 */
export const boostToolResourcePermissions: ResourcePermission<
  typeof BOOST_TOOL_RESOURCE_TYPE
>[] = [
  boostToolPromotePermission,
  boostToolApprovePermission,
  boostToolDemotePermission,
  boostToolPublishPermission,
  boostToolUnpublishPermission,
];

/**
 * All boost permissions combined for registration via
 * `permissionsRegistry.addPermissions()`.
 *
 * @public
 */
export const boostPermissions = [
  ...boostEntityPermissions,
  ...boostFunctionalPermissions,
  boostAccessPermission,
  boostAdminPermission,
] as const;
