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

import type {
  BackstageCredentials,
  BackstageUserPrincipal,
  LoggerService,
  PermissionsService,
  UserInfoService,
} from '@backstage/backend-plugin-api';
import { NotAllowedError } from '@backstage/errors';
import {
  AuthorizeResult,
  BasicPermission,
  PolicyDecision,
  ResourcePermission,
} from '@backstage/plugin-permission-common';
import { ConditionTransformer } from '@backstage/plugin-permission-node';

import {
  FieldFilter,
  Filter,
  NestedFilter,
  orchestratorInstanceAdminViewPermission,
  orchestratorWorkflowPermission,
  orchestratorWorkflowSpecificPermission, // @deprecated Remove in next release
  orchestratorWorkflowUseSpecificPermission, // @deprecated Remove in next release
  WorkflowOverviewListResultDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { OrchestratorFilters, WorkflowIdParam } from './permission-rules';

/**
 * Credentials-based, shared authorization helpers used by both the HTTP
 * router (`service/router.ts`) and the Orchestrator MCP actions
 * (`actions/*.ts`). `router.ts` resolves `credentials` from the incoming
 * `HttpRequest` once per handler and otherwise defers to these functions
 * unchanged, so this module is the single source of truth for Orchestrator's
 * authorization rules.
 */

/**
 * Evaluates a transformed permission-condition tree against a single
 * workflow. Mirrors the shape produced by `ConditionTransformer<OrchestratorFilters>`
 * (see `permission-rules.ts`'s `isWorkflowId` rule's `toQuery`), i.e. the
 * *post-transform* filter tree, not the raw `PermissionCondition` tree.
 */
export const matchesWorkflowId = (
  workflow: WorkflowIdParam,
  filters?: OrchestratorFilters,
): boolean => {
  if (!filters) {
    return true;
  }

  if ('allOf' in filters) {
    return filters.allOf.every(filter => matchesWorkflowId(workflow, filter));
  }

  if ('anyOf' in filters) {
    return filters.anyOf.some(filter => matchesWorkflowId(workflow, filter));
  }

  if ('not' in filters) {
    return !matchesWorkflowId(workflow, filters.not);
  }

  return filters.values.includes(workflow.workflowId);
};

/**
 * Authorizes a (possibly resource-scoped) orchestrator permission for the
 * given credentials.
 */
export const authorize = async (
  credentials: BackstageCredentials,
  genericPermission:
    ResourcePermission<'orchestrator-workflow'> | BasicPermission,
  permissionsSvc: PermissionsService,
): Promise<PolicyDecision> => {
  if (genericPermission.type === 'resource') {
    const decisions = await permissionsSvc.authorizeConditional(
      [{ permission: genericPermission }],
      { credentials },
    );
    return decisions[0];
  }
  const decision = (
    await permissionsSvc.authorize([{ permission: genericPermission }], {
      credentials,
    })
  )[0];
  return decision;
};

// @deprecated Remove in next release — legacy dynamic permission fallback
const legacyAuthorize = async (
  credentials: BackstageCredentials,
  specificPermission: BasicPermission,
  permissionsSvc: PermissionsService,
  logger: LoggerService,
): Promise<boolean> => {
  const [decision] = await permissionsSvc.authorize(
    [{ permission: specificPermission }],
    { credentials },
  );
  if (decision.result === AuthorizeResult.ALLOW) {
    logger.warn(
      `Dynamic permission "${specificPermission.name}" granted access. ` +
        `This permission is deprecated. Migrate to conditional policies with IS_ALLOWED_WORKFLOW_ID rule.`,
    );
    return true;
  }
  return false;
};

// @deprecated Remove in next release — batched legacy fallback for list filtering
const legacyAuthorizeBatch = async (
  credentials: BackstageCredentials,
  workflowIds: string[],
  specificPermissionFactory: (workflowId: string) => BasicPermission,
  permissionsSvc: PermissionsService,
  logger: LoggerService,
): Promise<string[]> => {
  if (workflowIds.length === 0) {
    return [];
  }

  const specificWorkflowRequests = workflowIds.map(workflowId => ({
    permission: specificPermissionFactory(workflowId),
  }));

  const decisions = await permissionsSvc.authorize(specificWorkflowRequests, {
    credentials,
  });

  const legacyAllowed: string[] = [];
  workflowIds.forEach((workflowId, idx) => {
    if (decisions[idx]?.result === AuthorizeResult.ALLOW) {
      const permission = specificPermissionFactory(workflowId);
      logger.warn(
        `Dynamic permission "${permission.name}" granted access. ` +
          `This permission is deprecated. Migrate to conditional policies with IS_ALLOWED_WORKFLOW_ID rule.`,
      );
      legacyAllowed.push(workflowId);
    }
  });

  return legacyAllowed;
};

/**
 * Whether the caller holds `orchestrator.instanceAdminView`, which grants
 * visibility into instances initiated by other entities.
 */
export const isUserAuthorizedForInstanceAdminViewPermission = async (
  credentials: BackstageCredentials,
  permissionsSvc: PermissionsService,
): Promise<boolean> => {
  const [decision] = await permissionsSvc.authorize(
    [{ permission: orchestratorInstanceAdminViewPermission }],
    { credentials },
  );

  return decision.result === AuthorizeResult.ALLOW;
};

/**
 * Filters `workflowIds` down to the ones the caller is authorized to see
 * under `orchestratorWorkflowPermission`, combining conditional rule
 * matches with the deprecated per-workflow dynamic permission fallback.
 */
export const filterAuthorizedWorkflowIds = async (
  credentials: BackstageCredentials,
  permissionsSvc: PermissionsService,
  workflowIds: string[],
  conditionTransformer: ConditionTransformer<OrchestratorFilters>,
  logger: LoggerService,
): Promise<string[]> => {
  const [genericDecision] = await permissionsSvc.authorizeConditional(
    [{ permission: orchestratorWorkflowPermission }],
    { credentials },
  );

  if (genericDecision.result === AuthorizeResult.ALLOW) {
    return workflowIds;
  }

  let conditionallyAllowed: string[] = [];
  let remainingIds: string[] = workflowIds;

  if (genericDecision.result === AuthorizeResult.CONDITIONAL) {
    const filters = conditionTransformer(genericDecision.conditions);
    conditionallyAllowed = workflowIds.filter(id =>
      matchesWorkflowId({ workflowId: id }, filters),
    );
    remainingIds = workflowIds.filter(id => !conditionallyAllowed.includes(id));
  }

  // @deprecated Remove this legacy fallback block in next release
  if (remainingIds.length > 0) {
    const legacyAllowed = await legacyAuthorizeBatch(
      credentials,
      remainingIds,
      orchestratorWorkflowSpecificPermission,
      permissionsSvc,
      logger,
    );
    return [...conditionallyAllowed, ...legacyAllowed];
  }

  return conditionallyAllowed;
};

/**
 * Filters a `WorkflowOverviewListResultDTO`'s `overviews` down to the
 * workflows the caller is authorized to see.
 */
export const filterAuthorizedWorkflows = async (
  credentials: BackstageCredentials,
  permissionsSvc: PermissionsService,
  workflows: WorkflowOverviewListResultDTO,
  conditionTransformer: ConditionTransformer<OrchestratorFilters>,
  logger: LoggerService,
): Promise<WorkflowOverviewListResultDTO> => {
  if (!workflows.overviews) {
    return workflows;
  }

  const authorizedWorkflowIds = await filterAuthorizedWorkflowIds(
    credentials,
    permissionsSvc,
    workflows.overviews.map(w => w.workflowId),
    conditionTransformer,
    logger,
  );

  return {
    ...workflows,
    overviews: workflows.overviews.filter(w =>
      authorizedWorkflowIds.includes(w.workflowId),
    ),
  };
};

/**
 * Determines whether `workflowId` is allowed under `genericPermission`,
 * given an already-resolved `decision` for that permission. Applies the
 * conditional-rule match first, then falls back to the deprecated
 * per-workflow dynamic permission during the migration window.
 */
export const isWorkflowAccessAllowed = async (
  credentials: BackstageCredentials,
  decision: PolicyDecision,
  workflowId: string,
  genericPermission: ResourcePermission<'orchestrator-workflow'>,
  conditionTransformer: ConditionTransformer<OrchestratorFilters>,
  permissionsSvc: PermissionsService,
  logger: LoggerService,
): Promise<boolean> => {
  if (decision.result === AuthorizeResult.ALLOW) {
    return true;
  }

  if (decision.result === AuthorizeResult.CONDITIONAL) {
    const filters = conditionTransformer(decision.conditions);
    if (matchesWorkflowId({ workflowId }, filters)) {
      return true;
    }
  }

  // @deprecated Remove this legacy fallback block in next release
  const specificPermission =
    genericPermission === orchestratorWorkflowPermission
      ? orchestratorWorkflowSpecificPermission(workflowId)
      : orchestratorWorkflowUseSpecificPermission(workflowId);

  return legacyAuthorize(
    credentials,
    specificPermission,
    permissionsSvc,
    logger,
  );
};

/**
 * Asserts that `workflowId` is allowed under `genericPermission`, throwing
 * `NotAllowedError` on deny. Used directly by MCP actions. `router.ts` keeps
 * its own thin wrapper around `isWorkflowAccessAllowed` so it can preserve
 * its existing audit-event integration and `UnauthorizedError` type on deny.
 */
export const assertWorkflowAccess = async (
  credentials: BackstageCredentials,
  decision: PolicyDecision,
  workflowId: string,
  genericPermission: ResourcePermission<'orchestrator-workflow'>,
  conditionTransformer: ConditionTransformer<OrchestratorFilters>,
  permissionsSvc: PermissionsService,
  logger: LoggerService,
): Promise<void> => {
  const allowed = await isWorkflowAccessAllowed(
    credentials,
    decision,
    workflowId,
    genericPermission,
    conditionTransformer,
    permissionsSvc,
    logger,
  );

  if (!allowed) {
    throw new NotAllowedError(
      `Access to workflow "${workflowId}" denied by permission "${genericPermission.name}"`,
    );
  }
};

/**
 * Combines `authorize` + `assertWorkflowAccess`: authorizes `genericPermission`
 * for the caller, then asserts that `workflowId` specifically is covered by
 * the resulting decision, throwing `NotAllowedError` on deny. Used by MCP
 * actions that operate on a single, already-known workflow id (`get-instance`,
 * `get-workflow-schema`, `execute-workflow`), where the intermediate
 * `PolicyDecision` has no other use.
 */
export const authorizeWorkflowAccess = async (
  credentials: BackstageCredentials,
  workflowId: string,
  genericPermission: ResourcePermission<'orchestrator-workflow'>,
  conditionTransformer: ConditionTransformer<OrchestratorFilters>,
  permissionsSvc: PermissionsService,
  logger: LoggerService,
): Promise<void> => {
  const decision = await authorize(
    credentials,
    genericPermission,
    permissionsSvc,
  );
  await assertWorkflowAccess(
    credentials,
    decision,
    workflowId,
    genericPermission,
    conditionTransformer,
    permissionsSvc,
    logger,
  );
};

/**
 * Asserts that the caller isn't outright denied `genericPermission`, throwing
 * `NotAllowedError` on a generic `DENY`. Used by MCP actions that list
 * multiple workflows/instances (`list-workflows`, `list-instances`) before
 * narrowing down to specific ids via `filterAuthorizedWorkflowIds`, since an
 * outright deny must surface as an error rather than silently filter down to
 * an empty result.
 */
export const assertAnyWorkflowAccess = async (
  credentials: BackstageCredentials,
  permissionsSvc: PermissionsService,
  genericPermission: ResourcePermission<'orchestrator-workflow'>,
): Promise<void> => {
  const decision = await authorize(
    credentials,
    genericPermission,
    permissionsSvc,
  );

  if (decision.result === AuthorizeResult.DENY) {
    throw new NotAllowedError(
      `Access denied by permission "${genericPermission.name}"`,
    );
  }
};

/**
 * Synthetic identity recorded (by `execute-workflow`) and checked (by
 * ownership filters/assertions) for callers whose credentials are not a
 * real Backstage user principal - most notably MCP clients authenticated
 * via a `backend.auth.externalAccess` static token, which Backstage always
 * resolves to a *service* principal, never a *user* one (see
 * `DefaultAuthService.authenticate`). `UserInfoService.getUserInfo()`
 * unconditionally throws "Only user credentials are supported" for any
 * non-user principal (see `DefaultUserInfoService`), so such callers can
 * never resolve a real `userEntityRef` and must not be routed through it.
 * `BackstageServicePrincipal.subject` is explicitly documented as purely
 * informational and must not drive logic, so we can't key ownership off it
 * either; every non-user caller is instead attributed to this one fixed
 * identity, mirroring the `SYSTEM_USER_REF` fallback convention already
 * used by the `x2a-node` package for the same class of problem.
 */
export const SYSTEM_INITIATOR_ENTITY_REF = 'user:default/system';

const isUserCredentials = (
  credentials: BackstageCredentials,
): credentials is BackstageCredentials<BackstageUserPrincipal> =>
  typeof (credentials.principal as { userEntityRef?: unknown })
    ?.userEntityRef === 'string';

/**
 * Resolves the entity ref to record (on `execute-workflow`) or compare
 * against (on ownership checks/filters) as a workflow instance's initiator.
 * Real Backstage users resolve to their `userEntityRef` via
 * `UserInfoService`. Non-user credentials fall back to
 * `SYSTEM_INITIATOR_ENTITY_REF` rather than crashing the caller - see that
 * constant's doc comment for why that's unavoidable for non-user
 * principals.
 */
export const resolveInitiatorEntity = async (
  credentials: BackstageCredentials,
  userInfo: UserInfoService,
): Promise<string> => {
  if (!isUserCredentials(credentials)) {
    return SYSTEM_INITIATOR_ENTITY_REF;
  }
  const { userEntityRef } = await userInfo.getUserInfo(credentials);
  return userEntityRef;
};

/**
 * Asserts that the caller either holds `orchestrator.instanceAdminView` or
 * is the entity that initiated the given instance. Mirrors the ownership
 * check in `service/router.ts`'s `getInstanceById` handler.
 */
export const assertInstanceOwnership = async (
  credentials: BackstageCredentials,
  permissionsSvc: PermissionsService,
  userInfo: UserInfoService,
  instance: { initiatorEntity?: string },
  instanceId: string,
): Promise<void> => {
  const [adminDecision] = await permissionsSvc.authorize(
    [{ permission: orchestratorInstanceAdminViewPermission }],
    { credentials },
  );

  if (adminDecision.result === AuthorizeResult.ALLOW) {
    return;
  }

  const userEntityRef = await resolveInitiatorEntity(credentials, userInfo);
  const instanceInitiatorEntity = instance.initiatorEntity;

  // If the instance has no initiatorEntity recorded, we cannot determine
  // ownership. This can happen for:
  // 1. Workflow instances created before the initiatorEntity feature was added
  // 2. Workflow instances started externally (not through Backstage)
  // 3. Workflows that transform/overwrite their input variables
  if (!instanceInitiatorEntity) {
    throw new NotAllowedError(
      `Access denied for instance ${instanceId}. This workflow run does not have ` +
        `ownership information recorded, so it cannot be verified that you initiated it. ` +
        `The 'orchestrator.instanceAdminView' permission is required to view it.`,
    );
  }

  if (instanceInitiatorEntity !== userEntityRef) {
    throw new NotAllowedError(
      `Access denied for instance ${instanceId}. This workflow run was initiated by ` +
        `'${instanceInitiatorEntity}', not by you ('${userEntityRef}'). To view instances ` +
        `initiated by others, you need the 'orchestrator.instanceAdminView' permission.`,
    );
  }
};

/**
 * Builds a `Filter` that restricts instance queries to the ones initiated by
 * `initiatorEntity`, combined with `existingFilter` (if any) via `AND`.
 * Mirrors the filter-building block in `service/router.ts`'s `getInstances`
 * handler.
 */
export const buildInstanceOwnershipFilter = (
  initiatorEntity: string,
  existingFilter?: Filter,
): Filter => {
  const initiatorEntityFilter: FieldFilter = {
    operator: 'EQ',
    value: initiatorEntity,
    field: 'initiatorEntity',
  };

  const nestedVariablesFilter: NestedFilter = {
    field: 'variables',
    nested: initiatorEntityFilter,
  };

  if (existingFilter === undefined) {
    return nestedVariablesFilter;
  }

  return {
    operator: 'AND',
    filters: [nestedVariablesFilter, existingFilter],
  };
};
