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
import { JiraCloudClient } from './JiraCloudClient';
import { ANNOTATION_JIRA_PROJECT_KEY } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

global.fetch = jest.fn();

describe('JiraCloudClient', () => {
  let mockConfig: jest.Mocked<Config>;
  let jiraCloudClient: JiraCloudClient;
  const getOptional = jest.fn();

  const mockJiraConfig = {
    baseUrl: 'https://test.atlassian.net',
    token: 'dGVzdDp0ZXN0',
    product: 'cloud',
    apiVersion: '3',
  };

  const mockJiraOptions = {
    mandatoryFilter: 'resolution = Unresolved',
  };

  beforeEach(() => {
    mockConfig = {
      getOptional,
    } as unknown as jest.Mocked<Config>;

    mockConfig.getOptional
      .mockReturnValueOnce(mockJiraConfig)
      .mockReturnValueOnce(mockJiraOptions);

    jiraCloudClient = new JiraCloudClient(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    describe('when cloud config is valid', () => {
      it('should create JiraCloudClient successfully', () => {
        expect(jiraCloudClient).toBeInstanceOf(JiraCloudClient);
        expect(mockConfig.getOptional).toHaveBeenCalledTimes(2);
      });
    });

    describe('when cloud config is invalid', () => {
      beforeEach(() => {
        getOptional.mockReturnValue(undefined);
      });

      it('should throw error', () => {
        expect(() => new JiraCloudClient(mockConfig)).toThrow(
          'Missing Jira integration config',
        );
      });
    });
  });

  describe('getAuthHeaders', () => {
    it('should return correct Basic authentication headers', () => {
      const authHeaders = (jiraCloudClient as any).getAuthHeaders();

      expect(authHeaders).toEqual({
        Authorization: `Basic ${mockJiraConfig.token}`,
      });
    });
  });

  describe('getCountOpenIssues', () => {
    const mockEntity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'cloud-component',
        annotations: {
          [ANNOTATION_JIRA_PROJECT_KEY]: 'CLOUD',
        },
      },
    };

    describe('when Jira client processed successfully', () => {
      it('should successfully get count of open issues', async () => {
        const mockResponse = {
          total: 5,
          issues: [],
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        });

        const count = await jiraCloudClient.getCountOpenIssues(mockEntity);

        expect(count).toBe(5);
        expect(global.fetch).toHaveBeenCalledWith(
          'https://test.atlassian.net/rest/api/3/search',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              Accept: 'application/json',
              'Content-Type': 'application/json',
              'X-Atlassian-Token': 'no-check',
              Authorization: `Basic ${mockJiraConfig.token}`,
            }),
            body: expect.stringContaining('"maxResults":0'),
          }),
        );
      });
    });

    describe('when Jira client processed with error', () => {
      it('should propagate errors from Jira client', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(
          new Error('Jira API error'),
        );
        await expect(
          jiraCloudClient.getCountOpenIssues(mockEntity),
        ).rejects.toThrow('Jira API error');
      });
    });
  });
});
