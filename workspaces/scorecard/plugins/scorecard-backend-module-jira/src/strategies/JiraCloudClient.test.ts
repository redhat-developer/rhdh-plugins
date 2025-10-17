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
import { JiraCloudClientStrategy } from './JiraCloudClientStrategy';
import { ScorecardJiraAnnotations } from '../annotations';
import {
  newEntityComponent,
  newMockRootConfig,
} from '../../__fixtures__/testUtils';

const { PROJECT_KEY } = ScorecardJiraAnnotations;

globalThis.fetch = jest.fn();

const mockConnectionStrategy = {
  getBaseUrl: jest.fn().mockReturnValue('https://example.com/api/rest/api/3'),
  getAuthHeaders: jest
    .fn()
    .mockResolvedValue({ Authorization: 'Basic Fds31dsF32' }),
};

describe('JiraCloudClient', () => {
  let jiraCloudClient: JiraCloudClientStrategy;

  beforeEach(() => {
    const config = newMockRootConfig({
      options: { mandatoryFilter: 'Type = Bug' },
    });

    jiraCloudClient = new JiraCloudClientStrategy(
      config,
      mockConnectionStrategy,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create JiraCloudClient successfully', () => {
      expect(jiraCloudClient).toBeInstanceOf(JiraCloudClientStrategy);
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
    const mockEntity: Entity = newEntityComponent({ [PROJECT_KEY]: 'TEST' });

    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ count: 5 }),
    });

    it('should get count with Basic auth header', async () => {
      const count = await jiraCloudClient.getCountOpenIssues(mockEntity);
      expect(count).toBe(5);
    });
  });

  describe('getApiVersion', () => {
    it('should return Jira Cloud api version', () => {
      const apiVersion = (jiraCloudClient as any).getApiVersion();
      expect(apiVersion).toEqual(3);
    });
  });
});
