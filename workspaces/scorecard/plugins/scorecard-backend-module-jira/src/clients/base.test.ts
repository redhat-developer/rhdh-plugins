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

class TestJiraClient extends JiraClient {
  getAuthHeaders(): Record<string, string> {
    return { Authorization: 'Bearer test-token' };
  }
}

global.fetch = jest.fn();

describe('JiraClient', () => {
  let mockConfig: jest.Mocked<Config>;
  let getConfig: jest.Mock;
  let getString: jest.Mock;
  let getOptionalConfig: jest.Mock;
  let getOptionalString: jest.Mock;
  let testJiraClient: TestJiraClient;

  const mockMethod = 'GET';
  const mockURL = 'https://example.com/api';
  const mockResponse = { data: { total: 10 } };

  beforeEach(() => {
    getString = jest
      .fn()
      .mockReturnValueOnce(mockURL)
      .mockReturnValueOnce('token')
      .mockReturnValueOnce('cloud');
    getOptionalString = jest
      .fn()
      .mockReturnValueOnce('3')
      .mockReturnValueOnce('type = Task AND resolution = Resolved')
      .mockReturnValueOnce('assignee = testerUser');

    getConfig = jest.fn().mockReturnValue({
      getString,
      getOptionalString,
    });

    getOptionalConfig = jest.fn().mockReturnValue({
      getOptionalString,
    });

    mockConfig = {
      getConfig,
      getOptionalConfig,
    } as unknown as jest.Mocked<Config>;

    testJiraClient = new TestJiraClient(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should get jira config', () => {
      expect(getConfig).toHaveBeenNthCalledWith(1, 'jira');
    });

    it('should get "baseUrl" from jira config', () => {
      expect(getString).toHaveBeenNthCalledWith(1, 'baseUrl');
    });

    it('should get "token" from jira config', () => {
      expect(getString).toHaveBeenNthCalledWith(2, 'token');
    });

    it('should get "product" from jira config', () => {
      expect(getString).toHaveBeenNthCalledWith(3, 'product');
    });

    it('should get "apiVersion" from jira config', () => {
      expect(getOptionalString).toHaveBeenNthCalledWith(1, 'apiVersion');
    });

    it('should get jira options', () => {
      expect(getOptionalConfig).toHaveBeenNthCalledWith(
        1,
        'scorecard.plugins.jira.open_issues.options',
      );
    });

    it('should get "mandatoryFilter" from jira options', () => {
      expect(getOptionalString).toHaveBeenNthCalledWith(2, 'mandatoryFilter');
    });

    it('should get "customFilter" from jira options', () => {
      expect(getOptionalString).toHaveBeenNthCalledWith(3, 'customFilter');
    });
  });

  describe('sendRequest', () => {
    describe('when request is successful', () => {
      beforeEach(() => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        });
      });

      it('should use applied URL method and default headers', () => {
        (testJiraClient as any).sendRequest({
          url: mockURL,
          method: mockMethod,
        });
        expect(global.fetch).toHaveBeenCalledWith(
          mockURL,
          expect.objectContaining({
            method: mockMethod,
            headers: expect.objectContaining({
              Accept: 'application/json',
              'Content-Type': 'application/json',
              'X-Atlassian-Token': 'no-check',
            }),
          }),
        );
      });

      it('should add additional header when provided', () => {
        (testJiraClient as any).sendRequest({
          url: mockURL,
          method: mockMethod,
          headers: { Authorization: `Bearer test-token` },
        });
        expect(global.fetch).toHaveBeenCalledWith(
          mockURL,
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: `Bearer test-token`,
            }),
          }),
        );
      });

      it('should add body when provided', () => {
        (testJiraClient as any).sendRequest({
          url: mockURL,
          method: mockMethod,
          body: 'maxResults: 0',
        });
        expect(global.fetch).toHaveBeenCalledWith(
          mockURL,
          expect.objectContaining({
            body: 'maxResults: 0',
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
          (testJiraClient as any).sendRequest({
            url: mockURL,
            method: mockMethod,
          }),
        ).rejects.toThrow('Jira request failed with status 404');
      });

      it('should throw error when fetch throws', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(
          new Error('Network error'),
        );

        await expect(
          (testJiraClient as any).sendRequest({
            url: mockURL,
            method: mockMethod,
          }),
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
          },
        },
      };
    });

    describe('when entity has only project key', () => {
      it('should extract project filter correctly', () => {
        const filters = (testJiraClient as any).getFiltersFromEntity(entity);

        expect(filters).toEqual({
          project: 'project = "TEST"',
        });
      });
    });

    describe('when entity is missing project key', () => {
      it('should throw error for missing project key', () => {
        entity.metadata.annotations = {};

        expect(() =>
          (testJiraClient as any).getFiltersFromEntity(entity),
        ).toThrow(
          "Missing required 'jira/project-key' annotation for entity 'test-component'",
        );
      });
    });

    describe('when entity has project key, component, label, team, and custom filter', () => {
      beforeEach(() => {
        entity.metadata.annotations = {
          [ANNOTATION_JIRA_PROJECT_KEY]: 'TEST',
          [ANNOTATION_JIRA_COMPONENT]: 'backend',
          [ANNOTATION_JIRA_LABEL]: 'critical',
          [ANNOTATION_JIRA_TEAM]: 'team-alpha',
          [ANNOTATION_JIRA_CUSTOM_FILTER]: 'priority = High',
        };
      });

      it('should extract all filters correctly', () => {
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
  });

  describe('buildJqlFilters', () => {
    describe('when mandatory filter is provided in options', () => {
      it('should use provided mandatory filter', () => {
        const filters = { project: 'project = "MOON"' };
        const jql = (testJiraClient as any).buildJqlFilters(filters);
        const jqlFilters = jql.split(' AND ');

        expect(jqlFilters).toHaveLength(4);
        expect(jqlFilters).toContain('project = "MOON"');
      });
    });

    describe('when mandatory filter is not provided in options', () => {
      beforeEach(() => {
        getOptionalString.mockReset();
        getOptionalString
          .mockReturnValueOnce('2')
          .mockReturnValueOnce(undefined);
        testJiraClient = new TestJiraClient(mockConfig);
      });

      it('should use default mandatory filter', () => {
        const jql = (testJiraClient as any).buildJqlFilters({});
        const jqlFilters = jql.split(' AND ');

        expect(jqlFilters).toHaveLength(2);
        expect(jqlFilters).toContain('type = Bug');
        expect(jqlFilters).toContain('resolution = Unresolved');
      });
    });

    describe('when custom filter is provided in annotation', () => {
      const customFilter = 'assignee = Robot';

      describe('when custom filter is provided in options', () => {
        it('should use provided annotation custom filter', () => {
          const jql = (testJiraClient as any).buildJqlFilters({ customFilter });
          const jqlFilters = jql.split(' AND ');

          expect(jqlFilters).toHaveLength(3);
          expect(jqlFilters).toContain('assignee = Robot');
        });
      });

      describe('when custom filter is not provided in options', () => {
        beforeEach(() => {
          getOptionalString.mockReset();
          getOptionalString.mockReturnValue(undefined).mockReturnValueOnce('3');

          testJiraClient = new TestJiraClient(mockConfig);
        });

        it('should use provided annotation custom filter', () => {
          const jql = (testJiraClient as any).buildJqlFilters({ customFilter });
          const jqlFilters = jql.split(' AND ');

          expect(jqlFilters).toHaveLength(3);
          expect(jqlFilters).toContain('assignee = Robot');
        });
      });
    });

    describe('when custom filter is not provided in annotation', () => {
      describe('when custom filter is provided in options', () => {
        it('should use provided options custom filter', () => {
          const jql = (testJiraClient as any).buildJqlFilters({});
          const jqlFilters = jql.split(' AND ');

          expect(jqlFilters).toHaveLength(3);
          expect(jqlFilters).toContain('assignee = testerUser');
        });
      });

      describe('when custom filter is not provided in options', () => {
        beforeEach(() => {
          getOptionalString.mockReset();
          getOptionalString
            .mockReturnValueOnce('3')
            .mockReturnValueOnce('resolution = Unresolved')
            .mockReturnValueOnce(undefined);
          testJiraClient = new TestJiraClient(mockConfig);
        });

        it('should not use any custom filters', () => {
          const jql = (testJiraClient as any).buildJqlFilters({});
          const jqlFilters = jql.split(' AND ');

          expect(jqlFilters).toHaveLength(1);
          expect(jqlFilters).toContain('resolution = Unresolved');
        });
      });
    });
  });
});
