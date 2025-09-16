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
import { JiraCloudClient } from './JiraCloudClient';
import { ScorecardJiraAnnotations } from '../annotations';
import { mockServices } from '@backstage/backend-test-utils';

const { PROJECT_KEY } = ScorecardJiraAnnotations;

global.fetch = jest.fn();

describe('JiraCloudClient', () => {
  let jiraCloudClient: JiraCloudClient;

  beforeEach(() => {
    const config = mockServices.rootConfig({
      data: {
        jira: {
          baseUrl: 'https://jira.example.com',
          token: 'Fds31dsF32',
          product: 'cloud',
          apiVersion: '3',
        },
        scorecard: {
          plugins: {
            jira: {
              open_issues: {
                options: {
                  mandatoryFilter: 'Type = Bug',
                  customFilter: undefined,
                },
              },
            },
          },
        },
      },
    });
    jiraCloudClient = new JiraCloudClient(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create JiraCloudClient successfully', () => {
      expect(jiraCloudClient).toBeInstanceOf(JiraCloudClient);
    });
  });

  describe('getAuthHeaders', () => {
    it('should return correct Basic authentication headers', () => {
      const authHeaders = (jiraCloudClient as any).getAuthHeaders();
      expect(authHeaders).toEqual({
        Authorization: `Basic Fds31dsF32`,
      });
    });
  });

  describe('getSearchEndpoint', () => {
    it('should return correct search endpoint', () => {
      const searchEndpoint = (jiraCloudClient as any).getSearchEndpoint();
      expect(searchEndpoint).toEqual('/search/approximate-count');
    });
  });

  describe('buildSearchBody', () => {
    it('should return correct search body', () => {
      const searchBody = (jiraCloudClient as any).buildSearchBody(
        'project = CLOUD',
      );
      const responseBody = JSON.stringify({ jql: 'project = CLOUD' });
      expect(searchBody).toEqual(responseBody);
    });
  });

  describe('extractIssueCountFromResponse', () => {
    it('should return correct issue count', () => {
      const issueCount = (jiraCloudClient as any).extractIssueCountFromResponse(
        { count: 5 },
      );
      expect(issueCount).toBe(5);
    });

    it('should throw error for incorrect response data', () => {
      expect(() =>
        (jiraCloudClient as any).extractIssueCountFromResponse({}),
      ).toThrow('Incorrect response data for Jira Cloud client');
    });
  });

  describe('getCountOpenIssues', () => {
    const mockEntity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'cloud-component',
        annotations: {
          [PROJECT_KEY]: 'CLOUD',
        },
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ count: 5 }),
    });

    it('should get count with Basic auth header', async () => {
      const count = await jiraCloudClient.getCountOpenIssues(mockEntity);
      expect(count).toBe(5);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://jira.example.com/rest/api/3/search/approximate-count',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Basic Fds31dsF32`,
          }),
        }),
      );
    });
  });
});
