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

import { ConfigReader } from '@backstage/config';
import { DefaultGithubCredentialsProvider } from '@backstage/integration';
import { DependabotClient } from './DependabotClient';

const mockPaginate = jest.fn();

jest
  .spyOn(DefaultGithubCredentialsProvider.prototype, 'getCredentials')
  .mockResolvedValue({
    type: 'token',
    token: 'dummy-token',
  });

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({ paginate: mockPaginate })),
}));

describe('DependabotClient', () => {
  const config = new ConfigReader({
    integrations: {
      github: [
        {
          host: 'github.com',
          token: 'dummy-token',
          apiBaseUrl: 'https://api.github.com',
        },
      ],
    },
  });
  const logger = {
    child: jest.fn().mockReturnThis(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  } as any;
  const repo = { owner: 'owner', repo: 'repo' };
  const url = 'https://github.com/owner/repo';

  let client: DependabotClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new DependabotClient(config, logger);
    mockPaginate.mockResolvedValue([]);
  });

  it('delegates to Octokit paginate with correct params', async () => {
    const alerts = [
      {
        number: 1,
        state: 'open',
        createdAt: '2024-01-01',
        securityAdvisory: { severity: 'critical' },
      },
    ];
    mockPaginate.mockResolvedValueOnce(alerts);

    const result = await client.getAlerts(url, repo, 'critical');

    expect(result).toEqual(alerts);
    const { Octokit } = jest.requireMock('@octokit/rest');
    expect(Octokit).toHaveBeenCalledWith({
      auth: 'dummy-token',
      baseUrl: 'https://api.github.com',
    });
    expect(mockPaginate).toHaveBeenCalledWith(
      'GET /repos/{owner}/{repo}/dependabot/alerts',
      expect.objectContaining({
        owner: 'owner',
        repo: 'repo',
        state: 'open',
        severity: 'critical',
        per_page: 100,
      }),
    );
  });

  it('throws when GitHub integration is missing', async () => {
    await expect(
      client.getAlerts('https://unknown/owner/repo', repo, 'critical'),
    ).rejects.toThrow(
      "Missing GitHub integration for 'https://unknown/owner/repo'",
    );
    expect(mockPaginate).not.toHaveBeenCalled();
  });

  it('throws when token is missing', async () => {
    (
      DefaultGithubCredentialsProvider.prototype.getCredentials as jest.Mock
    ).mockResolvedValueOnce({ type: 'token' });

    await expect(client.getAlerts(url, repo, 'critical')).rejects.toThrow(
      `Missing GitHub token for '${url}'`,
    );
    expect(mockPaginate).not.toHaveBeenCalled();
  });

  it('throws when Octokit paginate fails', async () => {
    mockPaginate.mockRejectedValueOnce(new Error('GitHub API error: 403'));

    await expect(client.getAlerts(url, repo, 'critical')).rejects.toThrow(
      /GitHub API error/,
    );
  });
});
