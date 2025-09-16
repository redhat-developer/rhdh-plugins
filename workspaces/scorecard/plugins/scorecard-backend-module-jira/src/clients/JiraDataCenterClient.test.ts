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
import { ScorecardJiraAnnotations } from '../annotations';
import { JiraDataCenterClient } from './JiraDataCenterClient';
import { mockServices } from '@backstage/backend-test-utils';

global.fetch = jest.fn();

const { PROJECT_KEY } = ScorecardJiraAnnotations;

describe('JiraDataCenterClient', () => {
  let jiraDataCenterClient: JiraDataCenterClient;

  beforeEach(() => {
    const config = mockServices.rootConfig({
      data: {
        jira: {
          baseUrl: 'https://datacenter.example.com',
          token: 'XMdw2f432dsV',
          product: 'datacenter',
          apiVersion: '2',
        },
        scorecard: {
          plugins: {
            jira: {
              open_issues: {
                options: {
                  mandatoryFilter: 'Type = Task',
                  customFilter: 'priority in ("Critical", "Blocker")',
                },
              },
            },
          },
        },
      },
    });

    jiraDataCenterClient = new JiraDataCenterClient(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create JiraDataCenterClient successfully', () => {
      expect(jiraDataCenterClient).toBeInstanceOf(JiraDataCenterClient);
    });
  });

  describe('getAuthHeaders', () => {
    it('should return correct Bearer authentication headers', () => {
      const authHeaders = (jiraDataCenterClient as any).getAuthHeaders();

      expect(authHeaders).toEqual({
        Authorization: `Bearer XMdw2f432dsV`,
      });
    });
  });

  describe('getSearchEndpoint', () => {
    it('should return correct search endpoint', () => {
      const searchEndpoint = (jiraDataCenterClient as any).getSearchEndpoint();
      expect(searchEndpoint).toEqual('/search');
    });
  });

  describe('buildSearchBody', () => {
    it('should return correct search body', () => {
      const searchBody = (jiraDataCenterClient as any).buildSearchBody(
        'project = DATACENTER',
      );
      const responseBody = JSON.stringify({
        jql: 'project = DATACENTER',
        fields: [],
        maxResults: 0,
      });
      expect(searchBody).toEqual(responseBody);
    });
  });

  describe('extractIssueCountFromResponse', () => {
    it('should return correct issue count', () => {
      const issueCount = (
        jiraDataCenterClient as any
      ).extractIssueCountFromResponse({ total: 10 });
      expect(issueCount).toBe(10);
    });

    it('should throw error for incorrect response data', () => {
      expect(() =>
        (jiraDataCenterClient as any).extractIssueCountFromResponse({}),
      ).toThrow('Incorrect response data for Jira Data Center client');
    });
  });

  describe('getCountOpenIssues', () => {
    const mockEntity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'datacenter-component',
        annotations: {
          [PROJECT_KEY]: 'DATACENTER',
        },
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ total: 10 }),
    });

    it('should get count with Bearer auth header', async () => {
      const count = await jiraDataCenterClient.getCountOpenIssues(mockEntity);
      expect(count).toBe(10);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://datacenter.example.com/rest/api/2/search',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer XMdw2f432dsV`,
          }),
        }),
      );
    });
  });
});
