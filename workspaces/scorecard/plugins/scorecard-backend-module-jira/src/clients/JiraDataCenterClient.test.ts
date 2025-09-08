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

  beforeEach(() => {
    const getConfig = jest.fn().mockReturnValue({
      getString: jest
        .fn()
        .mockReturnValueOnce('https://datacenter.example.com')
        .mockReturnValueOnce('XMdw2f432dsV')
        .mockReturnValueOnce('datacenter'),
      getOptionalString: jest.fn().mockReturnValueOnce('2'),
    });

    const getOptionalConfig = jest.fn().mockReturnValue({
      getOptionalString: jest
        .fn()
        .mockReturnValueOnce('Type = Task')
        .mockReturnValueOnce(undefined),
    });

    mockConfig = {
      getConfig,
      getOptionalConfig,
    } as unknown as jest.Mocked<Config>;

    jiraDataCenterClient = new JiraDataCenterClient(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create JiraDataCenterClient successfully', () => {
      expect(jiraDataCenterClient).toBeInstanceOf(JiraDataCenterClient);
      expect(mockConfig.getConfig).toHaveBeenCalledTimes(1);
      expect(mockConfig.getOptionalConfig).toHaveBeenCalledTimes(1);
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
