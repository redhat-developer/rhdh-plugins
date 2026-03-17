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
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';
import {
  SCAFFOLDER_SECRET_PREFIX,
  allProviders,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { createProjectAction } from './createProjectAction';

function encodeCsv(csv: string): string {
  return `data:text/csv;base64,${Buffer.from(csv).toString('base64')}`;
}

describe('x2a:project:create', () => {
  const mockDiscoveryApi = {
    getBaseUrl: jest.fn().mockResolvedValue('http://backstage.example.com'),
    getExternalBaseUrl: jest
      .fn()
      .mockResolvedValue('http://backstage.example.com'),
  };
  const mockConfig = new ConfigReader({});

  const mockFetch = jest.fn();

  const emptyProjectsResponse = {
    ok: true,
    json: () => Promise.resolve({ totalCount: 0, items: [] }),
  };

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
      .mockResolvedValueOnce(emptyProjectsResponse)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createdProject),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'pending', jobId: initJobId }),
      });

    const action = createProjectAction(mockDiscoveryApi, mockConfig, {
      fetchApi: { fetch: mockFetch },
    });

    const mockContext = createMockActionContext({
      input: {
        inputMethod: 'manual' as const,
        name: 'My Project',
        description: 'A test project',
        abbreviation: 'PRJ',
        sourceRepoUrl: 'https://github.com/org/repo',
        sourceRepoBranch: 'main',
        areTargetAndSourceRepoShared: false,
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

  it('should output skippedCount=0 and errorCount=0 in manual mode', async () => {
    const createdProject = {
      id: 'project-manual-counts',
      abbreviation: 'MC',
      name: 'Manual Counts',
      description: '',
      createdAt: '2025-01-01T00:00:00.000Z',
      createdBy: 'user:default/jane',
    };

    mockFetch
      .mockResolvedValueOnce(emptyProjectsResponse)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createdProject),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ status: 'pending', jobId: 'init-manual-counts' }),
      });

    const action = createProjectAction(mockDiscoveryApi, mockConfig, {
      fetchApi: { fetch: mockFetch },
    });
    const mockContext = createMockActionContext({
      input: {
        inputMethod: 'manual' as const,
        name: 'Manual Counts',
        abbreviation: 'MC',
        sourceRepoUrl: 'https://github.com/org/repo',
        sourceRepoBranch: 'main',
        areTargetAndSourceRepoShared: true,
        targetRepoBranch: 'main',
      },
      secrets: {
        SRC_USER_OAUTH_TOKEN: 'mock-source-token',
      },
    });

    await action.handler(mockContext);

    expect(mockContext.output).toHaveBeenCalledWith('successCount', 1);
    expect(mockContext.output).toHaveBeenCalledWith('skippedCount', 0);
    expect(mockContext.output).toHaveBeenCalledWith('errorCount', 0);
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
      if (options?.method === 'GET') {
        return Promise.resolve(emptyProjectsResponse);
      }
      const body = options?.body ? JSON.parse(options.body as string) : {};
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

    const action = createProjectAction(mockDiscoveryApi, mockConfig, {
      fetchApi: { fetch: mockFetch },
    });
    const mockContext = createMockActionContext({
      input: {
        inputMethod: 'manual' as const,
        name: 'Another Project',
        abbreviation: 'ABBR',
        sourceRepoUrl: 'https://github.com/org/repo2',
        sourceRepoBranch: 'main',
        areTargetAndSourceRepoShared: true,
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

  it('should send ownedByGroup in the request body when provided', async () => {
    const createdProject = {
      id: 'project-uuid-owned',
      abbreviation: 'GOP',
      name: 'Group-owned Project',
      description: '',
      createdAt: '2025-01-01T00:00:00.000Z',
      createdBy: 'group:default/team-a',
    };

    let createProjectBody: Record<string, unknown> = {};
    mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
      if (options?.method === 'GET') {
        return Promise.resolve(emptyProjectsResponse);
      }
      const body = options?.body ? JSON.parse(options.body as string) : {};
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
            jobId: 'init-job-owned',
          }),
      });
    });

    const action = createProjectAction(mockDiscoveryApi, mockConfig, {
      fetchApi: { fetch: mockFetch },
    });
    const mockContext = createMockActionContext({
      input: {
        inputMethod: 'manual' as const,
        name: 'Group-owned Project',
        abbreviation: 'GOP',
        ownedByGroup: 'group:default/team-a',
        sourceRepoUrl: 'https://github.com/org/repo',
        sourceRepoBranch: 'main',
        areTargetAndSourceRepoShared: true,
        targetRepoBranch: 'main',
      },
      secrets: {
        SRC_USER_OAUTH_TOKEN: 'mock-source-token',
      },
    });

    await action.handler(mockContext);

    expect(createProjectBody).toMatchObject({
      name: 'Group-owned Project',
      abbreviation: 'GOP',
      ownedByGroup: 'group:default/team-a',
    });
  });

  it('should trim ownedByGroup when provided with whitespace', async () => {
    const createdProject = {
      id: 'project-uuid-trimmed',
      abbreviation: 'TRM',
      name: 'Trimmed Project',
      description: '',
      createdAt: '2025-01-01T00:00:00.000Z',
      createdBy: 'group:default/team-b',
    };

    let createProjectBody: Record<string, unknown> = {};
    mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
      if (options?.method === 'GET') {
        return Promise.resolve(emptyProjectsResponse);
      }
      const body = options?.body ? JSON.parse(options.body as string) : {};
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
            jobId: 'init-job-trimmed',
          }),
      });
    });

    const action = createProjectAction(mockDiscoveryApi, mockConfig, {
      fetchApi: { fetch: mockFetch },
    });
    const mockContext = createMockActionContext({
      input: {
        inputMethod: 'manual' as const,
        name: 'Trimmed Project',
        abbreviation: 'TRM',
        ownedByGroup: '  group:default/team-b  ',
        sourceRepoUrl: 'https://github.com/org/repo',
        sourceRepoBranch: 'main',
        areTargetAndSourceRepoShared: true,
        targetRepoBranch: 'main',
      },
      secrets: {
        SRC_USER_OAUTH_TOKEN: 'mock-source-token',
      },
    });

    await action.handler(mockContext);

    expect(createProjectBody.ownedByGroup).toBe('group:default/team-b');
  });

  it('should pass userPrompt to the init-phase API when provided', async () => {
    const createdProject = {
      id: 'project-uuid-prompt',
      abbreviation: 'PRM',
      name: 'Prompt Project',
      description: '',
      createdAt: '2025-01-01T00:00:00.000Z',
      createdBy: 'user:default/jane',
    };

    let runRequestBody: Record<string, unknown> = {};
    mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
      if (options?.method === 'GET') {
        return Promise.resolve(emptyProjectsResponse);
      }
      const body = options?.body ? JSON.parse(options.body as string) : {};
      if (body.sourceRepoAuth && body.targetRepoAuth) {
        runRequestBody = body;
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: 'pending',
              jobId: 'init-job-prompt',
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(createdProject),
      });
    });

    const action = createProjectAction(mockDiscoveryApi, mockConfig, {
      fetchApi: { fetch: mockFetch },
    });
    const mockContext = createMockActionContext({
      input: {
        inputMethod: 'manual' as const,
        name: 'Prompt Project',
        abbreviation: 'PRM',
        sourceRepoUrl: 'https://github.com/org/repo',
        sourceRepoBranch: 'main',
        areTargetAndSourceRepoShared: true,
        targetRepoBranch: 'main',
        userPrompt: 'Convert this to Ansible playbook with best practices',
      },
      secrets: {
        SRC_USER_OAUTH_TOKEN: 'mock-source-token',
      },
    });

    await action.handler(mockContext);

    expect(runRequestBody).toMatchObject({
      userPrompt: 'Convert this to Ansible playbook with best practices',
    });
    expect(mockContext.output).toHaveBeenCalledWith(
      'projectId',
      'project-uuid-prompt',
    );
    expect(mockContext.output).toHaveBeenCalledWith(
      'initJobId',
      'init-job-prompt',
    );
  });

  it('should omit ownedByGroup from the request body when not provided', async () => {
    const createdProject = {
      id: 'project-uuid-no-group',
      abbreviation: 'NOG',
      name: 'No Group Project',
      description: '',
      createdAt: '2025-01-01T00:00:00.000Z',
      createdBy: 'user:default/jane',
    };

    let createProjectBody: Record<string, unknown> = {};
    mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
      if (options?.method === 'GET') {
        return Promise.resolve(emptyProjectsResponse);
      }
      const body = options?.body ? JSON.parse(options.body as string) : {};
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
            jobId: 'init-job-no-group',
          }),
      });
    });

    const action = createProjectAction(mockDiscoveryApi, mockConfig, {
      fetchApi: { fetch: mockFetch },
    });
    const mockContext = createMockActionContext({
      input: {
        inputMethod: 'manual' as const,
        name: 'No Group Project',
        abbreviation: 'NOG',
        sourceRepoUrl: 'https://github.com/org/repo',
        sourceRepoBranch: 'main',
        areTargetAndSourceRepoShared: true,
        targetRepoBranch: 'main',
      },
      secrets: {
        SRC_USER_OAUTH_TOKEN: 'mock-source-token',
      },
    });

    await action.handler(mockContext);

    expect(createProjectBody).toMatchObject({
      name: 'No Group Project',
      abbreviation: 'NOG',
    });
    expect(createProjectBody).not.toHaveProperty('ownedByGroup');
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
      expect(headers.Authorization).toBe('Bearer my-backstage-token');
      if (options?.method === 'GET') {
        return Promise.resolve(emptyProjectsResponse);
      }
      const body = options?.body ? JSON.parse(options.body as string) : {};
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

    const action = createProjectAction(mockDiscoveryApi, mockConfig, {
      fetchApi: { fetch: mockFetch },
    });
    const mockContext = createMockActionContext({
      input: {
        inputMethod: 'manual' as const,
        name: 'Token Project',
        description: 'With token',
        abbreviation: 'TKN',
        sourceRepoUrl: 'https://github.com/org/repo',
        sourceRepoBranch: 'main',
        areTargetAndSourceRepoShared: false,
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
      .mockResolvedValueOnce(emptyProjectsResponse)
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

    const action = createProjectAction(mockDiscoveryApi, mockConfig, {
      fetchApi: { fetch: mockFetch },
    });
    const mockContext = createMockActionContext({
      input: {
        inputMethod: 'manual' as const,
        name: 'Log Test',
        abbreviation: 'LOG',
        sourceRepoUrl: 'https://github.com/org/repo',
        sourceRepoBranch: 'main',
        areTargetAndSourceRepoShared: false,
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

  describe('augmentRepoToken', () => {
    const createdProject = {
      id: 'project-augment',
      abbreviation: 'AUG',
      name: 'Augment Project',
      description: '',
      createdAt: '2025-01-01T00:00:00.000Z',
      createdBy: 'user:default/test',
    };

    it('should pass tokens as-is for GitHub URLs (no oauth2: prefix)', async () => {
      let runRequestBody: {
        sourceRepoAuth?: { token: string };
        targetRepoAuth?: { token: string };
      } = {};
      mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
        if (options?.method === 'GET') {
          return Promise.resolve(emptyProjectsResponse);
        }
        const body = options?.body ? JSON.parse(options.body as string) : {};
        if (body.sourceRepoAuth && body.targetRepoAuth) {
          runRequestBody = body;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ status: 'pending', jobId: 'init-job-augment' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createdProject),
        });
      });

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'manual' as const,
          name: 'Augment Project',
          abbreviation: 'AUG',
          sourceRepoUrl: 'https://github.com/org/source-repo',
          sourceRepoBranch: 'main',
          areTargetAndSourceRepoShared: false,
          targetRepoUrl: 'https://github.com/org/target-repo',
          targetRepoBranch: 'main',
        },
        secrets: {
          SRC_USER_OAUTH_TOKEN: 'gh-source-token',
          TGT_USER_OAUTH_TOKEN: 'gh-target-token',
        },
      });

      await action.handler(mockContext);

      expect(runRequestBody.sourceRepoAuth?.token).toBe('gh-source-token');
      expect(runRequestBody.targetRepoAuth?.token).toBe('gh-target-token');
    });

    it('should prefix tokens with oauth2: for GitLab URLs', async () => {
      let runRequestBody: {
        sourceRepoAuth?: { token: string };
        targetRepoAuth?: { token: string };
      } = {};
      mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
        if (options?.method === 'GET') {
          return Promise.resolve(emptyProjectsResponse);
        }
        const body = options?.body ? JSON.parse(options.body as string) : {};
        if (body.sourceRepoAuth && body.targetRepoAuth) {
          runRequestBody = body;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ status: 'pending', jobId: 'init-job-augment' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createdProject),
        });
      });

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'manual' as const,
          name: 'Augment Project',
          abbreviation: 'AUG',
          sourceRepoUrl: 'https://gitlab.com/org/source-repo',
          sourceRepoBranch: 'main',
          areTargetAndSourceRepoShared: false,
          targetRepoUrl: 'https://gitlab.com/org/target-repo',
          targetRepoBranch: 'main',
        },
        secrets: {
          SRC_USER_OAUTH_TOKEN: 'gl-source-token',
          TGT_USER_OAUTH_TOKEN: 'gl-target-token',
        },
      });

      await action.handler(mockContext);

      expect(runRequestBody.sourceRepoAuth?.token).toBe(
        'oauth2:gl-source-token',
      );
      expect(runRequestBody.targetRepoAuth?.token).toBe(
        'oauth2:gl-target-token',
      );
    });

    it('should prefix source token with oauth2: when source is GitLab (shared repos)', async () => {
      let runRequestBody: {
        sourceRepoAuth?: { token: string };
        targetRepoAuth?: { token: string };
      } = {};
      mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
        if (options?.method === 'GET') {
          return Promise.resolve(emptyProjectsResponse);
        }
        const body = options?.body ? JSON.parse(options.body as string) : {};
        if (body.sourceRepoAuth && body.targetRepoAuth) {
          runRequestBody = body;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ status: 'pending', jobId: 'init-job-augment' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createdProject),
        });
      });

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'manual' as const,
          name: 'Augment Project',
          abbreviation: 'AUG',
          sourceRepoUrl: 'https://gitlab.com/org/shared-repo',
          sourceRepoBranch: 'main',
          areTargetAndSourceRepoShared: true,
          targetRepoBranch: 'main',
        },
        secrets: {
          SRC_USER_OAUTH_TOKEN: 'gl-shared-token',
        },
      });

      await action.handler(mockContext);

      expect(runRequestBody.sourceRepoAuth?.token).toBe(
        'oauth2:gl-shared-token',
      );
      expect(runRequestBody.targetRepoAuth?.token).toBe(
        'oauth2:gl-shared-token',
      );
    });

    it('should use plain token for source (GitHub) and oauth2: for target (GitLab)', async () => {
      let runRequestBody: {
        sourceRepoAuth?: { token: string };
        targetRepoAuth?: { token: string };
      } = {};
      mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
        if (options?.method === 'GET') {
          return Promise.resolve(emptyProjectsResponse);
        }
        const body = options?.body ? JSON.parse(options.body as string) : {};
        if (body.sourceRepoAuth && body.targetRepoAuth) {
          runRequestBody = body;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ status: 'pending', jobId: 'init-job-augment' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createdProject),
        });
      });

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'manual' as const,
          name: 'Augment Project',
          abbreviation: 'AUG',
          sourceRepoUrl: 'https://github.com/org/source-repo',
          sourceRepoBranch: 'main',
          areTargetAndSourceRepoShared: false,
          targetRepoUrl: 'https://gitlab.com/org/target-repo',
          targetRepoBranch: 'main',
        },
        secrets: {
          SRC_USER_OAUTH_TOKEN: 'gh-source-token',
          TGT_USER_OAUTH_TOKEN: 'gl-target-token',
        },
      });

      await action.handler(mockContext);

      expect(runRequestBody.sourceRepoAuth?.token).toBe('gh-source-token');
      expect(runRequestBody.targetRepoAuth?.token).toBe(
        'oauth2:gl-target-token',
      );
    });

    it('should use oauth2: for source (GitLab) and plain token for target (GitHub)', async () => {
      let runRequestBody: {
        sourceRepoAuth?: { token: string };
        targetRepoAuth?: { token: string };
      } = {};
      mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
        if (options?.method === 'GET') {
          return Promise.resolve(emptyProjectsResponse);
        }
        const body = options?.body ? JSON.parse(options.body as string) : {};
        if (body.sourceRepoAuth && body.targetRepoAuth) {
          runRequestBody = body;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ status: 'pending', jobId: 'init-job-augment' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createdProject),
        });
      });

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'manual' as const,
          name: 'Augment Project',
          abbreviation: 'AUG',
          sourceRepoUrl: 'https://gitlab.com/org/source-repo',
          sourceRepoBranch: 'main',
          areTargetAndSourceRepoShared: false,
          targetRepoUrl: 'https://github.com/org/target-repo',
          targetRepoBranch: 'main',
        },
        secrets: {
          SRC_USER_OAUTH_TOKEN: 'gl-source-token',
          TGT_USER_OAUTH_TOKEN: 'gh-target-token',
        },
      });

      await action.handler(mockContext);

      expect(runRequestBody.sourceRepoAuth?.token).toBe(
        'oauth2:gl-source-token',
      );
      expect(runRequestBody.targetRepoAuth?.token).toBe('gh-target-token');
    });

    it('should prefix tokens with x-token-auth: for Bitbucket URLs', async () => {
      let runRequestBody: {
        sourceRepoAuth?: { token: string };
        targetRepoAuth?: { token: string };
      } = {};
      mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
        if (options?.method === 'GET') {
          return Promise.resolve(emptyProjectsResponse);
        }
        const body = options?.body ? JSON.parse(options.body as string) : {};
        if (body.sourceRepoAuth && body.targetRepoAuth) {
          runRequestBody = body;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ status: 'pending', jobId: 'init-job-augment' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createdProject),
        });
      });

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'manual' as const,
          name: 'Augment Project',
          abbreviation: 'AUG',
          sourceRepoUrl: 'https://bitbucket.org/ws/source-repo',
          sourceRepoBranch: 'main',
          areTargetAndSourceRepoShared: false,
          targetRepoUrl: 'https://bitbucket.org/ws/target-repo',
          targetRepoBranch: 'main',
        },
        secrets: {
          SRC_USER_OAUTH_TOKEN: 'bb-source-token',
          TGT_USER_OAUTH_TOKEN: 'bb-target-token',
        },
      });

      await action.handler(mockContext);

      expect(runRequestBody.sourceRepoAuth?.token).toBe(
        'x-token-auth:bb-source-token',
      );
      expect(runRequestBody.targetRepoAuth?.token).toBe(
        'x-token-auth:bb-target-token',
      );
    });

    it('should use x-token-auth: for source (Bitbucket) and plain token for target (GitHub)', async () => {
      let runRequestBody: {
        sourceRepoAuth?: { token: string };
        targetRepoAuth?: { token: string };
      } = {};
      mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
        if (options?.method === 'GET') {
          return Promise.resolve(emptyProjectsResponse);
        }
        const body = options?.body ? JSON.parse(options.body as string) : {};
        if (body.sourceRepoAuth && body.targetRepoAuth) {
          runRequestBody = body;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ status: 'pending', jobId: 'init-job-augment' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createdProject),
        });
      });

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'manual' as const,
          name: 'Augment Project',
          abbreviation: 'AUG',
          sourceRepoUrl: 'https://bitbucket.org/ws/source-repo',
          sourceRepoBranch: 'main',
          areTargetAndSourceRepoShared: false,
          targetRepoUrl: 'https://github.com/org/target-repo',
          targetRepoBranch: 'main',
        },
        secrets: {
          SRC_USER_OAUTH_TOKEN: 'bb-source-token',
          TGT_USER_OAUTH_TOKEN: 'gh-target-token',
        },
      });

      await action.handler(mockContext);

      expect(runRequestBody.sourceRepoAuth?.token).toBe(
        'x-token-auth:bb-source-token',
      );
      expect(runRequestBody.targetRepoAuth?.token).toBe('gh-target-token');
    });
  });

  describe('CSV bulk import with per-provider tokens', () => {
    const createdProject = {
      id: 'csv-project-1',
      abbreviation: 'C1',
      name: 'CSV Project 1',
      description: '',
      createdAt: '2025-01-01T00:00:00.000Z',
      createdBy: 'user:default/csv-user',
    };

    it('should use OAUTH_TOKEN_github for GitHub repos in CSV', async () => {
      let runRequestBody: {
        sourceRepoAuth?: { token: string };
        targetRepoAuth?: { token: string };
      } = {};
      mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
        if (options?.method === 'GET') {
          return Promise.resolve(emptyProjectsResponse);
        }
        const body = options?.body ? JSON.parse(options.body as string) : {};
        if (body.sourceRepoAuth && body.targetRepoAuth) {
          runRequestBody = body;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ status: 'pending', jobId: 'csv-init-1' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createdProject),
        });
      });

      const csv = encodeCsv(
        'name,abbreviation,sourceRepoUrl,sourceRepoBranch,targetRepoBranch\n' +
          'CSV Project 1,C1,https://github.com/org/repo,main,main',
      );

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'csv' as const,
          csvContent: csv,
        },
        secrets: {
          OAUTH_TOKEN_github: 'gh-csv-token',
        },
      });

      await action.handler(mockContext);

      expect(runRequestBody.sourceRepoAuth?.token).toBe('gh-csv-token');
      expect(runRequestBody.targetRepoAuth?.token).toBe('gh-csv-token');
      expect(mockContext.output).toHaveBeenCalledWith('successCount', 1);
      expect(mockContext.output).toHaveBeenCalledWith('errorCount', 0);
    });

    it('should use different tokens for mixed-provider CSV rows', async () => {
      const runBodies: Array<{
        sourceRepoAuth?: { token: string };
        targetRepoAuth?: { token: string };
      }> = [];
      let createCallCount = 0;

      mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
        if (options?.method === 'GET') {
          return Promise.resolve(emptyProjectsResponse);
        }
        const body = options?.body ? JSON.parse(options.body as string) : {};
        if (body.sourceRepoAuth && body.targetRepoAuth) {
          runBodies.push(body);
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 'pending',
                jobId: `csv-init-${runBodies.length}`,
              }),
          });
        }
        createCallCount++;
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ...createdProject,
              id: `csv-project-${createCallCount}`,
            }),
        });
      });

      const csv = encodeCsv(
        'name,abbreviation,sourceRepoUrl,sourceRepoBranch,targetRepoBranch\n' +
          'GH Project,GH,https://github.com/org/repo,main,main\n' +
          'GL Project,GL,https://gitlab.com/org/repo,main,main',
      );

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'csv' as const,
          csvContent: csv,
        },
        secrets: {
          OAUTH_TOKEN_github: 'gh-csv-token',
          OAUTH_TOKEN_gitlab: 'oauth2:gl-csv-token',
        },
      });

      await action.handler(mockContext);

      expect(runBodies).toHaveLength(2);
      expect(runBodies[0].sourceRepoAuth?.token).toBe('gh-csv-token');
      expect(runBodies[1].sourceRepoAuth?.token).toBe('oauth2:gl-csv-token');
      expect(mockContext.output).toHaveBeenCalledWith('successCount', 2);
      expect(mockContext.output).toHaveBeenCalledWith('errorCount', 0);
    });

    it('should skip rows whose provider token is missing and throw with error count', async () => {
      mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
        if (options?.method === 'GET') {
          return Promise.resolve(emptyProjectsResponse);
        }
        const body = options?.body ? JSON.parse(options.body as string) : {};
        if (body.sourceRepoAuth && body.targetRepoAuth) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ status: 'pending', jobId: 'csv-init-ok' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createdProject),
        });
      });

      const csv = encodeCsv(
        'name,abbreviation,sourceRepoUrl,sourceRepoBranch,targetRepoBranch\n' +
          'GH Project,GH,https://github.com/org/repo,main,main\n' +
          'GL Project,GL,https://gitlab.com/org/repo,main,main',
      );

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'csv' as const,
          csvContent: csv,
        },
        secrets: {
          OAUTH_TOKEN_github: 'gh-csv-token',
          // GITLAB_OAUTH_TOKEN intentionally omitted
        },
      });

      await expect(action.handler(mockContext)).rejects.toThrow(
        'CSV import completed with errors: 1 succeeded, 1 failed, 0 skipped out of 2 project(s)',
      );

      expect(mockContext.output).toHaveBeenCalledWith('successCount', 1);
      expect(mockContext.output).toHaveBeenCalledWith('errorCount', 1);
    });

    it('should skip row when target provider token is missing and throw', async () => {
      mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
        if (options?.method === 'GET') {
          return Promise.resolve(emptyProjectsResponse);
        }
        const body = options?.body ? JSON.parse(options.body as string) : {};
        if (body.sourceRepoAuth && body.targetRepoAuth) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ status: 'pending', jobId: 'csv-init-ok' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createdProject),
        });
      });

      const csv = encodeCsv(
        'name,abbreviation,sourceRepoUrl,sourceRepoBranch,targetRepoUrl,targetRepoBranch\n' +
          'Cross Project,CP,https://github.com/org/src,main,https://gitlab.com/org/tgt,main',
      );

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'csv' as const,
          csvContent: csv,
        },
        secrets: {
          OAUTH_TOKEN_github: 'gh-csv-token',
          // GITLAB_OAUTH_TOKEN intentionally omitted for target
        },
      });

      await expect(action.handler(mockContext)).rejects.toThrow(
        'CSV import completed with errors: 0 succeeded, 1 failed, 0 skipped out of 1 project(s)',
      );

      expect(mockContext.output).toHaveBeenCalledWith('successCount', 0);
      expect(mockContext.output).toHaveBeenCalledWith('errorCount', 1);
    });

    it('should throw when no provider tokens are supplied at all', async () => {
      mockFetch.mockResolvedValueOnce(emptyProjectsResponse);
      const csv = encodeCsv(
        'name,abbreviation,sourceRepoUrl,sourceRepoBranch,targetRepoBranch\n' +
          'Project,P,https://github.com/org/repo,main,main',
      );

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'csv' as const,
          csvContent: csv,
        },
        secrets: {},
      });

      await expect(action.handler(mockContext)).rejects.toThrow(
        'At least one SCM provider authentication token is required',
      );
    });

    it('should handle all three providers in a single CSV', async () => {
      let createCallCount = 0;
      mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
        if (options?.method === 'GET') {
          return Promise.resolve(emptyProjectsResponse);
        }
        const body = options?.body ? JSON.parse(options.body as string) : {};
        if (body.sourceRepoAuth && body.targetRepoAuth) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 'pending',
                jobId: `csv-init-${createCallCount}`,
              }),
          });
        }
        createCallCount++;
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ...createdProject,
              id: `csv-project-${createCallCount}`,
            }),
        });
      });

      const csv = encodeCsv(
        'name,abbreviation,sourceRepoUrl,sourceRepoBranch,targetRepoBranch\n' +
          'GH Proj,GH,https://github.com/org/repo,main,main\n' +
          'GL Proj,GL,https://gitlab.com/org/repo,main,main\n' +
          'BB Proj,BB,https://bitbucket.org/ws/repo,main,main',
      );

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'csv' as const,
          csvContent: csv,
        },
        secrets: {
          OAUTH_TOKEN_github: 'gh-token',
          OAUTH_TOKEN_gitlab: 'oauth2:gl-token',
          OAUTH_TOKEN_bitbucket: 'x-token-auth:bb-token',
        },
      });

      await action.handler(mockContext);

      expect(mockContext.output).toHaveBeenCalledWith('successCount', 3);
      expect(mockContext.output).toHaveBeenCalledWith('errorCount', 0);
    });

    it('should log error details when a CSV project creation fails', async () => {
      const loggerError = jest.fn();
      const loggerInfo = jest.fn();
      const loggerWarn = jest.fn();
      let createCallCount = 0;
      mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
        if (options?.method === 'GET') {
          return Promise.resolve(emptyProjectsResponse);
        }
        const body = options?.body ? JSON.parse(options.body as string) : {};
        if (body.name && body.abbreviation && !body.sourceRepoAuth) {
          createCallCount++;
          if (createCallCount === 2) {
            return Promise.resolve({
              ok: false,
              status: 400,
              json: () => Promise.resolve({ message: 'Invalid abbreviation' }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                id: `proj-${createCallCount}`,
                name: `Project ${createCallCount}`,
                abbreviation: `P${createCallCount}`,
                description: '',
                createdAt: '2025-01-01T00:00:00.000Z',
                createdBy: 'user:default/test',
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: 'pending',
              jobId: `init-${createCallCount}`,
            }),
        });
      });

      const csv = encodeCsv(
        'name,abbreviation,sourceRepoUrl,sourceRepoBranch,targetRepoBranch\n' +
          'Good Project,GP,https://github.com/org/repo1,main,main\n' +
          'Bad Project,BP,https://github.com/org/repo2,main,main',
      );

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'csv' as const,
          csvContent: csv,
        },
        secrets: {
          OAUTH_TOKEN_github: 'gh-token',
        },
        logger: {
          ...createMockActionContext().logger,
          info: loggerInfo,
          warn: loggerWarn,
          error: loggerError,
        },
      });

      await expect(action.handler(mockContext)).rejects.toThrow(
        /CSV import completed with errors/,
      );

      expect(loggerError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create project "Bad Project"'),
      );
    });

    it('should omit ownedByGroup from API body when CSV row has whitespace-only value', async () => {
      let createProjectBody: Record<string, unknown> = {};
      mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
        if (options?.method === 'GET') {
          return Promise.resolve(emptyProjectsResponse);
        }
        const body = options?.body ? JSON.parse(options.body as string) : {};
        if (body.name && body.abbreviation && !body.sourceRepoAuth) {
          createProjectBody = body;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                id: 'proj-ws',
                name: 'WS Project',
                abbreviation: 'WS',
                description: '',
                createdAt: '2025-01-01T00:00:00.000Z',
                createdBy: 'user:default/test',
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'pending', jobId: 'init-ws' }),
        });
      });

      const csv = encodeCsv(
        'name,abbreviation,sourceRepoUrl,sourceRepoBranch,targetRepoBranch,ownedByGroup\n' +
          'WS Project,WS,https://github.com/org/repo,main,main,   ',
      );

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'csv' as const,
          csvContent: csv,
        },
        secrets: {
          OAUTH_TOKEN_github: 'gh-token',
        },
      });

      await action.handler(mockContext);

      expect(createProjectBody.ownedByGroup).toBeUndefined();
    });
  });

  describe('failing scenarios', () => {
    it('should throw when target repository URL is missing (not shared)', async () => {
      mockFetch.mockResolvedValueOnce(emptyProjectsResponse);
      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'manual' as const,
          name: 'Project',
          abbreviation: 'P',
          sourceRepoUrl: 'https://github.com/org/repo',
          sourceRepoBranch: 'main',
          areTargetAndSourceRepoShared: false,
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
      mockFetch.mockResolvedValueOnce(emptyProjectsResponse);
      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'manual' as const,
          name: 'Project',
          abbreviation: 'P',
          sourceRepoUrl: 'https://github.com/org/repo',
          sourceRepoBranch: 'main',
          areTargetAndSourceRepoShared: false,
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
      mockFetch.mockResolvedValueOnce(emptyProjectsResponse);
      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'manual' as const,
          name: 'Project',
          abbreviation: 'P',
          sourceRepoUrl: 'https://github.com/org/repo',
          sourceRepoBranch: 'main',
          areTargetAndSourceRepoShared: false,
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
      mockFetch
        .mockResolvedValueOnce(emptyProjectsResponse)
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ message: 'Invalid request body' }),
        });

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'manual' as const,
          name: 'Project',
          abbreviation: 'P',
          sourceRepoUrl: 'https://github.com/org/repo',
          sourceRepoBranch: 'main',
          areTargetAndSourceRepoShared: true,
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
        .mockResolvedValueOnce(emptyProjectsResponse)
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

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'manual' as const,
          name: 'Project',
          abbreviation: 'P',
          sourceRepoUrl: 'https://github.com/org/repo',
          sourceRepoBranch: 'main',
          areTargetAndSourceRepoShared: true,
          targetRepoBranch: 'main',
        },
        secrets: {
          SRC_USER_OAUTH_TOKEN: 'mock-source-token',
        },
      });

      await expect(action.handler(mockContext)).rejects.toThrow();
    });
  });

  describe('duplicate project name detection', () => {
    const existingProjectsResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          totalCount: 1,
          items: [
            {
              id: 'existing-id',
              name: 'Existing Project',
              abbreviation: 'EP',
              description: '',
              sourceRepoUrl: 'https://github.com/org/existing',
              targetRepoUrl: 'https://github.com/org/existing',
              sourceRepoBranch: 'main',
              targetRepoBranch: 'main',
              createdAt: '2025-01-01T00:00:00.000Z',
              createdBy: 'user:default/someone',
            },
          ],
        }),
    };

    it('should throw when manual project name already exists', async () => {
      mockFetch.mockReset();
      mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
        if (options?.method === 'GET') {
          return Promise.resolve(existingProjectsResponse);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'manual' as const,
          name: 'Existing Project',
          abbreviation: 'EP',
          sourceRepoUrl: 'https://github.com/org/repo',
          sourceRepoBranch: 'main',
          areTargetAndSourceRepoShared: false,
          targetRepoUrl: 'https://github.com/org/target-repo',
          targetRepoBranch: 'main',
        },
        secrets: {
          SRC_USER_OAUTH_TOKEN: 'mock-source-token',
          TGT_USER_OAUTH_TOKEN: 'mock-target-token',
        },
      });

      await expect(action.handler(mockContext)).rejects.toThrow(
        'A project named "Existing Project" already exists',
      );
    });

    it('should skip existing projects in CSV bulk import and report skippedCount', async () => {
      mockFetch.mockReset();
      mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
        if (options?.method === 'GET') {
          return Promise.resolve(existingProjectsResponse);
        }
        const body = options?.body ? JSON.parse(options.body as string) : {};
        if (body.sourceRepoAuth && body.targetRepoAuth) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ status: 'pending', jobId: 'csv-init-new' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'new-project-id',
              name: 'New Project',
              abbreviation: 'NP',
              description: '',
              createdAt: '2025-01-01T00:00:00.000Z',
              createdBy: 'user:default/csv-user',
            }),
        });
      });

      const csv = encodeCsv(
        'name,abbreviation,sourceRepoUrl,sourceRepoBranch,targetRepoBranch\n' +
          'Existing Project,EP,https://github.com/org/repo1,main,main\n' +
          'New Project,NP,https://github.com/org/repo2,main,main',
      );

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'csv' as const,
          csvContent: csv,
        },
        secrets: {
          OAUTH_TOKEN_github: 'gh-csv-token',
        },
      });

      await action.handler(mockContext);

      expect(mockContext.output).toHaveBeenCalledWith('successCount', 1);
      expect(mockContext.output).toHaveBeenCalledWith('errorCount', 0);
      expect(mockContext.output).toHaveBeenCalledWith('skippedCount', 1);
    });

    it('should skip duplicate names within the same CSV', async () => {
      mockFetch.mockReset();
      let createCallCount = 0;
      mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
        if (options?.method === 'GET') {
          return Promise.resolve(emptyProjectsResponse);
        }
        const body = options?.body ? JSON.parse(options.body as string) : {};
        if (body.sourceRepoAuth && body.targetRepoAuth) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 'pending',
                jobId: `csv-init-${createCallCount}`,
              }),
          });
        }
        createCallCount++;
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: `csv-project-${createCallCount}`,
              name: 'Duplicate Project',
              abbreviation: 'DP',
              description: '',
              createdAt: '2025-01-01T00:00:00.000Z',
              createdBy: 'user:default/csv-user',
            }),
        });
      });

      const csv = encodeCsv(
        'name,abbreviation,sourceRepoUrl,sourceRepoBranch,targetRepoBranch\n' +
          'Duplicate Project,DP,https://github.com/org/repo1,main,main\n' +
          'Duplicate Project,DP,https://github.com/org/repo2,main,main',
      );

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'csv' as const,
          csvContent: csv,
        },
        secrets: {
          OAUTH_TOKEN_github: 'gh-csv-token',
        },
      });

      await action.handler(mockContext);

      expect(mockContext.output).toHaveBeenCalledWith('successCount', 1);
      expect(mockContext.output).toHaveBeenCalledWith('errorCount', 0);
      expect(mockContext.output).toHaveBeenCalledWith('skippedCount', 1);
    });

    it('should allow manual project creation when name does not exist', async () => {
      mockFetch
        .mockResolvedValueOnce(existingProjectsResponse)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'brand-new-id',
              name: 'Brand New Project',
              abbreviation: 'BNP',
              description: '',
              createdAt: '2025-01-01T00:00:00.000Z',
              createdBy: 'user:default/jane',
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ status: 'pending', jobId: 'init-job-new' }),
        });

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'manual' as const,
          name: 'Brand New Project',
          abbreviation: 'BNP',
          sourceRepoUrl: 'https://github.com/org/repo',
          sourceRepoBranch: 'main',
          areTargetAndSourceRepoShared: false,
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
        'brand-new-id',
      );
      expect(mockContext.output).toHaveBeenCalledWith('successCount', 1);
    });
  });

  describe('fetchExistingProjectNames pagination', () => {
    const projectItem = (name: string, index: number) => ({
      id: `id-${index}`,
      name,
      abbreviation: `A${index}`,
      description: '',
      sourceRepoUrl: 'https://github.com/org/r',
      targetRepoUrl: 'https://github.com/org/r',
      sourceRepoBranch: 'main',
      targetRepoBranch: 'main',
      createdAt: '2025-01-01T00:00:00.000Z',
      createdBy: 'user:default/test',
    });

    it('should request page=0 on the first call (0-indexed)', async () => {
      const getUrls: string[] = [];
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === 'GET') {
          getUrls.push(url);
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ totalCount: 0, items: [] }),
          });
        }
        const body = options?.body ? JSON.parse(options.body as string) : {};
        if (body.sourceRepoAuth) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ status: 'pending', jobId: 'init-page' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'p1',
              name: 'Page Test',
              abbreviation: 'PT',
              description: '',
              createdAt: '2025-01-01T00:00:00.000Z',
              createdBy: 'user:default/test',
            }),
        });
      });

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'manual' as const,
          name: 'Page Test',
          abbreviation: 'PT',
          sourceRepoUrl: 'https://github.com/org/repo',
          sourceRepoBranch: 'main',
          areTargetAndSourceRepoShared: true,
          targetRepoBranch: 'main',
        },
        secrets: { SRC_USER_OAUTH_TOKEN: 'token' },
      });

      await action.handler(mockContext);

      expect(getUrls).toHaveLength(1);
      const url = new URL(getUrls[0]);
      expect(url.searchParams.get('page')).toBe('0');
      expect(url.searchParams.get('pageSize')).toBe('100');
    });

    it('should paginate through all pages and detect a duplicate on a later page', async () => {
      const page0Items = Array.from({ length: 100 }, (_, i) =>
        projectItem(`Project ${i}`, i),
      );
      const page1Items = [projectItem('Late Duplicate', 100)];

      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === 'GET') {
          const u = new URL(url);
          const page = u.searchParams.get('page');
          if (page === '0') {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({ totalCount: 101, items: page0Items }),
            });
          }
          if (page === '1') {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({ totalCount: 101, items: page1Items }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ totalCount: 0, items: [] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'manual' as const,
          name: 'Late Duplicate',
          abbreviation: 'LD',
          sourceRepoUrl: 'https://github.com/org/repo',
          sourceRepoBranch: 'main',
          areTargetAndSourceRepoShared: true,
          targetRepoBranch: 'main',
        },
        secrets: { SRC_USER_OAUTH_TOKEN: 'token' },
      });

      await expect(action.handler(mockContext)).rejects.toThrow(
        'A project named "Late Duplicate" already exists',
      );
    });

    it('should stop paginating when a page returns fewer items than pageSize', async () => {
      const getUrls: string[] = [];
      const page0Items = Array.from({ length: 100 }, (_, i) =>
        projectItem(`P${i}`, i),
      );
      const page1Items = Array.from({ length: 30 }, (_, i) =>
        projectItem(`P${100 + i}`, 100 + i),
      );

      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === 'GET') {
          getUrls.push(url);
          const u = new URL(url);
          const page = u.searchParams.get('page');
          if (page === '0') {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({ totalCount: 130, items: page0Items }),
            });
          }
          if (page === '1') {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({ totalCount: 130, items: page1Items }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ totalCount: 0, items: [] }),
          });
        }
        const body = options?.body ? JSON.parse(options.body as string) : {};
        if (body.sourceRepoAuth) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ status: 'pending', jobId: 'init-page' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'new-id',
              name: 'Unique Name',
              abbreviation: 'UN',
              description: '',
              createdAt: '2025-01-01T00:00:00.000Z',
              createdBy: 'user:default/test',
            }),
        });
      });

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'manual' as const,
          name: 'Unique Name',
          abbreviation: 'UN',
          sourceRepoUrl: 'https://github.com/org/repo',
          sourceRepoBranch: 'main',
          areTargetAndSourceRepoShared: true,
          targetRepoBranch: 'main',
        },
        secrets: { SRC_USER_OAUTH_TOKEN: 'token' },
      });

      await action.handler(mockContext);

      // Only 2 GET requests: page 0 (100 items) and page 1 (30 items < 100 → stop)
      expect(getUrls).toHaveLength(2);
      expect(new URL(getUrls[0]).searchParams.get('page')).toBe('0');
      expect(new URL(getUrls[1]).searchParams.get('page')).toBe('1');
    });

    it('should throw when projectsGet fetch rejects', async () => {
      mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
        if (options?.method === 'GET') {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'manual' as const,
          name: 'Any Project',
          abbreviation: 'AP',
          sourceRepoUrl: 'https://github.com/org/repo',
          sourceRepoBranch: 'main',
          areTargetAndSourceRepoShared: true,
          targetRepoBranch: 'main',
        },
        secrets: { SRC_USER_OAUTH_TOKEN: 'token' },
      });

      await expect(action.handler(mockContext)).rejects.toThrow(
        'Failed to list existing projects: Network error',
      );
    });

    it('should throw when projectsGet response.json() rejects', async () => {
      mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
        if (options?.method === 'GET') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.reject(new Error('Invalid JSON')),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'manual' as const,
          name: 'Any Project',
          abbreviation: 'AP',
          sourceRepoUrl: 'https://github.com/org/repo',
          sourceRepoBranch: 'main',
          areTargetAndSourceRepoShared: true,
          targetRepoBranch: 'main',
        },
        secrets: { SRC_USER_OAUTH_TOKEN: 'token' },
      });

      await expect(action.handler(mockContext)).rejects.toThrow(
        'Failed to list existing projects: Invalid JSON',
      );
    });

    it('should throw when projectsGet returns a non-OK HTTP status', async () => {
      mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
        if (options?.method === 'GET') {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ message: 'Unauthorized' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: {
          inputMethod: 'manual' as const,
          name: 'Any Project',
          abbreviation: 'AP',
          sourceRepoUrl: 'https://github.com/org/repo',
          sourceRepoBranch: 'main',
          areTargetAndSourceRepoShared: true,
          targetRepoBranch: 'main',
        },
        secrets: { SRC_USER_OAUTH_TOKEN: 'token' },
      });

      await expect(action.handler(mockContext)).rejects.toThrow(
        'Failed to list existing projects: status 401: Unauthorized',
      );
    });
  });

  describe('RepoAuthentication ↔ createProjectAction contract', () => {
    it('should use SCAFFOLDER_SECRET_PREFIX as the secret key prefix', () => {
      expect(SCAFFOLDER_SECRET_PREFIX).toBe('OAUTH_TOKEN_');
    });

    it('should recognise all provider names from allProviders as valid secret keys', () => {
      for (const provider of allProviders) {
        const key = `${SCAFFOLDER_SECRET_PREFIX}${provider.name}`;
        expect(key).toMatch(/^OAUTH_TOKEN_(github|gitlab|bitbucket)$/);
      }
    });

    it('should pass pre-augmented tokens from secrets to the API without double-augmenting', async () => {
      const runBodies: Array<{
        sourceRepoAuth?: { token: string };
        targetRepoAuth?: { token: string };
      }> = [];
      let createCallCount = 0;

      mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
        if (options?.method === 'GET') {
          return Promise.resolve(emptyProjectsResponse);
        }
        const body = options?.body ? JSON.parse(options.body as string) : {};
        if (body.sourceRepoAuth && body.targetRepoAuth) {
          runBodies.push(body);
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 'pending',
                jobId: `init-${runBodies.length}`,
              }),
          });
        }
        createCallCount++;
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: `proj-${createCallCount}`,
              name: `Project ${createCallCount}`,
              abbreviation: `P${createCallCount}`,
              description: '',
              createdAt: '2025-01-01T00:00:00.000Z',
              createdBy: 'user:default/test',
            }),
        });
      });

      const csv = encodeCsv(
        'name,abbreviation,sourceRepoUrl,sourceRepoBranch,targetRepoBranch\n' +
          'GH Proj,GH,https://github.com/org/repo,main,main\n' +
          'GL Proj,GL,https://gitlab.com/org/repo,main,main\n' +
          'BB Proj,BB,https://bitbucket.org/ws/repo,main,main',
      );

      const ghRaw = 'ghp_abc123';
      const glRaw = 'glpat-xyz789';
      const bbRaw = 'bb-token-456';

      const secrets: Record<string, string> = {};
      const rawByProvider: Record<string, string> = {
        github: ghRaw,
        gitlab: glRaw,
        bitbucket: bbRaw,
      };

      for (const provider of allProviders) {
        const raw = rawByProvider[provider.name];
        secrets[`${SCAFFOLDER_SECRET_PREFIX}${provider.name}`] =
          provider.augmentToken(raw);
      }

      const action = createProjectAction(mockDiscoveryApi, mockConfig, {
        fetchApi: { fetch: mockFetch },
      });
      const mockContext = createMockActionContext({
        input: { inputMethod: 'csv' as const, csvContent: csv },
        secrets,
      });

      await action.handler(mockContext);

      expect(runBodies).toHaveLength(3);

      expect(runBodies[0].sourceRepoAuth?.token).toBe(ghRaw);
      expect(runBodies[0].targetRepoAuth?.token).toBe(ghRaw);

      expect(runBodies[1].sourceRepoAuth?.token).toBe(`oauth2:${glRaw}`);
      expect(runBodies[1].targetRepoAuth?.token).toBe(`oauth2:${glRaw}`);

      expect(runBodies[2].sourceRepoAuth?.token).toBe(`x-token-auth:${bbRaw}`);
      expect(runBodies[2].targetRepoAuth?.token).toBe(`x-token-auth:${bbRaw}`);

      expect(mockContext.output).toHaveBeenCalledWith('successCount', 3);
      expect(mockContext.output).toHaveBeenCalledWith('errorCount', 0);
    });
  });
});
