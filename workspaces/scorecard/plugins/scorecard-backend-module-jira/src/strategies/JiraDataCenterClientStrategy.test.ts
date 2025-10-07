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
import { JiraDataCenterClientStrategy } from './JiraDataCenterClientStrategy';
import {
  newEntityComponent,
  newMockRootConfig,
} from '../../__fixtures__/testUtils';

globalThis.fetch = jest.fn();

const { PROJECT_KEY } = ScorecardJiraAnnotations;

const mockConnectionStrategy = {
  getBaseUrl: jest.fn().mockReturnValue('https://example.com/api/rest/api/2'),
  getAuthHeaders: jest
    .fn()
    .mockResolvedValue({ Authorization: 'Bearer Fds31dsF32' }),
};

describe('JiraDataCenterClient', () => {
  let jiraDataCenterClient: JiraDataCenterClientStrategy;

  beforeEach(() => {
    const options = {
      mandatoryFilter: 'Type = Task',
      customFilter: 'priority in ("Critical", "Blocker")',
    };
    const config = newMockRootConfig({
      options,
      jiraConfig: { product: 'datacenter' },
    });

    jiraDataCenterClient = new JiraDataCenterClientStrategy(
      config,
      mockConnectionStrategy,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create JiraDataCenterClient successfully', () => {
      expect(jiraDataCenterClient).toBeInstanceOf(JiraDataCenterClientStrategy);
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
    const mockEntity: Entity = newEntityComponent({
      [PROJECT_KEY]: 'DATACENTER',
    });

    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ total: 10 }),
    });

    it('should get count of open issues', async () => {
      const count = await jiraDataCenterClient.getCountOpenIssues(mockEntity);
      expect(count).toBe(10);
    });
  });

  describe('getApiVersion', () => {
    it('should return Jira Data Center api version', () => {
      const apiVersion = (jiraDataCenterClient as any).getApiVersion();
      expect(apiVersion).toEqual(2);
    });
  });
});
