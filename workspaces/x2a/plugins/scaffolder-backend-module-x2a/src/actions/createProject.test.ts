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

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(createdProject),
    });

    const action = createProjectAction(mockDiscoveryApi);

    // The action uses global fetch inside the custom fetchApi; we need to inject our mock.
    // createProjectAction builds DefaultApiClient with fetchApi: { fetch: (url, opts) => fetch(url, opts) }.
    // So the handler uses the real fetch. We mock global fetch so the client's request is intercepted.
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;

    const mockContext = createMockActionContext({
      input: {
        name: 'My Project',
        description: 'A test project',
        abbreviation: 'PRJ',
        sourceRepoUrl: 'https://github.com/org/repo',
        areTargeAndSourceRepoShared: false,
        targetRepoBranch: 'main',
      },
    });

    await action.handler(mockContext);

    globalThis.fetch = originalFetch;

    expect(mockContext.output).toHaveBeenCalledWith(
      'projectId',
      'project-uuid-123',
    );
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

    mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
      const body = options?.body ? JSON.parse(options.body as string) : {};
      expect(body).toEqual({
        name: 'Another Project',
        description: '',
        abbreviation: 'ABBR',
      });
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(createdProject),
      });
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;

    const action = createProjectAction(mockDiscoveryApi);
    const mockContext = createMockActionContext({
      input: {
        name: 'Another Project',
        abbreviation: 'ABBR',
        sourceRepoUrl: 'https://github.com/org/repo2',
        areTargeAndSourceRepoShared: true,
        targetRepoBranch: 'main',
      },
    });

    await action.handler(mockContext);

    globalThis.fetch = originalFetch;

    expect(mockContext.output).toHaveBeenCalledWith(
      'projectId',
      'project-uuid-456',
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
      expect(headers.Authorization).toBe('Bearer my-backstage-token');
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(createdProject),
      });
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;

    const action = createProjectAction(mockDiscoveryApi);
    const mockContext = createMockActionContext({
      input: {
        name: 'Token Project',
        description: 'With token',
        abbreviation: 'TKN',
        sourceRepoUrl: 'https://github.com/org/repo',
        areTargeAndSourceRepoShared: false,
        targetRepoBranch: 'main',
      },
      secrets: {
        backstageToken: 'my-backstage-token',
      },
    });

    await action.handler(mockContext);

    globalThis.fetch = originalFetch;

    expect(mockContext.output).toHaveBeenCalledWith(
      'projectId',
      'project-uuid-789',
    );
  });

  it('should log that the action is running', async () => {
    const loggerInfo = jest.fn();
    mockFetch.mockResolvedValueOnce({
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
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;

    const action = createProjectAction(mockDiscoveryApi);
    const mockContext = createMockActionContext({
      input: {
        name: 'Log Test',
        abbreviation: 'LOG',
        sourceRepoUrl: 'https://github.com/org/repo',
        areTargeAndSourceRepoShared: false,
        targetRepoBranch: 'main',
      },
      logger: {
        ...createMockActionContext().logger,
        info: loggerInfo,
      },
    });

    await action.handler(mockContext);

    globalThis.fetch = originalFetch;

    expect(loggerInfo).toHaveBeenCalledWith(
      'Running x2a:project:create template action for undefined',
    );
  });
});
