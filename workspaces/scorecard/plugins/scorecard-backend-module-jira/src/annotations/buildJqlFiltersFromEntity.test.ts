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

import { newEntityComponent } from '../../__fixtures__/testUtils';
import { buildJqlFiltersFromEntity } from './buildJqlFiltersFromEntity';
import {
  INCIDENT_FILTER_ANNOTATIONS,
  OPEN_ISSUES_FILTER_ANNOTATIONS,
  ScorecardJiraAnnotations,
  ScorecardJiraIncidentAnnotations,
} from './annotationKeys';
import type { JiraFilterAnnotations } from './types';

const { PROJECT_KEY, COMPONENT, LABEL, TEAM, CUSTOM_FILTER } =
  ScorecardJiraAnnotations;

const {
  INCIDENT_PROJECT_KEY,
  INCIDENT_COMPONENT,
  INCIDENT_LABEL,
  INCIDENT_TEAM,
  INCIDENT_ISSUE_TYPE,
} = ScorecardJiraIncidentAnnotations;

type SharedFilterAnnotations = Pick<
  Required<JiraFilterAnnotations>,
  'project' | 'component' | 'label' | 'team'
>;

describe('buildJqlFiltersFromEntity', () => {
  const annotationFilterCases = [
    {
      name: 'open issues',
      keys: OPEN_ISSUES_FILTER_ANNOTATIONS as SharedFilterAnnotations & {
        customFilter?: string;
      },
      options: undefined,
      missingProjectError: `Missing required '${PROJECT_KEY}' annotation for entity 'mock-entity'`,
    },
    {
      name: 'incidents',
      keys: INCIDENT_FILTER_ANNOTATIONS as SharedFilterAnnotations,
      options: { projectFallback: PROJECT_KEY },
      missingProjectError: `Missing required '${INCIDENT_PROJECT_KEY}' or '${PROJECT_KEY}' annotation for entity 'mock-entity'`,
    },
  ] as const;

  it.each(annotationFilterCases)(
    '$name: should extract project filter correctly when entity has only "project key"',
    ({ keys, options }) => {
      const entity = newEntityComponent({ [keys.project]: 'TEST' });
      const filters = buildJqlFiltersFromEntity(entity, keys, options);

      expect(filters).toEqual({
        project: 'project = "TEST"',
      });
    },
  );

  it.each(annotationFilterCases)(
    '$name: should throw error for missing project key when entity is missing "project key"',
    ({ keys, options, missingProjectError }) => {
      const entity = newEntityComponent({});

      expect(() => buildJqlFiltersFromEntity(entity, keys, options)).toThrow(
        missingProjectError,
      );
    },
  );

  it.each(annotationFilterCases)(
    '$name: should throw error for invalid "project key" when "project key" is invalid',
    ({ keys, options }) => {
      const entity = newEntityComponent({ [keys.project]: 'TEST$123' });

      expect(() => buildJqlFiltersFromEntity(entity, keys, options)).toThrow(
        `${keys.project} contains invalid characters. Only alphanumeric, hyphens, spaces, and underscores are allowed.`,
      );
    },
  );

  it('open issues: should extract all filters correctly when entity has all expected annotations', () => {
    const entity = newEntityComponent({
      [PROJECT_KEY]: 'TEST',
      [COMPONENT]: 'backend',
      [LABEL]: 'critical',
      [TEAM]: '4316',
      [CUSTOM_FILTER]: 'priority = High',
    });

    const filters = buildJqlFiltersFromEntity(
      entity,
      OPEN_ISSUES_FILTER_ANNOTATIONS,
    );

    expect(filters).toEqual({
      project: 'project = "TEST"',
      component: 'component = "backend"',
      label: 'labels = "critical"',
      team: 'team = 4316',
      customFilter: 'priority = High',
    });
  });

  it('incidents: should extract all supported filters correctly when entity has all expected annotations', () => {
    const entity = newEntityComponent({
      [INCIDENT_PROJECT_KEY]: 'TEST',
      [INCIDENT_COMPONENT]: 'backend',
      [INCIDENT_LABEL]: 'critical',
      [INCIDENT_TEAM]: '4316',
    });

    const filters = buildJqlFiltersFromEntity(
      entity,
      INCIDENT_FILTER_ANNOTATIONS,
      { projectFallback: PROJECT_KEY },
    );

    expect(filters).toEqual({
      project: 'project = "TEST"',
      component: 'component = "backend"',
      label: 'labels = "critical"',
      team: 'team = 4316',
    });
  });

  it.each(annotationFilterCases)(
    '$name: should throw error for invalid "component" when "component" is invalid',
    ({ keys, options }) => {
      const entity = newEntityComponent({
        [keys.project]: 'TEST',
        [keys.component]: 'backend$123',
      });

      expect(() => buildJqlFiltersFromEntity(entity, keys, options)).toThrow(
        `${keys.component} contains invalid characters. Only alphanumeric, hyphens, spaces, and underscores are allowed.`,
      );
    },
  );

  it.each(annotationFilterCases)(
    '$name: should throw error for invalid "label" when "label" is invalid',
    ({ keys, options }) => {
      const entity = newEntityComponent({
        [keys.project]: 'TEST',
        [keys.label]: 'critical$123',
      });

      expect(() => buildJqlFiltersFromEntity(entity, keys, options)).toThrow(
        `${keys.label} contains invalid characters. Only alphanumeric, hyphens, spaces, and underscores are allowed.`,
      );
    },
  );

  it.each(annotationFilterCases)(
    '$name: should throw error for invalid "team" when "team" is invalid',
    ({ keys, options }) => {
      const entity = newEntityComponent({
        [keys.project]: 'TEST',
        [keys.team]: 'team-alpha$123',
      });

      expect(() => buildJqlFiltersFromEntity(entity, keys, options)).toThrow(
        `${keys.team} contains invalid characters. Only alphanumeric, hyphens, and underscores are allowed.`,
      );
    },
  );

  it('incidents: should fall back to project key when incident project key is missing', () => {
    const entity = newEntityComponent({
      [PROJECT_KEY]: 'PROJ',
    });

    const filters = buildJqlFiltersFromEntity(
      entity,
      INCIDENT_FILTER_ANNOTATIONS,
      { projectFallback: PROJECT_KEY },
    );

    expect(filters).toEqual({
      project: 'project = "PROJ"',
    });
  });

  it('open issues: should apply open-issues filters and ignore incident annotations', () => {
    const entity = newEntityComponent({
      [PROJECT_KEY]: 'TEST',
      [COMPONENT]: 'backend',
      [LABEL]: 'critical',
      [TEAM]: '4316',
      [CUSTOM_FILTER]: 'priority = High',
      [INCIDENT_PROJECT_KEY]: 'INC',
      [INCIDENT_COMPONENT]: 'Payments',
      [INCIDENT_LABEL]: 'sev-1',
      [INCIDENT_TEAM]: 'team-ops',
      [INCIDENT_ISSUE_TYPE]: 'ProductionIncident',
    });

    const filters = buildJqlFiltersFromEntity(
      entity,
      OPEN_ISSUES_FILTER_ANNOTATIONS,
    );

    expect(filters).toEqual({
      project: 'project = "TEST"',
      component: 'component = "backend"',
      label: 'labels = "critical"',
      team: 'team = 4316',
      customFilter: 'priority = High',
    });
  });

  it('incidents: should apply incident filters and ignore open-issues annotations', () => {
    const entity = newEntityComponent({
      [INCIDENT_PROJECT_KEY]: 'INC',
      [INCIDENT_COMPONENT]: 'Payments',
      [INCIDENT_LABEL]: 'sev-1',
      [INCIDENT_TEAM]: 'team-ops',
      [COMPONENT]: 'Ignored',
      [LABEL]: 'ignored-label',
      [TEAM]: 'ignored-team',
      [CUSTOM_FILTER]: 'ignored = true',
    });

    const filters = buildJqlFiltersFromEntity(
      entity,
      INCIDENT_FILTER_ANNOTATIONS,
      { projectFallback: PROJECT_KEY },
    );

    expect(filters).toEqual({
      project: 'project = "INC"',
      component: 'component = "Payments"',
      label: 'labels = "sev-1"',
      team: 'team = team-ops',
    });
  });
});
