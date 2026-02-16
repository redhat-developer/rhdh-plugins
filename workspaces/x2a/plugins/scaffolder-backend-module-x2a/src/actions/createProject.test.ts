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
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';
import { createProjectAction } from './createProject';

describe('x2a:project:create', () => {
  const mockDiscoveryApi = {
    getBaseUrl: jest.fn().mockResolvedValue('http://backstage.example.com'),
    getExternalBaseUrl: jest
      .fn()
      .mockResolvedValue('http://backstage.example.com'),
  };

  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a project and output projectId and nextUrl', async () => {
    const createdProject = {
      id: 'project-uuid-123',
      abbreviation: 'PRJ',
      name: 'My Project',
      description: 'A test project',
      createdAt: '2025-01-01T00:00:00.000Z',
      createdBy: 'user:default/jane',
    };

    const initJobId = 'init-job-uuid-123';
    mockFetch
      // First call is projectsPost (create), second is projectsProjectIdRunPost (run)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createdProject),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'pending', jobId: initJobId }),
      });

    const action = createProjectAction(mockDiscoveryApi, {
      fetchApi: { fetch: mockFetch },
    });

    const mockContext = createMockActionContext({
      input: {
        name: 'My Project',
        description: 'A test project',
        abbreviation: 'PRJ',
        sourceRepoUrl: 'https://github.com/org/repo',
        sourceRepoBranch: 'main',
        areTargeAndSourceRepoShared: false,
        targetRepoUrl: 'https://github.com/org/target-repo',
        targetRepoBranch: 'main',
      },
      secrets: {
        SRC_USER_OAUTH_TOKEN: 'mock-source-token',
        TGT_USER_OAUTH_TOKEN: 'mock-target-token',
      },
    });

    await action.handler(mockContext);

    expect(mockContext.output).toHaveBeenCalledWith(
      'projectId',
      'project-uuid-123',
    );
    expect(mockContext.output).toHaveBeenCalledWith('initJobId', initJobId);
    expect(mockContext.output).toHaveBeenCalledWith(
      'nextUrl',
      '/x2a/projects/project-uuid-123',
    );
  });

  it('should send name, description (or empty string), and abbreviation in the request body', async () => {
    const createdProject = {
      id: 'project-uuid-456',
      abbreviation: 'ABBR',
      name: 'Another Project',
      description: '',
      createdAt: '2025-01-01T00:00:00.000Z',
      createdBy: 'user:default/john',
    };

    let createProjectBody: Record<string, unknown> = {};
    mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
      const body = options?.body ? JSON.parse(options.body as string) : {};
      // First call is projectsPost (create), second is projectsProjectIdRunPost (run)
      if (body.name && body.abbreviation && !body.sourceRepoAuth) {
        createProjectBody = body;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createdProject),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 'pending',
            jobId: 'init-job-uuid-456',
          }),
      });
    });

    const action = createProjectAction(mockDiscoveryApi, {
      fetchApi: { fetch: mockFetch },
    });
    const mockContext = createMockActionContext({
      input: {
        name: 'Another Project',
        abbreviation: 'ABBR',
        sourceRepoUrl: 'https://github.com/org/repo2',
        sourceRepoBranch: 'main',
        areTargeAndSourceRepoShared: true,
        targetRepoBranch: 'main',
      },
      secrets: {
        SRC_USER_OAUTH_TOKEN: 'mock-source-token',
      },
    });

    await action.handler(mockContext);

    expect(createProjectBody).toMatchObject({
      name: 'Another Project',
      description: '',
      abbreviation: 'ABBR',
    });
    expect(mockContext.output).toHaveBeenCalledWith(
      'projectId',
      'project-uuid-456',
    );
    expect(mockContext.output).toHaveBeenCalledWith(
      'initJobId',
      'init-job-uuid-456',
    );
    expect(mockContext.output).toHaveBeenCalledWith(
      'nextUrl',
      '/x2a/projects/project-uuid-456',
    );
  });

  it('should include Authorization header when backstageToken is provided', async () => {
    const createdProject = {
      id: 'project-uuid-789',
      abbreviation: 'TKN',
      name: 'Token Project',
      description: 'With token',
      createdAt: '2025-01-01T00:00:00.000Z',
      createdBy: 'user:default/alice',
    };

    mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
      const headers = (options?.headers || {}) as Record<string, string>;
      const body = options?.body ? JSON.parse(options.body as string) : {};
      expect(headers.Authorization).toBe('Bearer my-backstage-token');
      if (body.sourceRepoAuth) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: 'pending',
              jobId: 'init-job-uuid-789',
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(createdProject),
      });
    });

    const action = createProjectAction(mockDiscoveryApi, {
      fetchApi: { fetch: mockFetch },
    });
    const mockContext = createMockActionContext({
      input: {
        name: 'Token Project',
        description: 'With token',
        abbreviation: 'TKN',
        sourceRepoUrl: 'https://github.com/org/repo',
        sourceRepoBranch: 'main',
        areTargeAndSourceRepoShared: false,
        targetRepoUrl: 'https://github.com/org/target-repo',
        targetRepoBranch: 'main',
      },
      secrets: {
        backstageToken: 'my-backstage-token',
        SRC_USER_OAUTH_TOKEN: 'mock-source-token',
        TGT_USER_OAUTH_TOKEN: 'mock-target-token',
      },
    });

    await action.handler(mockContext);

    expect(mockContext.output).toHaveBeenCalledWith(
      'projectId',
      'project-uuid-789',
    );
    expect(mockContext.output).toHaveBeenCalledWith(
      'initJobId',
      'init-job-uuid-789',
    );
  });

  it('should log that the action is running', async () => {
    const loggerInfo = jest.fn();
    mockFetch
      // First call is projectsPost (create), second is projectsProjectIdRunPost (run)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'log-test-id',
            abbreviation: 'LOG',
            name: 'Log Test',
            description: '',
            createdAt: '2025-01-01T00:00:00.000Z',
            createdBy: 'user:default/bob',
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 'pending',
            jobId: 'init-job-log-test',
          }),
      });

    const action = createProjectAction(mockDiscoveryApi, {
      fetchApi: { fetch: mockFetch },
    });
    const mockContext = createMockActionContext({
      input: {
        name: 'Log Test',
        abbreviation: 'LOG',
        sourceRepoUrl: 'https://github.com/org/repo',
        sourceRepoBranch: 'main',
        areTargeAndSourceRepoShared: false,
        targetRepoUrl: 'https://github.com/org/target-repo',
        targetRepoBranch: 'main',
      },
      secrets: {
        SRC_USER_OAUTH_TOKEN: 'mock-source-token',
        TGT_USER_OAUTH_TOKEN: 'mock-target-token',
      },
      logger: {
        ...createMockActionContext().logger,
        info: loggerInfo,
      },
    });

    await action.handler(mockContext);

    expect(loggerInfo).toHaveBeenCalledWith(
      'Running x2a:project:create template action for undefined',
    );
  });

  describe('failing scenarios', () => {
    it('should throw when target repository URL is missing (not shared)', async () => {
      const action = createProjectAction(mockDiscoveryApi);
      const mockContext = createMockActionContext({
        input: {
          name: 'Project',
          abbreviation: 'P',
          sourceRepoUrl: 'https://github.com/org/repo',
          sourceRepoBranch: 'main',
          areTargeAndSourceRepoShared: false,
          targetRepoBranch: 'main',
          // targetRepoUrl omitted
        },
        secrets: {
          SRC_USER_OAUTH_TOKEN: 'mock-source-token',
          TGT_USER_OAUTH_TOKEN: 'mock-target-token',
        },
      });

      await expect(action.handler(mockContext)).rejects.toThrow(
        'Target repository URL is required',
      );
    });

    it('should throw when source repository token is missing', async () => {
      const action = createProjectAction(mockDiscoveryApi);
      const mockContext = createMockActionContext({
        input: {
          name: 'Project',
          abbreviation: 'P',
          sourceRepoUrl: 'https://github.com/org/repo',
          sourceRepoBranch: 'main',
          areTargeAndSourceRepoShared: false,
          targetRepoUrl: 'https://github.com/org/target',
          targetRepoBranch: 'main',
        },
        secrets: {
          // SRC_USER_OAUTH_TOKEN omitted
          TGT_USER_OAUTH_TOKEN: 'mock-target-token',
        },
      });

      await expect(action.handler(mockContext)).rejects.toThrow(
        'Source repository token is required',
      );
    });

    it('should throw when target repository token is missing (not shared)', async () => {
      const action = createProjectAction(mockDiscoveryApi);
      const mockContext = createMockActionContext({
        input: {
          name: 'Project',
          abbreviation: 'P',
          sourceRepoUrl: 'https://github.com/org/repo',
          sourceRepoBranch: 'main',
          areTargeAndSourceRepoShared: false,
          targetRepoUrl: 'https://github.com/org/target',
          targetRepoBranch: 'main',
        },
        secrets: {
          SRC_USER_OAUTH_TOKEN: 'mock-source-token',
          // TGT_USER_OAUTH_TOKEN omitted when not shared
        },
      });

      await expect(action.handler(mockContext)).rejects.toThrow(
        'Target repository token is required',
      );
    });

    it('should throw when project creation API returns non-ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Invalid request body' }),
      });

      const action = createProjectAction(mockDiscoveryApi, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          name: 'Project',
          abbreviation: 'P',
          sourceRepoUrl: 'https://github.com/org/repo',
          sourceRepoBranch: 'main',
          areTargeAndSourceRepoShared: true,
          targetRepoBranch: 'main',
        },
        secrets: {
          SRC_USER_OAUTH_TOKEN: 'mock-source-token',
        },
      });

      await expect(action.handler(mockContext)).rejects.toThrow();
    });

    it('should throw when init-phase API returns non-ok', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'project-id',
              name: 'Project',
              abbreviation: 'P',
              description: '',
              createdBy: 'user:default/test',
              createdAt: '2025-01-01T00:00:00.000Z',
            }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ message: 'Internal server error' }),
        });

      const action = createProjectAction(mockDiscoveryApi, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          name: 'Project',
          abbreviation: 'P',
          sourceRepoUrl: 'https://github.com/org/repo',
          sourceRepoBranch: 'main',
          areTargeAndSourceRepoShared: true,
          targetRepoBranch: 'main',
        },
        secrets: {
          SRC_USER_OAUTH_TOKEN: 'mock-source-token',
        },
      });

      await expect(action.handler(mockContext)).rejects.toThrow();
    });
  });
});
