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
import { ScorecardJiraAnnotations } from '../annotations';
import { mockServices } from '@backstage/backend-test-utils';

const { PROJECT_KEY, COMPONENT, LABEL, TEAM, CUSTOM_FILTER } =
  ScorecardJiraAnnotations;

class TestJiraClient extends JiraClient {
  getAuthHeaders(): Record<string, string> {
    return { Authorization: 'Bearer test-token' };
  }

  getSearchEndpoint(): string {
    return '/search';
  }

  buildSearchBody(jql: string): string {
    return JSON.stringify({ jql });
  }

  extractIssueCountFromResponse(): number {
    return 10;
  }
}

global.fetch = jest.fn();

describe('JiraClient', () => {
  let testJiraClient: TestJiraClient;
  let mockRootConfig: Config;

  const mockMethod = 'GET';
  const mockURL = 'https://example.com/api';
  const mockResponse = { data: { total: 10 } };

  const createConfigWithOptions = ({
    mandatoryFilter,
    customFilter,
  }: {
    mandatoryFilter?: string;
    customFilter?: string;
  }) => {
    return {
      data: {
        jira: {
          baseUrl: mockURL,
          token: 'token',
          product: 'cloud',
          apiVersion: '3',
        },
        scorecard: {
          plugins: {
            jira: {
              open_issues: {
                options: {
                  mandatoryFilter,
                  customFilter,
                },
              },
            },
          },
        },
      },
    };
  };

  beforeEach(() => {
    const config = createConfigWithOptions({
      mandatoryFilter: 'type = Task AND resolution = Resolved',
      customFilter: 'assignee = testerUser',
    });
    mockRootConfig = mockServices.rootConfig(config);

    testJiraClient = new TestJiraClient(mockRootConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create correct config', () => {
      expect((testJiraClient as any).config).toEqual({
        baseUrl: 'https://example.com/api',
        token: 'token',
        product: 'cloud',
        apiVersion: '3',
      });
    });

    it('should create correct options', () => {
      expect((testJiraClient as any).options).toEqual({
        mandatoryFilter: 'type = Task AND resolution = Resolved',
        customFilter: 'assignee = testerUser',
      });
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
            [PROJECT_KEY]: 'TEST',
          },
        },
      };
    });

    describe('when entity has only "project key"', () => {
      it('should extract project filter correctly', () => {
        const filters = (testJiraClient as any).getFiltersFromEntity(entity);

        expect(filters).toEqual({
          project: 'project = "TEST"',
        });
      });
    });

    describe('when entity is missing "project key"', () => {
      beforeEach(() => {
        entity.metadata.annotations = {};
      });

      it('should throw error for missing project key', () => {
        expect(() =>
          (testJiraClient as any).getFiltersFromEntity(entity),
        ).toThrow(
          "Missing required 'jira/project-key' annotation for entity 'test-component'",
        );
      });
    });

    describe('when "project key" is invalid', () => {
      beforeEach(() => {
        entity.metadata.annotations = {
          ...entity.metadata.annotations,
          [PROJECT_KEY]: 'TEST$123',
        };
      });

      it('should throw error for invalid "project key"', () => {
        expect(() =>
          (testJiraClient as any).getFiltersFromEntity(entity),
        ).toThrow(
          'jira/project-key contains invalid characters. Only alphanumeric, hyphens, spaces, and underscores are allowed.',
        );
      });
    });

    describe('when entity has "project key", "component", "label", "team", and "custom filter"', () => {
      beforeEach(() => {
        entity.metadata.annotations = {
          [PROJECT_KEY]: 'TEST',
          [COMPONENT]: 'backend',
          [LABEL]: 'critical',
          [TEAM]: '4316',
          [CUSTOM_FILTER]: 'priority = High',
        };
      });

      it('should extract all filters correctly', () => {
        const filters = (testJiraClient as any).getFiltersFromEntity(entity);

        expect(filters).toEqual({
          project: 'project = "TEST"',
          component: 'component = "backend"',
          label: 'labels = "critical"',
          team: 'team = 4316',
          customFilter: 'priority = High',
        });
      });
    });

    describe('when "component" is invalid', () => {
      beforeEach(() => {
        entity.metadata.annotations = {
          ...entity.metadata.annotations,
          [COMPONENT]: 'backend$123',
        };
      });

      it('should throw error for invalid "component"', () => {
        expect(() =>
          (testJiraClient as any).getFiltersFromEntity(entity),
        ).toThrow(
          'jira/component contains invalid characters. Only alphanumeric, hyphens, spaces, and underscores are allowed.',
        );
      });
    });

    describe('when "label" is invalid', () => {
      beforeEach(() => {
        entity.metadata.annotations = {
          ...entity.metadata.annotations,
          [LABEL]: 'critical$123',
        };
      });

      it('should throw error for invalid "label"', () => {
        expect(() =>
          (testJiraClient as any).getFiltersFromEntity(entity),
        ).toThrow(
          'jira/label contains invalid characters. Only alphanumeric, hyphens, spaces, and underscores are allowed.',
        );
      });
    });

    describe('when "team" is invalid', () => {
      beforeEach(() => {
        entity.metadata.annotations = {
          ...entity.metadata.annotations,
          [TEAM]: 'team-alpha$123',
        };
      });

      it('should throw error for invalid "team"', () => {
        expect(() =>
          (testJiraClient as any).getFiltersFromEntity(entity),
        ).toThrow(
          'jira/team contains invalid characters. Only alphanumeric, hyphens, and underscores are allowed.',
        );
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
        expect(jqlFilters).toContain('(project = "MOON")');
      });
    });

    describe('when mandatory filter is not provided in options', () => {
      beforeEach(() => {
        const updatedConfig = createConfigWithOptions({
          customFilter: 'assignee = Robot',
        });
        testJiraClient = new TestJiraClient(
          mockServices.rootConfig(updatedConfig),
        );
      });

      it('should use default mandatory filter', () => {
        const jql = (testJiraClient as any).buildJqlFilters({});
        expect(jql).toBe(
          '(type = Bug AND resolution = Unresolved) AND (assignee = Robot)',
        );
      });
    });

    describe('when custom filter is provided in annotation', () => {
      const customFilter = 'assignee = Robot';

      describe('when custom filter is provided in options', () => {
        it('should use provided annotation custom filter', () => {
          const jql = (testJiraClient as any).buildJqlFilters({ customFilter });
          const jqlFilters = jql.split(' AND ');

          expect(jqlFilters).toHaveLength(3);
          expect(jqlFilters).toContain('(assignee = Robot)');
        });
      });

      describe('when custom filter is not provided in options', () => {
        beforeEach(() => {
          const updatedConfig = createConfigWithOptions({
            mandatoryFilter: 'resolution = Unresolved',
          });
          testJiraClient = new TestJiraClient(
            mockServices.rootConfig(updatedConfig),
          );
        });

        it('should use provided annotation custom filter', () => {
          const jql = (testJiraClient as any).buildJqlFilters({ customFilter });
          expect(jql).toBe('(assignee = Robot) AND (resolution = Unresolved)');
        });
      });
    });

    describe('when custom filter is not provided in annotation', () => {
      describe('when custom filter is provided in options', () => {
        it('should use provided options custom filter', () => {
          const jql = (testJiraClient as any).buildJqlFilters({});
          const jqlFilters = jql.split(' AND ');

          expect(jqlFilters).toHaveLength(3);
          expect(jqlFilters).toContain('(assignee = testerUser)');
        });
      });

      describe('when custom filter is not provided in options', () => {
        beforeEach(() => {
          const updatedConfig = createConfigWithOptions({
            mandatoryFilter: 'resolution = Unresolved',
          });
          testJiraClient = new TestJiraClient(
            mockServices.rootConfig(updatedConfig),
          );
        });

        it('should not use any custom filters', () => {
          const jql = (testJiraClient as any).buildJqlFilters({});
          const jqlFilters = jql.split(' AND ');

          expect(jqlFilters).toHaveLength(1);
          expect(jqlFilters).toContain('(resolution = Unresolved)');
        });
      });
    });
  });
});
