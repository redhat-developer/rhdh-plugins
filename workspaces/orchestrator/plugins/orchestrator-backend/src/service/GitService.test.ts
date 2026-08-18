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

import type { LoggerService } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import { ScmIntegrations } from '@backstage/integration';

import { GitService } from './GitService';
import { Git } from './GitWrapper';

jest.mock('@backstage/integration');
jest.mock('./GitWrapper');

const flushPromises = () => new Promise(resolve => process.nextTick(resolve));

describe('GitService', () => {
  let mockLogger: jest.Mocked<LoggerService>;
  let mockConfig: jest.Mocked<Config>;
  let mockGit: jest.Mocked<Git>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      child: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    mockConfig = {} as jest.Mocked<Config>;

    mockGit = {
      clone: jest.fn(),
      checkout: jest.fn(),
      fetch: jest.fn(),
      add: jest.fn(),
      commit: jest.fn(),
      push: jest.fn(),
      merge: jest.fn(),
    } as unknown as jest.Mocked<Git>;

    (Git.fromAuth as jest.Mock).mockReturnValue(mockGit);
  });

  describe('constructor', () => {
    it('should initialize with GitHub token when available', () => {
      const mockToken = 'test-github-token';
      const mockGithubIntegration = {
        config: { token: mockToken },
      };

      (ScmIntegrations.fromConfig as jest.Mock).mockReturnValue({
        github: {
          list: jest.fn().mockReturnValue([mockGithubIntegration]),
        },
      });

      const service = new GitService(mockLogger, mockConfig);

      expect(service).toBeDefined();
      expect(Git.fromAuth).toHaveBeenCalledWith({
        username: 'x-access-token',
        password: mockToken,
      });
    });

    it('should initialize without authentication when no token available', () => {
      (ScmIntegrations.fromConfig as jest.Mock).mockReturnValue({
        github: {
          list: jest.fn().mockReturnValue([]),
        },
      });

      const service = new GitService(mockLogger, mockConfig);

      expect(service).toBeDefined();
      expect(Git.fromAuth).toHaveBeenCalledWith({
        username: 'x-access-token',
        password: undefined,
      });
    });
  });

  describe('clone', () => {
    it('should clone repository and checkout main branch', async () => {
      (ScmIntegrations.fromConfig as jest.Mock).mockReturnValue({
        github: {
          list: jest.fn().mockReturnValue([]),
        },
      });

      mockGit.clone.mockResolvedValue(undefined);
      mockGit.checkout.mockResolvedValue(undefined);

      const service = new GitService(mockLogger, mockConfig);
      const repoURL = 'https://github.com/test/repo.git';
      const localPath = '/tmp/test-repo';

      await service.clone(repoURL, localPath);

      expect(mockLogger.info).toHaveBeenCalledWith(
        `cloning repo ${repoURL} into ${localPath}`,
      );
      expect(mockGit.clone).toHaveBeenCalledWith({
        url: repoURL,
        dir: localPath,
        depth: 1,
      });
      expect(mockGit.checkout).toHaveBeenCalledWith({
        dir: localPath,
        ref: 'main',
      });
    });

    it('should handle clone errors', async () => {
      (ScmIntegrations.fromConfig as jest.Mock).mockReturnValue({
        github: {
          list: jest.fn().mockReturnValue([]),
        },
      });

      const cloneError = new Error('Clone failed');
      mockGit.clone.mockRejectedValue(cloneError);

      const service = new GitService(mockLogger, mockConfig);

      await expect(
        service.clone('https://github.com/test/repo.git', '/tmp/test-repo'),
      ).rejects.toThrow('Clone failed');
    });
  });

  describe('push', () => {
    it('should warn and return early when not authenticated', async () => {
      (ScmIntegrations.fromConfig as jest.Mock).mockReturnValue({
        github: {
          list: jest.fn().mockReturnValue([]),
        },
      });

      const service = new GitService(mockLogger, mockConfig);
      await service.push('/tmp/test-repo', 'Test commit');

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Git integration is required to be configured for push, with the token or credentials',
      );
      expect(mockGit.fetch).not.toHaveBeenCalled();
    });

    it('should execute full push workflow when authenticated', async () => {
      const mockToken = 'test-token';
      (ScmIntegrations.fromConfig as jest.Mock).mockReturnValue({
        github: {
          list: jest.fn().mockReturnValue([{ config: { token: mockToken } }]),
        },
      });

      mockGit.fetch.mockResolvedValue(undefined);
      mockGit.checkout.mockResolvedValue(undefined);
      mockGit.add.mockResolvedValue(undefined);
      mockGit.commit.mockResolvedValue('commit-sha');
      mockGit.push.mockResolvedValue({} as any);

      const service = new GitService(mockLogger, mockConfig);
      const dir = '/tmp/test-repo';
      const message = 'Test commit message';

      await service.push(dir, message);
      await flushPromises();

      expect(mockGit.fetch).toHaveBeenCalledWith({
        remote: 'origin',
        dir,
      });
      expect(mockGit.checkout).toHaveBeenCalledWith({
        dir,
        ref: 'main',
      });
      expect(mockGit.add).toHaveBeenCalledWith({
        dir,
        filepath: '.',
      });
      expect(mockGit.commit).toHaveBeenCalledWith({
        dir,
        message,
        author: {
          name: 'backstage-orchestrator',
          email: 'orchestrator@backstage.io',
        },
        committer: {
          name: 'backstage-orchestrator',
          email: 'orchestrator@backstage.io',
        },
      });
      expect(mockGit.push).toHaveBeenCalledWith({
        dir,
        remote: 'origin',
        remoteRef: 'main',
        force: true,
      });
    });

    it('should handle push errors gracefully', async () => {
      const mockToken = 'test-token';
      (ScmIntegrations.fromConfig as jest.Mock).mockReturnValue({
        github: {
          list: jest.fn().mockReturnValue([{ config: { token: mockToken } }]),
        },
      });

      const pushError = new Error('Push failed');
      mockGit.fetch.mockResolvedValue(undefined);
      mockGit.checkout.mockResolvedValue(undefined);
      mockGit.add.mockResolvedValue(undefined);
      mockGit.commit.mockResolvedValue('commit-sha');
      mockGit.push.mockRejectedValue(pushError);

      const service = new GitService(mockLogger, mockConfig);
      await service.push('/tmp/test-repo', 'Test commit');
      await flushPromises();

      expect(mockLogger.error).toHaveBeenCalledWith(pushError);
    });
  });

  describe('pull', () => {
    it('should execute full pull workflow', async () => {
      (ScmIntegrations.fromConfig as jest.Mock).mockReturnValue({
        github: {
          list: jest.fn().mockReturnValue([]),
        },
      });

      mockGit.fetch.mockResolvedValue(undefined);
      mockGit.checkout.mockResolvedValue(undefined);
      mockGit.merge.mockResolvedValue({} as any);

      const service = new GitService(mockLogger, mockConfig);
      const localPath = '/tmp/test-repo';

      await service.pull(localPath);
      await flushPromises();

      expect(mockGit.fetch).toHaveBeenCalledWith({
        remote: 'origin',
        dir: localPath,
      });
      expect(mockGit.checkout).toHaveBeenCalledWith({
        dir: localPath,
        ref: 'main',
      });
      expect(mockGit.merge).toHaveBeenCalledWith({
        dir: localPath,
        ours: 'main',
        theirs: 'origin/main',
        author: {
          name: 'backstage-orchestrator',
          email: 'orchestrator@backstage.io',
        },
        committer: {
          name: 'backstage-orchestrator',
          email: 'orchestrator@backstage.io',
        },
      });
    });

    it('should handle pull errors gracefully', async () => {
      (ScmIntegrations.fromConfig as jest.Mock).mockReturnValue({
        github: {
          list: jest.fn().mockReturnValue([]),
        },
      });

      const pullError = new Error('Pull failed');
      mockGit.fetch.mockResolvedValue(undefined);
      mockGit.checkout.mockResolvedValue(undefined);
      mockGit.merge.mockRejectedValue(pullError);

      const service = new GitService(mockLogger, mockConfig);
      await service.pull('/tmp/test-repo');
      await flushPromises();

      expect(mockLogger.error).toHaveBeenCalledWith(pullError);
    });
  });
});
