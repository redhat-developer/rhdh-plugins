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

import type { Config } from '@backstage/config';
import type { Entity } from '@backstage/catalog-model';
import { JiraClient } from './base';
import {
  ANNOTATION_JIRA_PROJECT_KEY,
  ANNOTATION_JIRA_COMPONENT,
  ANNOTATION_JIRA_LABEL,
  ANNOTATION_JIRA_TEAM,
  ANNOTATION_JIRA_CUSTOM_FILTER,
} from '../constants';

// Create a test implementation of the abstract JiraClient
class TestJiraClient extends JiraClient {
  getAuthHeaders(): Record<string, string> {
    return { Authorization: 'Bearer test-token' };
  }
}

global.fetch = jest.fn();

describe('JiraClient', () => {
  let mockConfig: jest.Mocked<Config>;
  let testJiraClient: TestJiraClient;
  const getOptional = jest.fn();

  const mockJiraConfig = {
    baseUrl: 'https://example.com',
    token: 'test-token',
    product: 'cloud',
    apiVersion: '3',
  };

  const mockJiraOptions = {
    mandatoryFilter: 'type = Task AND resolution = Resolved',
    customFilter: 'assignee = testerUser',
  };

  beforeEach(() => {
    mockConfig = {
      getOptional,
    } as unknown as jest.Mocked<Config>;

    mockConfig.getOptional
      .mockReturnValueOnce(mockJiraConfig)
      .mockReturnValueOnce(mockJiraOptions);

    testJiraClient = new TestJiraClient(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    describe('when Jira config is valid', () => {
      it('should create JiraClient successfully', () => {
        expect(testJiraClient).toBeInstanceOf(JiraClient);
        expect(mockConfig.getOptional).toHaveBeenCalledTimes(2);
        expect(mockConfig.getOptional).toHaveBeenNthCalledWith(1, 'jira');
        expect(mockConfig.getOptional).toHaveBeenNthCalledWith(
          2,
          'scorecard.plugins.jira.open_issues.options',
        );
      });

      it('should store config and options correctly', () => {
        expect((testJiraClient as any).config).toEqual(mockJiraConfig);
        expect((testJiraClient as any).options).toEqual(mockJiraOptions);
      });
    });

    describe('when Jira config is missing', () => {
      beforeEach(() => {
        getOptional.mockReturnValue(undefined);
      });

      it('should throw error for missing config', () => {
        expect(() => new TestJiraClient(mockConfig)).toThrow(
          'Missing Jira integration config',
        );
      });
    });

    describe('when only options are missing', () => {
      beforeEach(() => {
        getOptional
          .mockReturnValueOnce(mockJiraConfig)
          .mockReturnValueOnce(undefined);
      });

      it('should create client successfully with null options', () => {
        const client = new TestJiraClient(mockConfig);
        expect(client).toBeInstanceOf(JiraClient);
        expect((client as any).options).toBeUndefined();
      });
    });
  });

  describe('sendRequest', () => {
    describe('when request is successful', () => {
      let mockResponse: any;
      beforeEach(() => {
        mockResponse = { data: 'test' };
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        });
      });

      it('should return parsed JSON response', async () => {
        const result = await (testJiraClient as any).sendRequest(
          'https://example.com/api',
          'GET',
        );

        expect(result).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith('https://example.com/api', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Atlassian-Token': 'no-check',
          },
          body: '',
        });
      });

      it('should include custom headers when provided', async () => {
        const customHeaders = { Authorization: 'Bearer token' };

        await (testJiraClient as any).sendRequest(
          'https://test.com/api',
          'POST',
          customHeaders,
          '{"test": "data"}',
        );

        expect(global.fetch).toHaveBeenCalledWith(
          'https://test.com/api',
          expect.objectContaining({
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              'X-Atlassian-Token': 'no-check',
              Authorization: 'Bearer token',
            },
            body: '{"test": "data"}',
          }),
        );
      });
    });

    describe('when request fails', () => {
      it('should throw error', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

        await expect(
          (testJiraClient as any).sendRequest('https://test.com/api', 'GET'),
        ).rejects.toThrow('Jira request failed with status 404');
      });

      it('should throw error when fetch throws', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(
          new Error('Network error'),
        );

        await expect(
          (testJiraClient as any).sendRequest('https://test.com/api', 'GET'),
        ).rejects.toThrow('Jira error message: Network error');
      });
    });
  });

  describe('getFiltersFromEntity', () => {
    let entity: Entity;

    beforeEach(() => {
      entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'test-component',
          annotations: {
            [ANNOTATION_JIRA_PROJECT_KEY]: 'TEST',
            [ANNOTATION_JIRA_COMPONENT]: 'backend',
            [ANNOTATION_JIRA_LABEL]: 'critical',
            [ANNOTATION_JIRA_TEAM]: 'team-alpha',
            [ANNOTATION_JIRA_CUSTOM_FILTER]: 'priority = High',
          },
        },
      };
    });

    describe('when entity has required project key', () => {
      it('should extract project filter correctly', () => {
        const filters = (testJiraClient as any).getFiltersFromEntity(entity);

        expect(filters).toEqual({
          project: 'project = "TEST"',
          component: 'component = "backend"',
          label: 'labels = "critical"',
          team: 'team = team-alpha',
          customFilter: 'priority = High',
        });
      });
    });

    describe('when entity is missing project key', () => {
      it('should throw error for missing project key', () => {
        entity.metadata.annotations = {};

        expect(() =>
          (testJiraClient as any).getFiltersFromEntity(entity),
        ).toThrow(
          "Missing required Jira project key annotation 'jira/project-key' for entity 'test-component'",
        );
      });
    });
  });

  describe('buildJqlFilters', () => {
    const filters = { project: 'project = "TEST"' };

    describe('when mandatory filter is not provided', () => {
      beforeEach(() => {
        mockConfig.getOptional
          .mockReturnValueOnce(mockJiraConfig)
          .mockReturnValueOnce({
            ...mockJiraOptions,
            mandatoryFilter: undefined,
          });

        testJiraClient = new TestJiraClient(mockConfig);
      });

      it('should use default filter', () => {
        const jql = (testJiraClient as any).buildJqlFilters(filters);
        const jqlFilters = jql.split(' AND ');

        expect(jqlFilters).toContain('type = Bug');
        expect(jqlFilters).toContain('resolution = Unresolved');
      });
    });

    describe('when mandatory filter is provided', () => {
      it('should use mandatory filter', () => {
        const jql = (testJiraClient as any).buildJqlFilters(filters);
        const jqlFilters = jql.split(' AND ');

        expect(jqlFilters).toContain('type = Task');
        expect(jqlFilters).toContain('resolution = Resolved');
      });
    });

    describe('when custom filter is not provided in config', () => {
      beforeEach(() => {
        mockConfig.getOptional
          .mockReturnValueOnce(mockJiraConfig)
          .mockReturnValueOnce({ ...mockJiraOptions, customFilter: undefined });
      });

      it('should use default filter', () => {
        const jql = (testJiraClient as any).buildJqlFilters({
          ...filters,
          customFilter: 'priority = Critical',
        });
        const jqlFilters = jql.split(' AND ');

        expect(jqlFilters).toContain('type = Task');
        expect(jqlFilters).toContain('priority = Critical');
        expect(jqlFilters).not.toContain('assignee = testerUser');
      });
    });

    describe('when custom filter is not provided in options and in config', () => {
      beforeEach(() => {
        mockConfig.getOptional
          .mockReturnValueOnce(mockJiraConfig)
          .mockReturnValueOnce({
            ...mockJiraOptions,
            mandatoryFilter: undefined,
            customFilter: undefined,
          });
      });

      it('should not use any custom filters', () => {
        const jql = (testJiraClient as any).buildJqlFilters(filters);
        const jqlFilters = jql.split(' AND ');

        expect(jqlFilters).toHaveLength(3);
        expect(jqlFilters).toContain('project = "TEST"');
        expect(jqlFilters).toContain('type = Task');
        expect(jqlFilters).toContain('resolution = Resolved');
      });
    });

    describe('when custom filter is provided in config', () => {
      it('should use custom filter', () => {
        const jql = (testJiraClient as any).buildJqlFilters({
          ...filters,
          customFilter: 'priority = Critical',
        });
        const jqlFilters = jql.split(' AND ');

        expect(jqlFilters).toHaveLength(4);
        expect(jqlFilters).toContain('project = "TEST"');
        expect(jqlFilters).toContain('type = Task');
        expect(jqlFilters).toContain('priority = Critical');
        expect(jqlFilters).toContain('resolution = Resolved');
      });
    });

    it('should join multiple filters with AND', () => {
      const jql = (testJiraClient as any).buildJqlFilters({
        ...filters,
        customFilter: 'priority = Critical',
      });

      expect(jql).toEqual(
        'project = "TEST" AND priority = Critical AND type = Bug AND resolution = Unresolved',
      );
    });
  });
});
