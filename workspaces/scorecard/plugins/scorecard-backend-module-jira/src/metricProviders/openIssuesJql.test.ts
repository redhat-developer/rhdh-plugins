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

import type { JiraJqlFilters } from '../annotations';
import { buildOpenIssuesJql } from './openIssuesJql';

describe('buildOpenIssuesJql', () => {
  const baseFilters: JiraJqlFilters = {
    project: 'project = "MOON"',
  };

  const appConfigOptions = {
    mandatoryFilter: 'type = Task AND resolution = Resolved',
    customFilter: 'assignee = testerUser',
  };

  it('should use default mandatory filter when app-config options are unset', () => {
    const jql = buildOpenIssuesJql(baseFilters, {});

    expect(jql).toBe(
      '(project = "MOON") AND (type = Bug AND resolution = Unresolved)',
    );
  });

  it('should use default mandatory filter when app-config mandatoryFilter is empty', () => {
    const jql = buildOpenIssuesJql(baseFilters, { mandatoryFilter: '   ' });

    expect(jql).toBe(
      '(project = "MOON") AND (type = Bug AND resolution = Unresolved)',
    );
  });

  it('should apply app-config mandatoryFilter instead of default mandatory filter', () => {
    const jql = buildOpenIssuesJql(baseFilters, {
      mandatoryFilter: 'type = Bug AND resolution = Unresolved AND team = 4333',
    });

    expect(jql).toBe(
      '(project = "MOON") AND (type = Bug AND resolution = Unresolved AND team = 4333)',
    );
  });

  it('should apply app-config customFilter with default mandatory filter', () => {
    const jql = buildOpenIssuesJql(baseFilters, {
      customFilter: 'team = 4316',
    });

    expect(jql).toBe(
      '(project = "MOON") AND (type = Bug AND resolution = Unresolved) AND (team = 4316)',
    );
  });

  it('should apply app-config mandatoryFilter and customFilter', () => {
    const jql = buildOpenIssuesJql(baseFilters, appConfigOptions);

    expect(jql).toBe(
      '(project = "MOON") AND (type = Task AND resolution = Resolved) AND (assignee = testerUser)',
    );
  });

  it('should apply entity filters with default mandatory filter', () => {
    const jql = buildOpenIssuesJql(
      {
        project: 'project = "MOON"',
        component: 'component = "frontend"',
        label: 'labels = "critical"',
      },
      {},
    );

    expect(jql).toBe(
      '(project = "MOON") AND (component = "frontend") AND (labels = "critical") AND (type = Bug AND resolution = Unresolved)',
    );
  });

  it('should prefer entity custom-filter annotation over app-config customFilter', () => {
    const jql = buildOpenIssuesJql(
      {
        ...baseFilters,
        customFilter: 'assignee = Automobile',
      },
      appConfigOptions,
    );

    expect(jql).toBe(
      '(project = "MOON") AND (assignee = Automobile) AND (type = Task AND resolution = Resolved)',
    );
    expect(jql).not.toContain('(assignee = testerUser)');
  });

  it('should apply entity custom-filter with app-config mandatoryFilter', () => {
    const jql = buildOpenIssuesJql(
      {
        ...baseFilters,
        customFilter: 'assignee = Robot',
      },
      { mandatoryFilter: 'resolution = Unresolved' },
    );

    expect(jql).toBe(
      '(project = "MOON") AND (assignee = Robot) AND (resolution = Unresolved)',
    );
  });
});
