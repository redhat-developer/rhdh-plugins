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

import type { Entity } from '@backstage/catalog-model';
import {
  ScorecardJiraIncidentAnnotations,
  type JiraJqlFilters,
} from '../annotations';
import {
  joinJqlClauses,
  toJiraDateTime,
  validateJQLValue,
} from '../clients/utils';
import { DEFAULT_INCIDENT_ISSUE_TYPE } from '../constants';

const { INCIDENT_ISSUE_TYPE } = ScorecardJiraIncidentAnnotations;

export function buildIncidentJql(
  filters: JiraJqlFilters,
  options: {
    from: string;
    to: string;
    issueType?: string;
  },
  entity: Entity,
): string {
  const from = toJiraDateTime(options.from);
  const to = toJiraDateTime(options.to);
  const issueType = resolveIncidentIssueType(entity, options.issueType);

  return joinJqlClauses([
    ...Object.values(filters),
    `type = "${issueType}"`,
    `created >= "${from}"`,
    `created <= "${to}"`,
  ]);
}

function resolveIncidentIssueType(
  entity: Entity,
  inputIssueType?: string,
): string {
  const annotations = entity.metadata?.annotations || {};
  // Entity annotation overrides configured input default.
  const issueType =
    annotations[INCIDENT_ISSUE_TYPE] ||
    inputIssueType ||
    DEFAULT_INCIDENT_ISSUE_TYPE;

  return validateJQLValue(issueType, 'type');
}
