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

import { DEFAULT_NUMBER_THRESHOLDS } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  newEntityComponent,
  newMockRootConfig,
} from '../../__fixtures__/testUtils';
import { ScorecardJiraAnnotations } from '../annotations';
import { JiraClient } from '../clients/base';
import { JiraOpenIssuesProvider } from './JiraOpenIssuesProvider';

const { PROJECT_KEY, COMPONENT, LABEL, TEAM, CUSTOM_FILTER } =
  ScorecardJiraAnnotations;

describe('JiraOpenIssuesProvider', () => {
  const mockJiraClient = {
    getCountOpenIssues: jest.fn(),
  } as unknown as jest.Mocked<JiraClient>;

  let provider: JiraOpenIssuesProvider;

  const mockEntity = newEntityComponent({ [PROJECT_KEY]: 'TEST' });

  beforeEach(() => {
    jest.clearAllMocks();
    provider = JiraOpenIssuesProvider.fromConfig(newMockRootConfig(), {
      jiraClient: mockJiraClient,
    });
  });

  describe('getProviderDatasourceId', () => {
    it('should return "jira"', () => {
      expect(provider.getProviderDatasourceId()).toEqual('jira');
    });
  });

  describe('getProviderId', () => {
    it('should return "jira.openIssues"', () => {
      expect(provider.getProviderId()).toEqual('jira.openIssues');
    });
  });

  describe('getMetrics', () => {
    it('should return correct metric metadata with threshold', () => {
      const metrics = provider.getMetrics();

      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toEqual({
        id: 'jira.openIssues',
        title: 'Jira open blocking tickets',
        description:
          'Highlights the number of issues that are currently open in Jira.',
        type: 'number',
        thresholds: DEFAULT_NUMBER_THRESHOLDS,
        history: true,
      });
    });
  });

  describe('fromConfig', () => {
    it('should load options from app-config', () => {
      provider = JiraOpenIssuesProvider.fromConfig(
        newMockRootConfig({
          options: {
            mandatoryFilter: 'type = Task',
            customFilter: 'priority = High',
          },
        }),
        { jiraClient: mockJiraClient },
      );

      expect((provider as any).options).toEqual({
        mandatoryFilter: 'type = Task',
        customFilter: 'priority = High',
      });
    });

    it('should leave empty options if not set in app-config', () => {
      provider = JiraOpenIssuesProvider.fromConfig(newMockRootConfig({}), {
        jiraClient: mockJiraClient,
      });

      expect((provider as any).options).toEqual({
        mandatoryFilter: undefined,
        customFilter: undefined,
      });
    });
  });

  describe('calculateMetrics', () => {
    beforeEach(() => {
      mockJiraClient.getCountOpenIssues.mockResolvedValue(5);
    });

    it('should return the count of open issues when Jira client processed successfully', async () => {
      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('jira.openIssues')).toBe(5);
    });

    it('should propagate errors from Jira client', async () => {
      mockJiraClient.getCountOpenIssues.mockRejectedValue(
        new Error('Jira API error'),
      );

      await expect(provider.calculateMetrics(mockEntity)).rejects.toThrow(
        'Jira API error',
      );
    });

    it('should use default mandatory filter when app-config options are unset', async () => {
      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('jira.openIssues')).toBe(5);
      expect(mockJiraClient.getCountOpenIssues).toHaveBeenCalledWith(
        '(project = "TEST") AND (type = Bug AND resolution = Unresolved)',
      );
    });

    it('should overwrite default mandatory filter with app-config mandatoryFilter', async () => {
      provider = JiraOpenIssuesProvider.fromConfig(
        newMockRootConfig({
          options: {
            mandatoryFilter: 'type = Task AND resolution = Resolved',
          },
        }),
        { jiraClient: mockJiraClient },
      );

      await provider.calculateMetrics(mockEntity);

      expect(mockJiraClient.getCountOpenIssues).toHaveBeenCalledWith(
        '(project = "TEST") AND (type = Task AND resolution = Resolved)',
      );
    });

    it('should apply app-config mandatoryFilter and customFilter', async () => {
      provider = JiraOpenIssuesProvider.fromConfig(
        newMockRootConfig({
          options: {
            mandatoryFilter: 'type = Task AND resolution = Resolved',
            customFilter: 'assignee = testerUser',
          },
        }),
        { jiraClient: mockJiraClient },
      );

      await provider.calculateMetrics(mockEntity);

      expect(mockJiraClient.getCountOpenIssues).toHaveBeenCalledWith(
        '(project = "TEST") AND (type = Task AND resolution = Resolved) AND (assignee = testerUser)',
      );
    });

    it('should include entity annotation filters without custom-filter with default mandatory filter', async () => {
      const entity = newEntityComponent({
        [PROJECT_KEY]: 'TEST',
        [COMPONENT]: 'backend',
        [LABEL]: 'critical',
        [TEAM]: '4316',
      });

      await provider.calculateMetrics(entity);

      expect(mockJiraClient.getCountOpenIssues).toHaveBeenCalledWith(
        '(project = "TEST") AND (component = "backend") AND (labels = "critical") AND (team = 4316) AND (type = Bug AND resolution = Unresolved)',
      );
    });

    it('should prefer entity custom-filter annotation over app-config customFilter', async () => {
      provider = JiraOpenIssuesProvider.fromConfig(
        newMockRootConfig({
          options: {
            mandatoryFilter: 'resolution = Unresolved',
            customFilter: 'assignee = fromConfig',
          },
        }),
        { jiraClient: mockJiraClient },
      );

      await provider.calculateMetrics(
        newEntityComponent({
          [PROJECT_KEY]: 'TEST',
          [CUSTOM_FILTER]: 'assignee = fromAnnotation',
        }),
      );

      expect(mockJiraClient.getCountOpenIssues).toHaveBeenCalledWith(
        '(project = "TEST") AND (assignee = fromAnnotation) AND (resolution = Unresolved)',
      );
    });
  });
});
