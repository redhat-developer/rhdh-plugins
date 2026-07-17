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

import {
  DEFAULT_SONATAFLOW_BASE_URL,
  DEFAULT_SONATAFLOW_CONTAINER_IMAGE,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { spawn } from 'child_process';
import { EventEmitter } from 'events';

import { DevModeService } from './DevModeService';

jest.mock('child_process');
jest.mock('fs-extra');
jest.mock('./GitService');

const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

const flushPromises = () => new Promise(resolve => process.nextTick(resolve));

describe('DevModeService', () => {
  let mockLogger: jest.Mocked<LoggerService>;
  let mockConfig: jest.Mocked<Config>;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    originalFetch = global.fetch;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      child: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    mockConfig = {
      getOptionalString: jest.fn(),
      getOptionalNumber: jest.fn(),
      getOptionalConfigArray: jest.fn().mockReturnValue([]),
      getOptionalConfig: jest.fn(),
      has: jest.fn(),
      keys: jest.fn(),
      get: jest.fn(),
      getBoolean: jest.fn(),
      getNumber: jest.fn(),
      getString: jest.fn(),
      getStringArray: jest.fn(),
      getConfig: jest.fn(),
      getConfigArray: jest.fn(),
      getOptionalBoolean: jest.fn(),
      getOptionalStringArray: jest.fn(),
    } as unknown as jest.Mocked<Config>;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('constructor and devModeUrl', () => {
    it('should construct with default values when config is empty', () => {
      mockConfig.getOptionalString.mockReturnValue(undefined);
      mockConfig.getOptionalNumber.mockReturnValue(undefined);

      const service = new DevModeService(mockConfig, mockLogger);

      expect(service.devModeUrl).toBe(DEFAULT_SONATAFLOW_BASE_URL);
    });

    it('should construct devModeUrl without port when port is not configured', () => {
      const customHost = 'http://custom-host';
      mockConfig.getOptionalString.mockImplementation((key: string) => {
        if (key === 'orchestrator.sonataFlowService.baseUrl') return customHost;
        return undefined;
      });
      mockConfig.getOptionalNumber.mockReturnValue(undefined);

      const service = new DevModeService(mockConfig, mockLogger);

      expect(service.devModeUrl).toBe(customHost);
    });

    it('should construct devModeUrl with port when port is configured', () => {
      const customHost = 'http://custom-host';
      const customPort = 8080;
      mockConfig.getOptionalString.mockImplementation((key: string) => {
        if (key === 'orchestrator.sonataFlowService.baseUrl') return customHost;
        return undefined;
      });
      mockConfig.getOptionalNumber.mockReturnValue(customPort);

      const service = new DevModeService(mockConfig, mockLogger);

      expect(service.devModeUrl).toBe(`${customHost}:${customPort}`);
    });

    it('should use default container image when not configured', () => {
      mockConfig.getOptionalString.mockReturnValue(undefined);
      mockConfig.getOptionalNumber.mockReturnValue(undefined);

      const service = new DevModeService(mockConfig, mockLogger);

      expect(service).toBeDefined();
      expect(mockConfig.getOptionalString).toHaveBeenCalledWith(
        'orchestrator.sonataFlowService.container',
      );
    });
  });

  describe('launchDevMode', () => {
    it('should return true when SonataFlow is already running', async () => {
      mockConfig.getOptionalString.mockReturnValue(undefined);
      mockConfig.getOptionalNumber.mockReturnValue(undefined);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      const service = new DevModeService(mockConfig, mockLogger);
      const result = await service.launchDevMode();

      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('SonataFlow is up and running'),
      );
    });
  });

  describe('loadDevWorkflows', () => {
    it('should skip loading when no repo URL configured', async () => {
      mockConfig.getOptionalString.mockReturnValue(undefined);
      mockConfig.getOptionalNumber.mockReturnValue(undefined);

      const service = new DevModeService(mockConfig, mockLogger);
      await service.loadDevWorkflows();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('No Git repository or path configured'),
      );
    });

    it('should skip loading when no resource path configured', async () => {
      mockConfig.getOptionalString.mockImplementation((key: string) => {
        if (
          key ===
          'orchestrator.sonataFlowService.workflowsSource.gitRepositoryUrl'
        )
          return 'https://github.com/test/repo.git';
        return undefined;
      });
      mockConfig.getOptionalNumber.mockReturnValue(undefined);

      const service = new DevModeService(mockConfig, mockLogger);
      await service.loadDevWorkflows();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('No Git repository or path configured'),
      );
    });
  });

  describe('extractConnectionConfig', () => {
    it('should extract all configuration values correctly', () => {
      const customHost = 'http://custom-host';
      const customPort = 8080;
      const customImage = 'custom-image:latest';
      const customPath = '/custom/path';
      const customPersistencePath = '/custom/persistence';
      const customRepoUrl = 'https://github.com/test/repo.git';
      const customToken = 'test-token';
      const customNotificationsUrl = 'http://notifications';
      const customRuntime = 'podman';

      mockConfig.getOptionalString.mockImplementation((key: string) => {
        if (key === 'orchestrator.sonataFlowService.baseUrl') return customHost;
        if (key === 'orchestrator.sonataFlowService.container')
          return customImage;
        if (key === 'orchestrator.sonataFlowService.workflowsSource.localPath')
          return customPath;
        if (key === 'orchestrator.sonataFlowService.persistence.path')
          return customPersistencePath;
        if (
          key ===
          'orchestrator.sonataFlowService.workflowsSource.gitRepositoryUrl'
        )
          return customRepoUrl;
        if (key === 'orchestrator.sonataFlowService.notificationsBearerToken')
          return customToken;
        if (key === 'orchestrator.sonataFlowService.notificationsUrl')
          return customNotificationsUrl;
        if (key === 'orchestrator.sonataFlowService.runtime')
          return customRuntime;
        return undefined;
      });
      mockConfig.getOptionalNumber.mockReturnValue(customPort);

      const service = new DevModeService(mockConfig, mockLogger);

      expect(service.devModeUrl).toBe(`${customHost}:${customPort}`);
      expect(mockConfig.getOptionalString).toHaveBeenCalledWith(
        'orchestrator.sonataFlowService.baseUrl',
      );
      expect(mockConfig.getOptionalString).toHaveBeenCalledWith(
        'orchestrator.sonataFlowService.container',
      );
      expect(mockConfig.getOptionalString).toHaveBeenCalledWith(
        'orchestrator.sonataFlowService.workflowsSource.localPath',
      );
      expect(mockConfig.getOptionalString).toHaveBeenCalledWith(
        'orchestrator.sonataFlowService.persistence.path',
      );
    });

    it('should use default values when config is not provided', () => {
      mockConfig.getOptionalString.mockReturnValue(undefined);
      mockConfig.getOptionalNumber.mockReturnValue(undefined);

      const service = new DevModeService(mockConfig, mockLogger);

      expect(service.devModeUrl).toBe(DEFAULT_SONATAFLOW_BASE_URL);
      expect(mockConfig.getOptionalString).toHaveBeenCalledWith(
        'orchestrator.sonataFlowService.container',
      );
    });
  });

  describe('command generation with different configurations', () => {
    it('should include persistence volume when configured', async () => {
      const persistencePath = '/test/persistence';
      mockConfig.getOptionalString.mockImplementation((key: string) => {
        if (key === 'orchestrator.sonataFlowService.baseUrl')
          return 'http://localhost';
        if (key === 'orchestrator.sonataFlowService.workflowsSource.localPath')
          return '/test/workflows';
        if (key === 'orchestrator.sonataFlowService.persistence.path')
          return persistencePath;
        if (key === 'orchestrator.sonataFlowService.runtime') return 'docker';
        return undefined;
      });
      mockConfig.getOptionalNumber.mockReturnValue(8080);

      const mockProcess = new EventEmitter() as any;
      mockSpawn.mockReturnValue(mockProcess);

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValue({ ok: true });

      const service = new DevModeService(mockConfig, mockLogger);
      const launchPromise = service.launchDevMode();

      await flushPromises();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Persistence is enabled'),
      );

      await launchPromise;
    });

    it('should not include persistence volume when not configured', async () => {
      mockConfig.getOptionalString.mockImplementation((key: string) => {
        if (key === 'orchestrator.sonataFlowService.baseUrl')
          return 'http://localhost';
        if (key === 'orchestrator.sonataFlowService.workflowsSource.localPath')
          return '/test/workflows';
        if (key === 'orchestrator.sonataFlowService.runtime') return 'docker';
        return undefined;
      });
      mockConfig.getOptionalNumber.mockReturnValue(8080);

      const mockProcess = new EventEmitter() as any;
      mockSpawn.mockReturnValue(mockProcess);

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValue({ ok: true });

      const service = new DevModeService(mockConfig, mockLogger);
      await service.launchDevMode();

      await flushPromises();

      expect(mockLogger.info).not.toHaveBeenCalledWith(
        expect.stringContaining('Persistence is enabled'),
      );
    });

    it('should use correct container runtime arguments for docker', async () => {
      mockConfig.getOptionalString.mockImplementation((key: string) => {
        if (key === 'orchestrator.sonataFlowService.baseUrl')
          return 'http://localhost';
        if (key === 'orchestrator.sonataFlowService.workflowsSource.localPath')
          return '/test/workflows';
        if (key === 'orchestrator.sonataFlowService.container')
          return DEFAULT_SONATAFLOW_CONTAINER_IMAGE;
        if (key === 'orchestrator.sonataFlowService.runtime') return 'docker';
        return undefined;
      });
      mockConfig.getOptionalNumber.mockReturnValue(8080);

      const mockProcess = new EventEmitter() as any;
      mockSpawn.mockReturnValue(mockProcess);

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValue({ ok: true });

      const service = new DevModeService(mockConfig, mockLogger);
      const launchPromise = service.launchDevMode();

      await flushPromises();

      expect(mockSpawn).toHaveBeenCalledWith(
        'docker',
        expect.arrayContaining([
          'run',
          '--name',
          'backstage-internal-sonataflow',
          '--add-host',
          'host.docker.internal:host-gateway',
        ]),
        expect.objectContaining({
          shell: false,
        }),
      );

      await launchPromise;
    });

    it('should use correct container runtime arguments for podman', async () => {
      mockConfig.getOptionalString.mockImplementation((key: string) => {
        if (key === 'orchestrator.sonataFlowService.baseUrl')
          return 'http://localhost';
        if (key === 'orchestrator.sonataFlowService.workflowsSource.localPath')
          return '/test/workflows';
        if (key === 'orchestrator.sonataFlowService.container')
          return DEFAULT_SONATAFLOW_CONTAINER_IMAGE;
        if (key === 'orchestrator.sonataFlowService.runtime') return 'podman';
        return undefined;
      });
      mockConfig.getOptionalNumber.mockReturnValue(8080);

      const mockProcess = new EventEmitter() as any;
      mockSpawn.mockReturnValue(mockProcess);

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValue({ ok: true });

      const service = new DevModeService(mockConfig, mockLogger);
      const launchPromise = service.launchDevMode();

      await flushPromises();

      expect(mockSpawn).toHaveBeenCalledWith(
        'podman',
        expect.arrayContaining([
          'run',
          '--name',
          'backstage-internal-sonataflow',
          '--replace',
        ]),
        expect.any(Object),
      );

      const spawnArgs = mockSpawn.mock.calls[0][1] as string[];
      expect(spawnArgs).not.toContain('--add-host');

      await launchPromise;
    });

    it('should include all required environment variables', async () => {
      const port = 9090;
      const token = 'test-bearer-token';
      const notificationsUrl = 'http://notifications-service';

      mockConfig.getOptionalString.mockImplementation((key: string) => {
        if (key === 'orchestrator.sonataFlowService.baseUrl')
          return 'http://localhost';
        if (key === 'orchestrator.sonataFlowService.workflowsSource.localPath')
          return '/test/workflows';
        if (key === 'orchestrator.sonataFlowService.notificationsBearerToken')
          return token;
        if (key === 'orchestrator.sonataFlowService.notificationsUrl')
          return notificationsUrl;
        if (key === 'orchestrator.sonataFlowService.runtime') return 'docker';
        return undefined;
      });
      mockConfig.getOptionalNumber.mockReturnValue(port);

      const mockProcess = new EventEmitter() as any;
      mockSpawn.mockReturnValue(mockProcess);

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValue({ ok: true });

      const service = new DevModeService(mockConfig, mockLogger);
      const launchPromise = service.launchDevMode();

      await flushPromises();

      const spawnArgs = mockSpawn.mock.calls[0][1] as string[];

      expect(spawnArgs).toContain('-e');

      const envVarString = spawnArgs.join(' ');
      expect(envVarString).toContain(`QUARKUS_HTTP_PORT=${port}`);
      expect(envVarString).toContain(
        `KOGITO_SERVICE_URL=http://localhost:${port}`,
      );
      expect(envVarString).toContain(`NOTIFICATIONS_BEARER_TOKEN=${token}`);
      expect(envVarString).toContain(
        `BACKSTAGE_NOTIFICATIONS_URL=${notificationsUrl}`,
      );
      expect(envVarString).toContain(
        'KOGITO.CODEGEN.PROCESS.FAILONERROR=false',
      );

      await launchPromise;
    });

    it('should mount volumes correctly', async () => {
      const workflowsPath = '/test/workflows';
      mockConfig.getOptionalString.mockImplementation((key: string) => {
        if (key === 'orchestrator.sonataFlowService.baseUrl')
          return 'http://localhost';
        if (key === 'orchestrator.sonataFlowService.workflowsSource.localPath')
          return workflowsPath;
        if (key === 'orchestrator.sonataFlowService.runtime') return 'docker';
        return undefined;
      });
      mockConfig.getOptionalNumber.mockReturnValue(8080);

      const mockProcess = new EventEmitter() as any;
      mockSpawn.mockReturnValue(mockProcess);

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValue({ ok: true });

      const service = new DevModeService(mockConfig, mockLogger);
      const launchPromise = service.launchDevMode();

      await flushPromises();

      const spawnArgs = mockSpawn.mock.calls[0][1] as string[];
      const volumeFlag = spawnArgs.indexOf('-v');

      expect(volumeFlag).toBeGreaterThan(-1);
      expect(spawnArgs[volumeFlag + 1]).toMatch(new RegExp(`${workflowsPath}`));

      await launchPromise;
    });

    it('should log an error when the child process emits an error event', async () => {
      mockConfig.getOptionalString.mockImplementation((key: string) => {
        if (key === 'orchestrator.sonataFlowService.baseUrl')
          return 'http://localhost';
        if (key === 'orchestrator.sonataFlowService.workflowsSource.localPath')
          return '/test/workflows';
        if (key === 'orchestrator.sonataFlowService.runtime') return 'docker';
        return undefined;
      });
      mockConfig.getOptionalNumber.mockReturnValue(8080);

      const mockProcess = new EventEmitter() as any;
      mockSpawn.mockReturnValue(mockProcess);

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValue({ ok: true });

      const service = new DevModeService(mockConfig, mockLogger);
      const launchPromise = service.launchDevMode();

      await flushPromises();

      const spawnError = new Error('spawn docker ENOENT');
      mockProcess.emit('error', spawnError);

      await flushPromises();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('SonataFlow process error'),
      );

      await launchPromise;
    });

    it('should log when the child process exits with a non-zero code', async () => {
      mockConfig.getOptionalString.mockImplementation((key: string) => {
        if (key === 'orchestrator.sonataFlowService.baseUrl')
          return 'http://localhost';
        if (key === 'orchestrator.sonataFlowService.workflowsSource.localPath')
          return '/test/workflows';
        if (key === 'orchestrator.sonataFlowService.runtime') return 'docker';
        return undefined;
      });
      mockConfig.getOptionalNumber.mockReturnValue(8080);

      const mockProcess = new EventEmitter() as any;
      mockSpawn.mockReturnValue(mockProcess);

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValue({ ok: true });

      const service = new DevModeService(mockConfig, mockLogger);
      const launchPromise = service.launchDevMode();

      await flushPromises();

      mockProcess.emit('exit', 1);

      await flushPromises();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('SonataFlow process exited with code 1'),
      );

      await launchPromise;
    });
  });
});
