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

import { mockServices } from '@backstage/backend-test-utils';

import { GitlabApiService } from './gitlabApiService';
import { CustomGitlabCredentialsProvider } from './GitlabAppManager';

const gitlabkit = {
  Projects: {
    all: jest.fn(),
  },
  Groups: {
    all: jest.fn(),
    allProjects: jest.fn(),
  },
};

function createGitlabkit() {
  return gitlabkit;
}

jest.mock('@gitbeaker/rest', () => {
  return { Gitlab: createGitlabkit };
});

const mockGetAllCredentials = jest.fn();
// We want to just mock the credentials provider's getAllCredentials method and nothing else
CustomGitlabCredentialsProvider.prototype.getAllCredentials =
  mockGetAllCredentials;

describe('GitlabApiService tests', () => {
  let gitlabApiService: GitlabApiService;
  let errorLog: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    const logger = mockServices.logger.mock();
    errorLog = jest.spyOn(logger, 'error');
    const mockCache = mockServices.cache.mock();
    mockGetAllCredentials.mockResolvedValue(
      Promise.resolve([
        {
          headers: { Authorization: 'Bearer hardcoded_token' },
          token: 'hardcoded_token',
          type: 'token',
        },
      ]),
    );
    const config = mockServices.rootConfig({
      data: {
        integrations: {
          gitlab: [
            {
              host: 'gitlab.com',
              token: 'hardcoded_token',
            },
          ],
        },
      },
    });
    gitlabkit.Projects.all.mockReturnValue({
      data: [],
      paginationInfo: { total: 0 },
    });
    gitlabkit.Groups.all.mockReturnValue({
      data: [],
      paginationInfo: { total: 0 },
    });
    gitlabkit.Groups.allProjects.mockReturnValue({
      data: [],
      paginationInfo: { total: 0 },
    });
    gitlabApiService = new GitlabApiService(logger, config, mockCache);
  });

  it('returns an empty repositories and errors array if no installations were found', async () => {
    mockGetAllCredentials.mockResolvedValue(
      Promise.resolve([
        {
          headers: { Authorization: 'Bearer hardcoded_token' },
          token: 'hardcoded_token',
          type: 'token',
        },
      ]),
    );

    const result = await gitlabApiService.getRepositoriesFromIntegrations();

    const expected_response = {
      repositories: [],
      errors: [],
      totalCount: 0,
    };
    expect(result).toEqual(expected_response);
  });

  it('returns list of repositories if we have a user token and no errors', async () => {
    gitlabkit.Projects.all.mockReturnValue({
      data: [
        {
          id: '1',
          name: 'A',
          path_with_namespace: 'backstage/A',
          _links: {
            self: 'https://gitlab.com/api/v4/projects/1',
          },
          web_url: 'https://github.com/backstage/A',
          default_branch: 'master',
        },
        {
          id: '2',
          name: 'B',
          path_with_namespace: 'backstage/B',
          _links: {
            self: 'https://gitlab.com/api/v4/projects/2',
          },
          web_url: 'https://github.com/backstage/B',
          default_branch: 'main',
        },
        {
          id: '3',
          name: 'C',
          path_with_namespace: 'backstage/C',
          _links: {
            self: 'https://gitlab.com/api/v4/projects/3',
          },
          web_url: 'https://github.com/backstage/C',
          default_branch: 'default',
        },
      ],
      paginationInfo: { total: 3 },
    });
    const result = await gitlabApiService.getRepositoriesFromIntegrations();

    const expected_response = {
      repositories: [
        {
          name: 'A',
          full_name: 'backstage/A',
          url: 'https://gitlab.com/api/v4/projects/1',
          html_url: 'https://github.com/backstage/A',
          default_branch: 'master',
        },
        {
          name: 'B',
          full_name: 'backstage/B',
          url: 'https://gitlab.com/api/v4/projects/2',
          html_url: 'https://github.com/backstage/B',
          default_branch: 'main',
        },
        {
          name: 'C',
          full_name: 'backstage/C',
          url: 'https://gitlab.com/api/v4/projects/3',
          html_url: 'https://github.com/backstage/C',
          default_branch: 'default',
        },
      ],
      errors: [],
      totalCount: 3,
    };
    expect(errorLog).not.toHaveBeenCalled();
    expect(result).toEqual(expected_response);
  });

  it('returns list of repositories using search', async () => {
    gitlabkit.Projects.all.mockReturnValue({
      data: [
        {
          id: '1',
          name: 'A',
          path_with_namespace: 'backstage/A',
          _links: {
            self: 'https://gitlab.com/api/v4/projects/1',
          },
          web_url: 'https://github.com/backstage/A',
          default_branch: 'master',
        },
      ],
      paginationInfo: { total: 1 },
    });
    const result = await gitlabApiService.getRepositoriesFromIntegrations('A');

    const expected_response = {
      repositories: [
        {
          name: 'A',
          full_name: 'backstage/A',
          url: 'https://gitlab.com/api/v4/projects/1',
          html_url: 'https://github.com/backstage/A',
          default_branch: 'master',
        },
      ],
      errors: [],
      totalCount: 1,
    };
    expect(errorLog).not.toHaveBeenCalled();
    expect(result).toEqual(expected_response);
  });

  it('returns list of errors if they occur during the repository fetch phase', async () => {
    gitlabkit.Projects.all.mockImplementationOnce(async () => {
      const unauthorizedError = new Error('401 Unauthorized');
      unauthorizedError.name = '401 Unauthorized';
      throw unauthorizedError;
    });

    const result = await gitlabApiService.getRepositoriesFromIntegrations();

    const expected_response = {
      repositories: [],
      errors: [
        {
          error: {
            name: '401 Unauthorized',
            message: '401 Unauthorized',
          },
          type: 'token',
        },
      ],
      totalCount: 0,
    };
    expect(result).toEqual(expected_response);
  });

  it('returns list of groups if we have a user token with access to orgs', async () => {
    gitlabkit.Groups.all.mockReturnValue({
      data: [
        {
          id: '1',
          path: 'A',
          web_url: 'https://gitlab.com/groups/A',
        },
        {
          id: '2',
          path: 'B',
          web_url: 'https://gitlab.com/groups/B',
        },
      ],
      paginationInfo: { total: 2 },
    });

    const result = await gitlabApiService.getOrganizationsFromIntegrations();

    const expected_response = {
      organizations: [
        {
          id: '1',
          name: 'A',
          url: 'https://gitlab.com/groups/A',
        },
        {
          id: '2',
          name: 'B',
          url: 'https://gitlab.com/groups/B',
        },
      ],
      errors: [],
      totalCount: 2,
    };

    expect(errorLog).not.toHaveBeenCalled();
    expect(result).toEqual(expected_response);
  });

  it('returns list of groups using search', async () => {
    gitlabkit.Groups.all.mockReturnValue({
      data: [
        {
          id: '1',
          path: 'A',
          web_url: 'https://gitlab.com/groups/A',
        },
      ],
      paginationInfo: { total: 1 },
    });

    const result = await gitlabApiService.getOrganizationsFromIntegrations('A');

    const expected_response = {
      organizations: [
        {
          id: '1',
          name: 'A',
          url: 'https://gitlab.com/groups/A',
        },
      ],
      errors: [],
      totalCount: 1,
    };

    expect(errorLog).not.toHaveBeenCalled();
    expect(result).toEqual(expected_response);
  });

  it('return a list of repos for an org', async () => {
    gitlabkit.Groups.allProjects.mockReturnValue({
      data: [
        {
          id: '1',
          name: 'A',
          path_with_namespace: 'backstage/A',
          _links: {
            self: 'https://gitlab.com/api/v4/projects/1',
          },
          web_url: 'https://github.com/backstage/A',
          default_branch: 'master',
        },
        {
          id: '2',
          name: 'B',
          path_with_namespace: 'backstage/B',
          _links: {
            self: 'https://gitlab.com/api/v4/projects/2',
          },
          web_url: 'https://github.com/backstage/B',
          default_branch: 'main',
        },
      ],
      paginationInfo: { total: 2 },
    });

    const result =
      await gitlabApiService.getOrgRepositoriesFromIntegrations('orgA');

    const expected_response = {
      repositories: [
        {
          name: 'A',
          full_name: 'backstage/A',
          url: 'https://gitlab.com/api/v4/projects/1',
          html_url: 'https://github.com/backstage/A',
          default_branch: 'master',
        },
        {
          name: 'B',
          full_name: 'backstage/B',
          url: 'https://gitlab.com/api/v4/projects/2',
          html_url: 'https://github.com/backstage/B',
          default_branch: 'main',
        },
      ],
      errors: [],
      totalCount: 2,
    };

    expect(errorLog).not.toHaveBeenCalled();
    expect(result).toEqual(expected_response);
  });

  it('return a list of repos for an org using search', async () => {
    gitlabkit.Groups.allProjects.mockReturnValue({
      data: [
        {
          id: '1',
          name: 'A',
          path_with_namespace: 'backstage/A',
          _links: {
            self: 'https://gitlab.com/api/v4/projects/1',
          },
          web_url: 'https://github.com/backstage/A',
          default_branch: 'master',
        },
      ],
      paginationInfo: { total: 1 },
    });

    const result = await gitlabApiService.getOrgRepositoriesFromIntegrations(
      'orgA',
      'A',
    );

    const expected_response = {
      repositories: [
        {
          name: 'A',
          full_name: 'backstage/A',
          url: 'https://gitlab.com/api/v4/projects/1',
          html_url: 'https://github.com/backstage/A',
          default_branch: 'master',
        },
      ],
      errors: [],
      totalCount: 1,
    };

    expect(errorLog).not.toHaveBeenCalled();
    expect(result).toEqual(expected_response);
  });

  it('return an empty list of repos for an org using search', async () => {
    gitlabkit.Groups.allProjects.mockReturnValue({
      data: [],
      paginationInfo: { total: 0 },
    });

    const result = await gitlabApiService.getOrgRepositoriesFromIntegrations(
      'orgA',
      'A',
    );

    const expected_response = {
      repositories: [],
      errors: [],
      totalCount: 0,
    };

    expect(errorLog).not.toHaveBeenCalled();
    expect(result).toEqual(expected_response);
  });

  it('does not throw an error if no integration in config because there is one added automatically', async () => {
    const repos = await new GitlabApiService(
      mockServices.logger.mock(),
      mockServices.rootConfig(),
      mockServices.cache.mock(),
    ).getRepositoriesFromIntegrations();
    expect(repos).toEqual({
      errors: [],
      repositories: [],
      totalCount: 0,
    });
  });
});
