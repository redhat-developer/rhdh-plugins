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

import { ScorecardJiraIncidentAnnotations } from '../annotations';
import { newEntityComponent } from '../../__fixtures__/testUtils';
import { buildIncidentJql } from './incidentJql';

const { INCIDENT_ISSUE_TYPE } = ScorecardJiraIncidentAnnotations;

describe('buildIncidentJql', () => {
  const options = {
    from: '2026-06-01T00:00:00.000Z',
    to: '2026-06-30T23:59:59.999Z',
  };

  const baseFilters = {
    project: 'project = "INC"',
  };

  it('should use default issue type and date bounds when app-config options are unset', () => {
    const jql = buildIncidentJql(baseFilters, options, newEntityComponent());

    expect(jql).toBe(
      '(project = "INC") AND (type = "Incident") AND (created >= "2026-06-01 00:00") AND (created <= "2026-06-30 23:59")',
    );
  });

  it('should apply app-config issueType instead of default issue type', () => {
    const jql = buildIncidentJql(
      baseFilters,
      { ...options, issueType: 'ServiceIncident' },
      newEntityComponent(),
    );

    expect(jql).toBe(
      '(project = "INC") AND (type = "ServiceIncident") AND (created >= "2026-06-01 00:00") AND (created <= "2026-06-30 23:59")',
    );
  });

  it('should apply entity filters with default issue type and date bounds', () => {
    const jql = buildIncidentJql(
      {
        project: 'project = "INC"',
        component: 'component = "Payments"',
        label: 'labels = "sev-1"',
      },
      options,
      newEntityComponent(),
    );

    expect(jql).toBe(
      '(project = "INC") AND (component = "Payments") AND (labels = "sev-1") AND (type = "Incident") AND (created >= "2026-06-01 00:00") AND (created <= "2026-06-30 23:59")',
    );
  });

  it('should prefer entity issue-type annotation over app-config issueType', () => {
    const jql = buildIncidentJql(
      baseFilters,
      { ...options, issueType: 'ServiceIncident' },
      newEntityComponent({
        [INCIDENT_ISSUE_TYPE]: 'ProductionIncident',
      }),
    );

    expect(jql).toBe(
      '(project = "INC") AND (type = "ProductionIncident") AND (created >= "2026-06-01 00:00") AND (created <= "2026-06-30 23:59")',
    );
    expect(jql).not.toContain('(type = "ServiceIncident")');
  });
});
