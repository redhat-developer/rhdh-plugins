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
import {
  ScorecardJiraAnnotations,
  ScorecardJiraIncidentAnnotations,
} from '../annotations';
import { JiraClient } from '../clients/base';
import { JiraIncidentsCollector } from './JiraIncidentsCollector';

const { PROJECT_KEY } = ScorecardJiraAnnotations;
const {
  INCIDENT_PROJECT_KEY,
  INCIDENT_COMPONENT,
  INCIDENT_LABEL,
  INCIDENT_ISSUE_TYPE,
} = ScorecardJiraIncidentAnnotations;

describe('JiraIncidentsCollector', () => {
  const mockJiraClient = {
    getIssues: jest.fn(),
  } as unknown as jest.Mocked<JiraClient>;

  let collector: JiraIncidentsCollector;

  const input = {
    from: '2026-06-01T00:00:00.000Z',
    to: '2026-06-30T23:59:59.999Z',
  };

  const mockEntity = newEntityComponent({
    [INCIDENT_PROJECT_KEY]: 'INC',
  });

  const defaultIncidents = [
    {
      id: 'INC-100',
      createdAt: '2026-06-01T10:00:00.000Z',
      resolutionAt: '2026-06-01T12:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockJiraClient.getIssues.mockResolvedValue(defaultIncidents);
    collector = new JiraIncidentsCollector(mockJiraClient);
  });

  describe('collect', () => {
    it('should return incidents when Jira client processed successfully', async () => {
      const result = await collector.collect({ entity: mockEntity, input });

      expect(result).toEqual({ incidents: defaultIncidents });
    });

    it('should propagate errors from Jira client', async () => {
      mockJiraClient.getIssues.mockRejectedValue(new Error('Jira API error'));

      await expect(
        collector.collect({ entity: mockEntity, input }),
      ).rejects.toThrow('Jira API error');
    });

    it('should use default issue type when input.issueType is unset', async () => {
      await collector.collect({ entity: mockEntity, input });

      expect(mockJiraClient.getIssues).toHaveBeenCalledWith(
        '(project = "INC") AND (type = "Incident") AND (created >= "2026-06-01 00:00") AND (created <= "2026-06-30 23:59")',
      );
    });

    it('should overwrite default issue type with input.issueType', async () => {
      await collector.collect({
        entity: mockEntity,
        input: { ...input, issueType: 'ServiceIncident' },
      });

      expect(mockJiraClient.getIssues).toHaveBeenCalledWith(
        '(project = "INC") AND (type = "ServiceIncident") AND (created >= "2026-06-01 00:00") AND (created <= "2026-06-30 23:59")',
      );
    });

    it('should include entity annotation filters with default issue type', async () => {
      await collector.collect({
        entity: newEntityComponent({
          [INCIDENT_PROJECT_KEY]: 'INC',
          [INCIDENT_COMPONENT]: 'Payments',
          [INCIDENT_LABEL]: 'sev-1',
        }),
        input,
      });

      expect(mockJiraClient.getIssues).toHaveBeenCalledWith(
        '(project = "INC") AND (component = "Payments") AND (labels = "sev-1") AND (type = "Incident") AND (created >= "2026-06-01 00:00") AND (created <= "2026-06-30 23:59")',
      );
    });

    it('should apply input.issueType with entity annotation filters', async () => {
      await collector.collect({
        entity: newEntityComponent({
          [INCIDENT_PROJECT_KEY]: 'INC',
          [INCIDENT_COMPONENT]: 'Payments',
        }),
        input: { ...input, issueType: 'ServiceIncident' },
      });

      expect(mockJiraClient.getIssues).toHaveBeenCalledWith(
        '(project = "INC") AND (component = "Payments") AND (type = "ServiceIncident") AND (created >= "2026-06-01 00:00") AND (created <= "2026-06-30 23:59")',
      );
    });

    it('should prefer entity issue-type annotation over input.issueType', async () => {
      await collector.collect({
        entity: newEntityComponent({
          [INCIDENT_PROJECT_KEY]: 'INC',
          [INCIDENT_ISSUE_TYPE]: 'ProductionIncident',
        }),
        input: { ...input, issueType: 'ServiceIncident' },
      });

      expect(mockJiraClient.getIssues).toHaveBeenCalledWith(
        expect.stringContaining('(type = "ProductionIncident")'),
      );
      expect(mockJiraClient.getIssues).toHaveBeenCalledWith(
        expect.not.stringContaining('(type = "ServiceIncident")'),
      );
    });

    it('should use entity issue-type annotation when input.issueType is unset', async () => {
      await collector.collect({
        entity: newEntityComponent({
          [INCIDENT_PROJECT_KEY]: 'INC',
          [INCIDENT_ISSUE_TYPE]: 'ProductionIncident',
        }),
        input,
      });

      expect(mockJiraClient.getIssues).toHaveBeenCalledWith(
        expect.stringContaining('(type = "ProductionIncident")'),
      );
    });

    it('should fall back to project-key when incident project key is missing', async () => {
      await collector.collect({
        entity: newEntityComponent({ [PROJECT_KEY]: 'PROJ' }),
        input,
      });

      expect(mockJiraClient.getIssues).toHaveBeenCalledWith(
        expect.stringContaining('(project = "PROJ")'),
      );
    });
  });
});
