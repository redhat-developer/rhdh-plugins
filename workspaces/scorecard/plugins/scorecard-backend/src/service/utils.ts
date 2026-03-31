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
  BackstageCredentials,
  BackstageUserPrincipal,
  PermissionsService,
} from '@backstage/backend-plugin-api';
import { AuthenticationError, NotAllowedError } from '@backstage/errors';
import {
  AuthorizeResult,
  BasicPermission,
  PermissionCondition,
  PermissionCriteria,
  PermissionRuleParams,
  PolicyDecision,
  ResourcePermission,
} from '@backstage/plugin-permission-common';

type ScorecardPermission = {
  decision: PolicyDecision;
  conditions?: PermissionCriteria<
    PermissionCondition<string, PermissionRuleParams>
  >;
};

export const authorizeConditional = async (
  credentials: BackstageCredentials,
  permissions: PermissionsService,
  permission: ResourcePermission<'scorecard-metric'> | BasicPermission,
) => {
  const scorecardPermission = {} as ScorecardPermission;

  if (permission.type === 'resource') {
    scorecardPermission.decision = (
      await permissions.authorizeConditional([{ permission }], {
        credentials,
      })
    )[0];
  } else {
    scorecardPermission.decision = (
      await permissions.authorize([{ permission }], {
        credentials,
      })
    )[0];
  }

  if (scorecardPermission.decision.result === AuthorizeResult.DENY) {
    throw new NotAllowedError();
  }

  scorecardPermission.conditions =
    scorecardPermission.decision.result === AuthorizeResult.CONDITIONAL
      ? scorecardPermission.decision.conditions
      : undefined;

  return scorecardPermission;
};

export const getUserEntityRef = async (
  credentials: BackstageCredentials<BackstageUserPrincipal>,
) => {
  const userEntityRef = credentials?.principal?.userEntityRef;

  if (!userEntityRef) {
    throw new AuthenticationError('User entity reference not found');
  }

  return userEntityRef;
};
