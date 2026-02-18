/**
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

import { ConfigReader } from '@backstage/config';
import { DefaultGithubCredentialsProvider } from '@backstage/integration';
import { DependabotClient } from './DependabotClient';

describe('DependabotClient', () => {
  let dependabotClient: DependabotClient;
  const mockedGraphqlClient = jest.fn();
  const repository = { owner: 'owner', repo: 'repo' };

  const getCredentialsSpy = jest
    .spyOn(DefaultGithubCredentialsProvider.prototype, 'getCredentials')
    .mockResolvedValue({
      type: 'token',
      headers: { Authorization: 'Bearer dummy-token' },
      token: 'dummy-token',
    });

  beforeEach(() => {
    jest.clearAllMocks();

    // @ts-ignore
    jest.unstable_mockModule('@octokit/graphql', async () => ({
      graphql: {
        defaults: () => mockedGraphqlClient,
      },
    }));

    const mockConfig = new ConfigReader({
      integrations: {
        github: [
          {
            host: 'github.com',
            token: 'dummy-token',
          },
        ],
      },
    });
    dependabotClient = new DependabotClient(mockConfig);
  });

  describe('getDependabotAlerts', () => {
    it('should return the list of alerts', async () => {
      const url = 'https://github.com/owner/repo';
      const response = {
        repository: {
          vulnerabilityAlerts: {
            nodes: [
              {
                number: 1,
                state: 'OPEN',
                createdAt: '2021-01-01',
                securityAdvisory: { severity: 'HIGH' },
              },
            ],
          },
        },
      };
      mockedGraphqlClient.mockResolvedValue(response);

      const result = await dependabotClient.getDependabotAlerts(
        url,
        repository,
      );

      expect(result).toHaveLength(1);
      expect(result[0].number).toBe(1);
      expect(result[0].state).toBe('OPEN');
      expect(result[0].createdAt).toBe('2021-01-01');
      expect(result[0].severity).toBe('HIGH');
      expect(mockedGraphqlClient).toHaveBeenCalledTimes(1);
      expect(mockedGraphqlClient).toHaveBeenCalledWith(
        expect.stringContaining('query getDependabotAlerts'),
        repository,
      );
      expect(getCredentialsSpy).toHaveBeenCalledWith({
        url,
      });
    });

    it('should throw error when GitHub integration for URL is missing', async () => {
      const unknownUrl = 'https://unknown-host/owner/repo';
      await expect(
        dependabotClient.getDependabotAlerts(unknownUrl, repository),
      ).rejects.toThrow(`Missing GitHub integration for '${unknownUrl}'`);
    });
  });
});
