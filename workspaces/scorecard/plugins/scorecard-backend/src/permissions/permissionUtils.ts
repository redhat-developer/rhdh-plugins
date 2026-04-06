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
  AuthorizeResult,
  BasicPermission,
  PermissionCondition,
  PermissionCriteria,
  PermissionRuleParams,
  PolicyDecision,
  ResourcePermission,
} from '@backstage/plugin-permission-common';
import { Request } from 'express';
import { NotAllowedError } from '@backstage/errors';
import { catalogEntityReadPermission } from '@backstage/plugin-catalog-common/alpha';
import type {
  BackstageCredentials,
  HttpAuthService,
  PermissionsService,
} from '@backstage/backend-plugin-api';

import { Metric } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { rules as scorecardRules } from './rules';

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

export const checkEntityAccess = async (
  entityRef: string,
  req: Request,
  permissions: PermissionsService,
  httpAuth: HttpAuthService,
): Promise<void> => {
  const entityAccessDecision = await permissions.authorize(
    [{ permission: catalogEntityReadPermission, resourceRef: entityRef }],
    { credentials: await httpAuth.credentials(req) },
  );

  if (entityAccessDecision[0].result !== AuthorizeResult.ALLOW) {
    throw new NotAllowedError(`Access to "${entityRef}" entity metrics denied`);
  }
};

export const matches = (
  metric: Metric,
  filters?: PermissionCriteria<
    PermissionCondition<string, PermissionRuleParams>
  >,
): boolean => {
  if (!filters) {
    return true;
  }

  if ('allOf' in filters) {
    return filters.allOf.every(filter => matches(metric, filter));
  }

  if ('anyOf' in filters) {
    return filters.anyOf.some(filter => matches(metric, filter));
  }

  if ('not' in filters) {
    return !matches(metric, filters.not);
  }
  return (
    Object.values(scorecardRules)
      .find(r => r.name === filters.rule)
      ?.apply(metric, filters.params ?? {}) ?? false
  );
};

export const filterAuthorizedMetrics = (
  metrics: Metric[],
  filter?: PermissionCriteria<
    PermissionCondition<string, PermissionRuleParams>
  >,
) => {
  if (!filter) {
    return metrics;
  }

  return metrics.filter(metric => matches(metric, filter));
};
