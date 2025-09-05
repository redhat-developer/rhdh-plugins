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
import { ANNOTATION_JIRA_PROJECT_KEY } from '../constants';
import { JiraDataCenterClient } from './JiraDataCenterClient';

global.fetch = jest.fn();

describe('JiraDataCenterClient', () => {
  let mockConfig: jest.Mocked<Config>;
  let jiraDataCenterClient: JiraDataCenterClient;
  const getOptional = jest.fn();

  const mockJiraConfig = {
    baseUrl: 'https://datacenter.example.com',
    token: 'XMdw2f432dsV',
    product: 'datacenter',
    apiVersion: '2',
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

    jiraDataCenterClient = new JiraDataCenterClient(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    describe('when datacenter config is valid', () => {
      it('should create JiraDataCenterClient successfully', () => {
        expect(jiraDataCenterClient).toBeInstanceOf(JiraDataCenterClient);
        expect(mockConfig.getOptional).toHaveBeenCalledTimes(2);
      });
    });

    describe('when datacenter config is invalid', () => {
      beforeEach(() => {
        getOptional.mockReturnValue(undefined);
      });

      it('should throw error', () => {
        expect(() => new JiraDataCenterClient(mockConfig)).toThrow(
          'Missing Jira integration config',
        );
      });
    });
  });

  describe('getAuthHeaders', () => {
    it('should return correct Bearer authentication headers', () => {
      const authHeaders = (jiraDataCenterClient as any).getAuthHeaders();

      expect(authHeaders).toEqual({
        Authorization: `Bearer ${mockJiraConfig.token}`,
      });
    });
  });

  describe('getCountOpenIssues', () => {
    const mockEntity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'datacenter-component',
        annotations: {
          [ANNOTATION_JIRA_PROJECT_KEY]: 'DATACENTER',
        },
      },
    };

    describe('when Jira datacenter processed successfully', () => {
      it('should successfully get count of open issues', async () => {
        const mockResponse = {
          total: 6,
          issues: [],
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        });

        const count = await jiraDataCenterClient.getCountOpenIssues(mockEntity);

        expect(count).toBe(6);
        expect(global.fetch).toHaveBeenCalledWith(
          'https://datacenter.example.com/rest/api/2/search',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              Accept: 'application/json',
              'Content-Type': 'application/json',
              'X-Atlassian-Token': 'no-check',
              Authorization: `Bearer ${mockJiraConfig.token}`,
            }),
            body: expect.stringContaining('"maxResults":0'),
          }),
        );
      });
    });

    describe('when Jira datacenter processed with error', () => {
      it('should propagate errors from Jira datacenter', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(
          new Error('Jira API error'),
        );
        await expect(
          jiraDataCenterClient.getCountOpenIssues(mockEntity),
        ).rejects.toThrow('Jira API error');
      });
    });
  });
});
