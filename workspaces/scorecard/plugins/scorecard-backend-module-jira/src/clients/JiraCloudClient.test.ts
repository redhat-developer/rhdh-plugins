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
import { ANNOTATION_JIRA_PROJECT_KEY } from '../constants';

global.fetch = jest.fn();

describe('JiraCloudClient', () => {
  let mockConfig: jest.Mocked<Config>;
  let jiraCloudClient: JiraCloudClient;

  beforeEach(() => {
    mockConfig = {
      getConfig: jest.fn().mockReturnValue({
        getString: jest
          .fn()
          .mockReturnValueOnce('https://jira.example.com')
          .mockReturnValueOnce('Fds31dsF32')
          .mockReturnValueOnce('cloud'),
        getOptionalString: jest.fn().mockReturnValueOnce('3'),
      }),
      getOptionalConfig: jest.fn().mockReturnValue({
        getOptionalString: jest
          .fn()
          .mockReturnValueOnce('Type = Bug')
          .mockReturnValueOnce(undefined),
      }),
    } as unknown as jest.Mocked<Config>;

    jiraCloudClient = new JiraCloudClient(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create JiraCloudClient successfully', () => {
      expect(jiraCloudClient).toBeInstanceOf(JiraCloudClient);
      expect(mockConfig.getConfig).toHaveBeenCalledTimes(1);
      expect(mockConfig.getOptionalConfig).toHaveBeenCalledTimes(1);
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

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ total: 5 }),
    });

    it('should get count with Basic auth header', async () => {
      const count = await jiraCloudClient.getCountOpenIssues(mockEntity);
      expect(count).toBe(5);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://jira.example.com/rest/api/3/search',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Basic Fds31dsF32`,
          }),
        }),
      );
    });
  });
});
