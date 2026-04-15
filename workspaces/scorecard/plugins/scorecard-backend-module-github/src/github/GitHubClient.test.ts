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
import { GithubClient } from './GithubClient';
import { GithubRepository } from './types';

describe('GithubClient', () => {
  let githubClient: GithubClient;
  const mockedGraphqlClient = jest.fn();
  const repository: GithubRepository = {
    owner: 'owner',
    repo: 'repo',
  };

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
    githubClient = new GithubClient(mockConfig);
  });

  describe('getOpenPullRequestsCount', () => {
    it('should return the count of open pull requests', async () => {
      const url = `https://github.com/owner/repo`;
      const response = {
        repository: {
          pullRequests: {
            totalCount: 42,
          },
        },
      };
      mockedGraphqlClient.mockResolvedValue(response);

      const result = await githubClient.getOpenPullRequestsCount(
        url,
        repository,
      );

      expect(result).toBe(42);
      expect(mockedGraphqlClient).toHaveBeenCalledTimes(1);
      expect(mockedGraphqlClient).toHaveBeenCalledWith(
        expect.stringContaining('query getOpenPRsCount'),
        repository,
      );
      expect(getCredentialsSpy).toHaveBeenCalledWith({
        url,
      });
    });

    it('should throw error when GitHub integration for URL is missing', async () => {
      const unknownUrl = 'https://unknown-host/owner/repo';
      await expect(
        githubClient.getOpenPullRequestsCount(unknownUrl, repository),
      ).rejects.toThrow(`Missing GitHub integration for '${unknownUrl}'`);
    });
  });

  describe('checkFilesExist', () => {
    it('should return true for files that exist and false for those that do not', async () => {
      const url = 'https://github.com/owner/repo';
      const files = new Map<string, string>([
        ['github.files_check.readme', 'README.md'],
        ['github.files_check.license', 'LICENSE'],
        ['github.files_check.codeowners', 'CODEOWNERS'],
      ]);

      const response = {
        repository: {
          github_files_check_readme: { id: 'abc123' },
          github_files_check_license: null,
          github_files_check_codeowners: { id: 'def456' },
        },
      };
      mockedGraphqlClient.mockResolvedValue(response);

      const result = await githubClient.checkFilesExist(url, repository, files);

      expect(result.get('github.files_check.readme')).toBe(true);
      expect(result.get('github.files_check.license')).toBe(false);
      expect(result.get('github.files_check.codeowners')).toBe(true);
      expect(mockedGraphqlClient).toHaveBeenCalledTimes(1);
      expect(mockedGraphqlClient).toHaveBeenCalledWith(
        expect.stringContaining('query checkFilesExist'),
        { owner: 'owner', repo: 'repo' },
      );
      expect(getCredentialsSpy).toHaveBeenCalledWith({ url });
    });

    it('should sanitize metric IDs with special characters to valid GraphQL aliases', async () => {
      const url = 'https://github.com/owner/repo';
      const files = new Map<string, string>([
        ['github.files_check.my-file', 'my-file.txt'],
      ]);

      const response = {
        repository: {
          github_files_check_my_file: { id: 'xyz789' },
        },
      };
      mockedGraphqlClient.mockResolvedValue(response);

      const result = await githubClient.checkFilesExist(url, repository, files);

      expect(result.get('github.files_check.my-file')).toBe(true);
      expect(mockedGraphqlClient).toHaveBeenCalledWith(
        expect.stringContaining('github_files_check_my_file'),
        expect.any(Object),
      );
    });

    it('should return an empty map when no files are provided', async () => {
      const url = 'https://github.com/owner/repo';
      const files = new Map<string, string>();

      const response = {
        repository: {},
      };
      mockedGraphqlClient.mockResolvedValue(response);

      const result = await githubClient.checkFilesExist(url, repository, files);

      expect(result.size).toBe(0);
    });

    it('should safely escape paths containing quotes in the GraphQL query', async () => {
      const url = 'https://github.com/owner/repo';
      const files = new Map<string, string>([
        ['github.files_check.tricky', 'path/with"quote.txt'],
      ]);

      const response = {
        repository: {
          github_files_check_tricky: { id: 'abc' },
        },
      };
      mockedGraphqlClient.mockResolvedValue(response);

      await githubClient.checkFilesExist(url, repository, files);

      const queryArg = mockedGraphqlClient.mock.calls[0][0] as string;
      expect(queryArg).toContain(
        'object(expression: "HEAD:path/with\\"quote.txt")',
      );
      expect(queryArg).not.toContain('object(expression: "HEAD:path/with"');
    });

    it('should safely escape paths containing newlines in the GraphQL query', async () => {
      const url = 'https://github.com/owner/repo';
      const files = new Map<string, string>([
        ['github.files_check.newline', 'path/with\nnewline.txt'],
      ]);

      const response = {
        repository: {
          github_files_check_newline: null,
        },
      };
      mockedGraphqlClient.mockResolvedValue(response);

      await githubClient.checkFilesExist(url, repository, files);

      const queryArg = mockedGraphqlClient.mock.calls[0][0] as string;
      expect(queryArg).toContain(
        'object(expression: "HEAD:path/with\\nnewline.txt")',
      );
    });

    it('should handle alias collisions from metric IDs that differ only in non-word characters', async () => {
      const url = 'https://github.com/owner/repo';
      const files = new Map<string, string>([
        ['github.files_check.read-me', 'READ-ME.md'],
        ['github.files_check.read_me', 'README.md'],
      ]);

      mockedGraphqlClient.mockImplementation(async (query: string) => {
        const hasDeduplicatedAlias = query.includes(
          'github_files_check_read_me__2',
        );
        expect(hasDeduplicatedAlias).toBe(true);
        return {
          repository: {
            github_files_check_read_me: null,
            github_files_check_read_me__2: { id: 'abc123' },
          },
        };
      });

      const result = await githubClient.checkFilesExist(url, repository, files);

      expect(result.size).toBe(2);
      expect(result.get('github.files_check.read-me')).toBe(false);
      expect(result.get('github.files_check.read_me')).toBe(true);
    });

    it('should throw error when GitHub integration for URL is missing', async () => {
      const unknownUrl = 'https://unknown-host/owner/repo';
      const files = new Map<string, string>([
        ['github.files_check.readme', 'README.md'],
      ]);

      await expect(
        githubClient.checkFilesExist(unknownUrl, repository, files),
      ).rejects.toThrow(`Missing GitHub integration for '${unknownUrl}'`);
    });
  });
});
