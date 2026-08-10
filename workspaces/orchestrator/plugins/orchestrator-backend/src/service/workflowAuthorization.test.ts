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

/**
 * Unit tests for the credentials-based authorization helpers shared by
 * `service/router.ts` and `actions/*.ts`.
 *
 * These tests double as the behavior-preservation safety net for extracting
 * this logic out of `router.ts` (which remains covered end-to-end by
 * `router.test.ts`): every branch here mirrors a scenario already exercised
 * there (generic ALLOW/DENY, conditional rule matching, the deprecated
 * per-workflow fallback, and the instance-ownership/admin-view checks).
 */

import { mockCredentials, mockServices } from '@backstage/backend-test-utils';
import { NotAllowedError } from '@backstage/errors';
import {
  AuthorizeResult,
  type PolicyDecision,
} from '@backstage/plugin-permission-common';
import { createConditionTransformer } from '@backstage/plugin-permission-node';

import {
  ORCHESTRATOR_WORKFLOW_RESOURCE_TYPE,
  orchestratorWorkflowPermission,
  orchestratorWorkflowUsePermission,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import {
  OrchestratorFilters,
  orchestratorPermissionRules,
} from './permission-rules';
import {
  assertAnyWorkflowAccess,
  assertInstanceOwnership,
  assertWorkflowAccess,
  authorize,
  authorizeWorkflowAccess,
  buildInstanceOwnershipFilter,
  filterAuthorizedWorkflowIds,
  filterAuthorizedWorkflows,
  isUserAuthorizedForInstanceAdminViewPermission,
  isWorkflowAccessAllowed,
  matchesWorkflowId,
  resolveInitiatorEntity,
  SYSTEM_INITIATOR_ENTITY_REF,
} from './workflowAuthorization';

const credentials = mockCredentials.user('user:default/test-user');

// Same `permissionsRegistry.getPermissionRuleset(orchestratorWorkflowResourceRef)`
// shape used in production (see `plugin.ts`/`router.ts`) and in
// `router.test.ts`'s own mock.
const conditionTransformer = createConditionTransformer<OrchestratorFilters>({
  getRuleByName: (name: string) => {
    const rule = orchestratorPermissionRules.find(r => r.name === name);
    if (!rule) {
      throw new Error(`Unknown rule: ${name}`);
    }
    return rule;
  },
});

function conditionalDecision(workflowIds: string[]): PolicyDecision {
  return {
    result: AuthorizeResult.CONDITIONAL,
    pluginId: 'orchestrator',
    resourceType: ORCHESTRATOR_WORKFLOW_RESOURCE_TYPE,
    conditions: {
      anyOf: [
        {
          rule: 'IS_ALLOWED_WORKFLOW_ID',
          resourceType: ORCHESTRATOR_WORKFLOW_RESOURCE_TYPE,
          params: { workflowIds },
        },
      ],
    },
  } as PolicyDecision;
}

describe('matchesWorkflowId', () => {
  it('returns true when there are no filters', () => {
    expect(matchesWorkflowId({ workflowId: 'workflow1' }, undefined)).toBe(
      true,
    );
  });

  it('matches a leaf filter by workflow id', () => {
    const filters = { key: 'workflowIds', values: ['workflow1', 'workflow2'] };
    expect(matchesWorkflowId({ workflowId: 'workflow1' }, filters)).toBe(true);
    expect(matchesWorkflowId({ workflowId: 'workflow3' }, filters)).toBe(false);
  });

  it('evaluates allOf/anyOf/not compositions', () => {
    const allowed = { key: 'workflowIds', values: ['workflow1'] };
    const denied = { key: 'workflowIds', values: ['workflow2'] };

    expect(
      matchesWorkflowId({ workflowId: 'workflow1' }, { allOf: [allowed] }),
    ).toBe(true);
    expect(
      matchesWorkflowId(
        { workflowId: 'workflow1' },
        { allOf: [allowed, denied] },
      ),
    ).toBe(false);
    expect(
      matchesWorkflowId(
        { workflowId: 'workflow1' },
        { anyOf: [denied, allowed] },
      ),
    ).toBe(true);
    expect(
      matchesWorkflowId({ workflowId: 'workflow1' }, { not: denied }),
    ).toBe(true);
  });
});

describe('authorize', () => {
  it('calls authorizeConditional for a resource-scoped permission', async () => {
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);

    const decision = await authorize(
      credentials,
      orchestratorWorkflowPermission,
      mockPermissions,
    );

    expect(decision.result).toBe(AuthorizeResult.ALLOW);
    expect(mockPermissions.authorizeConditional).toHaveBeenCalledWith(
      [{ permission: orchestratorWorkflowPermission }],
      { credentials },
    );
    expect(mockPermissions.authorize).not.toHaveBeenCalled();
  });

  it('calls authorize for a basic (non-resource) permission', async () => {
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);
    const basicPermission = {
      type: 'basic' as const,
      name: 'orchestrator.instanceAdminView',
      attributes: {},
    };

    const decision = await authorize(
      credentials,
      basicPermission,
      mockPermissions,
    );

    expect(decision.result).toBe(AuthorizeResult.DENY);
    expect(mockPermissions.authorize).toHaveBeenCalledWith(
      [{ permission: basicPermission }],
      { credentials },
    );
  });
});

describe('isWorkflowAccessAllowed / assertWorkflowAccess', () => {
  it('allows access on a generic ALLOW decision', async () => {
    const mockPermissions = mockServices.permissions.mock();
    const logger = mockServices.logger.mock();

    const allowed = await isWorkflowAccessAllowed(
      credentials,
      { result: AuthorizeResult.ALLOW },
      'workflow1',
      orchestratorWorkflowPermission,
      conditionTransformer,
      mockPermissions,
      logger,
    );

    expect(allowed).toBe(true);
    expect(mockPermissions.authorize).not.toHaveBeenCalled();
  });

  it('allows access when the conditional rule matches the workflow id', async () => {
    const mockPermissions = mockServices.permissions.mock();
    const logger = mockServices.logger.mock();

    const allowed = await isWorkflowAccessAllowed(
      credentials,
      conditionalDecision(['workflow1']),
      'workflow1',
      orchestratorWorkflowPermission,
      conditionTransformer,
      mockPermissions,
      logger,
    );

    expect(allowed).toBe(true);
    expect(mockPermissions.authorize).not.toHaveBeenCalled();
  });

  it('denies access when the conditional rule does not match and no legacy fallback exists', async () => {
    const mockPermissions = mockServices.permissions.mock();
    const logger = mockServices.logger.mock();
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    const allowed = await isWorkflowAccessAllowed(
      credentials,
      conditionalDecision(['workflow2']),
      'workflow1',
      orchestratorWorkflowPermission,
      conditionTransformer,
      mockPermissions,
      logger,
    );

    expect(allowed).toBe(false);
  });

  // @deprecated scenario — remove once orchestratorWorkflowSpecificPermission is removed
  it('falls back to the deprecated per-workflow permission on a generic DENY', async () => {
    const mockPermissions = mockServices.permissions.mock();
    const logger = mockServices.logger.mock();
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);

    const allowed = await isWorkflowAccessAllowed(
      credentials,
      { result: AuthorizeResult.DENY },
      'workflow1',
      orchestratorWorkflowPermission,
      conditionTransformer,
      mockPermissions,
      logger,
    );

    expect(allowed).toBe(true);
    expect(mockPermissions.authorize).toHaveBeenCalledWith(
      [
        {
          permission: expect.objectContaining({
            name: 'orchestrator.workflow.workflow1',
          }),
        },
      ],
      { credentials },
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('deprecated'),
    );
  });

  // @deprecated scenario — remove once orchestratorWorkflowUseSpecificPermission is removed
  it('uses the "use" specific permission fallback for orchestratorWorkflowUsePermission', async () => {
    const mockPermissions = mockServices.permissions.mock();
    const logger = mockServices.logger.mock();
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    const allowed = await isWorkflowAccessAllowed(
      credentials,
      { result: AuthorizeResult.DENY },
      'workflow1',
      orchestratorWorkflowUsePermission,
      conditionTransformer,
      mockPermissions,
      logger,
    );

    expect(allowed).toBe(false);
    expect(mockPermissions.authorize).toHaveBeenCalledWith(
      [
        {
          permission: expect.objectContaining({
            name: 'orchestrator.workflow.use.workflow1',
          }),
        },
      ],
      { credentials },
    );
  });

  it('assertWorkflowAccess resolves silently when access is allowed', async () => {
    const mockPermissions = mockServices.permissions.mock();
    const logger = mockServices.logger.mock();

    await expect(
      assertWorkflowAccess(
        credentials,
        { result: AuthorizeResult.ALLOW },
        'workflow1',
        orchestratorWorkflowPermission,
        conditionTransformer,
        mockPermissions,
        logger,
      ),
    ).resolves.toBeUndefined();
  });

  it('assertWorkflowAccess throws NotAllowedError when access is denied', async () => {
    const mockPermissions = mockServices.permissions.mock();
    const logger = mockServices.logger.mock();
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    await expect(
      assertWorkflowAccess(
        credentials,
        { result: AuthorizeResult.DENY },
        'workflow1',
        orchestratorWorkflowPermission,
        conditionTransformer,
        mockPermissions,
        logger,
      ),
    ).rejects.toThrow(NotAllowedError);
  });
});

describe('authorizeWorkflowAccess', () => {
  it('resolves silently when the generic permission allows the workflow', async () => {
    const mockPermissions = mockServices.permissions.mock();
    const logger = mockServices.logger.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);

    await expect(
      authorizeWorkflowAccess(
        credentials,
        'workflow1',
        orchestratorWorkflowPermission,
        conditionTransformer,
        mockPermissions,
        logger,
      ),
    ).resolves.toBeUndefined();
  });

  it('resolves silently when a conditional decision matches the workflow id', async () => {
    const mockPermissions = mockServices.permissions.mock();
    const logger = mockServices.logger.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      conditionalDecision(['workflow1']),
    ]);

    await expect(
      authorizeWorkflowAccess(
        credentials,
        'workflow1',
        orchestratorWorkflowPermission,
        conditionTransformer,
        mockPermissions,
        logger,
      ),
    ).resolves.toBeUndefined();
  });

  it('throws NotAllowedError when the workflow is not covered by the decision', async () => {
    const mockPermissions = mockServices.permissions.mock();
    const logger = mockServices.logger.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      conditionalDecision(['workflow2']),
    ]);
    // @deprecated legacy fallback also denies
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    await expect(
      authorizeWorkflowAccess(
        credentials,
        'workflow1',
        orchestratorWorkflowPermission,
        conditionTransformer,
        mockPermissions,
        logger,
      ),
    ).rejects.toThrow(NotAllowedError);
  });
});

describe('assertAnyWorkflowAccess', () => {
  it('resolves silently on a generic ALLOW', async () => {
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);

    await expect(
      assertAnyWorkflowAccess(
        credentials,
        mockPermissions,
        orchestratorWorkflowPermission,
      ),
    ).resolves.toBeUndefined();
  });

  it('resolves silently on a CONDITIONAL decision', async () => {
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      conditionalDecision(['workflow1']),
    ]);

    await expect(
      assertAnyWorkflowAccess(
        credentials,
        mockPermissions,
        orchestratorWorkflowPermission,
      ),
    ).resolves.toBeUndefined();
  });

  it('throws NotAllowedError on a generic DENY', async () => {
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    await expect(
      assertAnyWorkflowAccess(
        credentials,
        mockPermissions,
        orchestratorWorkflowPermission,
      ),
    ).rejects.toThrow(NotAllowedError);
  });
});

describe('filterAuthorizedWorkflowIds', () => {
  it('returns all workflow ids on a generic ALLOW', async () => {
    const mockPermissions = mockServices.permissions.mock();
    const logger = mockServices.logger.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);

    const ids = await filterAuthorizedWorkflowIds(
      credentials,
      mockPermissions,
      ['workflow1', 'workflow2'],
      conditionTransformer,
      logger,
    );

    expect(ids).toEqual(['workflow1', 'workflow2']);
    expect(mockPermissions.authorize).not.toHaveBeenCalled();
  });

  it('combines conditionally-matched ids with the legacy fallback for the rest', async () => {
    const mockPermissions = mockServices.permissions.mock();
    const logger = mockServices.logger.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      conditionalDecision(['workflow1']),
    ]);
    // @deprecated legacy fallback for the unmatched workflow2
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);

    const ids = await filterAuthorizedWorkflowIds(
      credentials,
      mockPermissions,
      ['workflow1', 'workflow2'],
      conditionTransformer,
      logger,
    );

    expect(ids.sort()).toEqual(['workflow1', 'workflow2']);
  });

  it('returns an empty array when access is denied with no legacy fallback', async () => {
    const mockPermissions = mockServices.permissions.mock();
    const logger = mockServices.logger.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    const ids = await filterAuthorizedWorkflowIds(
      credentials,
      mockPermissions,
      ['workflow1', 'workflow2'],
      conditionTransformer,
      logger,
    );

    expect(ids).toEqual([]);
  });

  it('returns an empty array for an empty input list, without invoking the legacy fallback', async () => {
    const mockPermissions = mockServices.permissions.mock();
    const logger = mockServices.logger.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    const ids = await filterAuthorizedWorkflowIds(
      credentials,
      mockPermissions,
      [],
      conditionTransformer,
      logger,
    );

    expect(ids).toEqual([]);
    // @deprecated legacy fallback batch is skipped entirely for an empty list
    expect(mockPermissions.authorize).not.toHaveBeenCalled();
  });
});

describe('filterAuthorizedWorkflows', () => {
  it('filters overviews down to the authorized workflow ids', async () => {
    const mockPermissions = mockServices.permissions.mock();
    const logger = mockServices.logger.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      conditionalDecision(['workflow1']),
    ]);
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    const result = await filterAuthorizedWorkflows(
      credentials,
      mockPermissions,
      {
        overviews: [
          { workflowId: 'workflow1', format: 'yaml' },
          { workflowId: 'workflow2', format: 'yaml' },
        ],
      },
      conditionTransformer,
      logger,
    );

    expect(result.overviews?.map(w => w.workflowId)).toEqual(['workflow1']);
  });

  it('passes through unchanged when there are no overviews', async () => {
    const mockPermissions = mockServices.permissions.mock();
    const logger = mockServices.logger.mock();

    const workflows = { paginationInfo: { pageSize: 10, offset: 0 } };
    const result = await filterAuthorizedWorkflows(
      credentials,
      mockPermissions,
      workflows,
      conditionTransformer,
      logger,
    );

    expect(result).toBe(workflows);
    expect(mockPermissions.authorizeConditional).not.toHaveBeenCalled();
  });
});

describe('isUserAuthorizedForInstanceAdminViewPermission', () => {
  it('returns true when the admin-view permission is granted', async () => {
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);

    await expect(
      isUserAuthorizedForInstanceAdminViewPermission(
        credentials,
        mockPermissions,
      ),
    ).resolves.toBe(true);
  });

  it('returns false when the admin-view permission is denied', async () => {
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    await expect(
      isUserAuthorizedForInstanceAdminViewPermission(
        credentials,
        mockPermissions,
      ),
    ).resolves.toBe(false);
  });
});

describe('assertInstanceOwnership', () => {
  const mockUserInfo = mockServices.userInfo.mock();

  beforeEach(() => {
    mockUserInfo.getUserInfo.mockResolvedValue({
      userEntityRef: 'user:default/test-user',
      ownershipEntityRefs: [],
    });
  });

  it('allows access when the caller holds the instanceAdminView permission', async () => {
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);

    await expect(
      assertInstanceOwnership(
        credentials,
        mockPermissions,
        mockUserInfo,
        { initiatorEntity: 'user:default/someone-else' },
        'instance-1',
      ),
    ).resolves.toBeUndefined();
  });

  it('allows access when the caller initiated the instance', async () => {
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    await expect(
      assertInstanceOwnership(
        credentials,
        mockPermissions,
        mockUserInfo,
        { initiatorEntity: 'user:default/test-user' },
        'instance-1',
      ),
    ).resolves.toBeUndefined();
  });

  it('throws NotAllowedError when the instance has no recorded initiator', async () => {
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    await expect(
      assertInstanceOwnership(
        credentials,
        mockPermissions,
        mockUserInfo,
        {},
        'instance-1',
      ),
    ).rejects.toThrow(NotAllowedError);
  });

  it('throws NotAllowedError when the instance was initiated by someone else', async () => {
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    await expect(
      assertInstanceOwnership(
        credentials,
        mockPermissions,
        mockUserInfo,
        { initiatorEntity: 'user:default/someone-else' },
        'instance-1',
      ),
    ).rejects.toThrow(NotAllowedError);
  });

  // Regression test for https://github.com/redhat-developer/rhdh-plugins/pull/4117#issuecomment-5240741356:
  // a static-token MCP caller (a service principal, never a user principal -
  // see DefaultAuthService.authenticate) must not crash
  // UserInfoService.getUserInfo's "Only user credentials are supported"
  // check; it should be compared against the fixed system initiator ref
  // instead.
  it('does not call userInfo.getUserInfo for a non-user (service) principal, and denies access to an instance it did not initiate', async () => {
    mockUserInfo.getUserInfo.mockClear();
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    await expect(
      assertInstanceOwnership(
        mockCredentials.service('mcp-clients'),
        mockPermissions,
        mockUserInfo,
        { initiatorEntity: 'user:default/someone-else' },
        'instance-1',
      ),
    ).rejects.toThrow(NotAllowedError);
    expect(mockUserInfo.getUserInfo).not.toHaveBeenCalled();
  });

  it('allows a non-user (service) principal to view an instance initiated by another service-principal caller', async () => {
    mockUserInfo.getUserInfo.mockClear();
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    await expect(
      assertInstanceOwnership(
        mockCredentials.service('mcp-clients'),
        mockPermissions,
        mockUserInfo,
        { initiatorEntity: SYSTEM_INITIATOR_ENTITY_REF },
        'instance-1',
      ),
    ).resolves.toBeUndefined();
    expect(mockUserInfo.getUserInfo).not.toHaveBeenCalled();
  });
});

describe('resolveInitiatorEntity', () => {
  const mockUserInfo = mockServices.userInfo.mock();

  beforeEach(() => {
    jest.resetAllMocks();
    mockUserInfo.getUserInfo.mockResolvedValue({
      userEntityRef: 'user:default/test-user',
      ownershipEntityRefs: [],
    });
  });

  it('resolves the real userEntityRef for a user principal', async () => {
    await expect(
      resolveInitiatorEntity(credentials, mockUserInfo),
    ).resolves.toBe('user:default/test-user');
    expect(mockUserInfo.getUserInfo).toHaveBeenCalledWith(credentials);
  });

  it('falls back to the system initiator ref for a service principal, without calling userInfo.getUserInfo', async () => {
    await expect(
      resolveInitiatorEntity(
        mockCredentials.service('mcp-clients'),
        mockUserInfo,
      ),
    ).resolves.toBe(SYSTEM_INITIATOR_ENTITY_REF);
    expect(mockUserInfo.getUserInfo).not.toHaveBeenCalled();
  });

  it('falls back to the system initiator ref for a none principal, without calling userInfo.getUserInfo', async () => {
    await expect(
      resolveInitiatorEntity(mockCredentials.none(), mockUserInfo),
    ).resolves.toBe(SYSTEM_INITIATOR_ENTITY_REF);
    expect(mockUserInfo.getUserInfo).not.toHaveBeenCalled();
  });
});

describe('buildInstanceOwnershipFilter', () => {
  it('builds a nested initiatorEntity filter when there is no existing filter', () => {
    expect(buildInstanceOwnershipFilter('user:default/test-user')).toEqual({
      field: 'variables',
      nested: {
        operator: 'EQ',
        value: 'user:default/test-user',
        field: 'initiatorEntity',
      },
    });
  });

  it('combines with an existing filter using AND', () => {
    const existingFilter = {
      field: 'processId',
      operator: 'EQ' as const,
      value: 'workflow1',
    };

    expect(
      buildInstanceOwnershipFilter('user:default/test-user', existingFilter),
    ).toEqual({
      operator: 'AND',
      filters: [
        {
          field: 'variables',
          nested: {
            operator: 'EQ',
            value: 'user:default/test-user',
            field: 'initiatorEntity',
          },
        },
        existingFilter,
      ],
    });
  });
});
