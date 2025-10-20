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

import fs from 'fs-extra';

import {
  DEFAULT_SONATAFLOW_BASE_URL,
  DEFAULT_SONATAFLOW_CONTAINER_IMAGE,
  DEFAULT_SONATAFLOW_PERSISTENCE_PATH,
  DEFAULT_WORKFLOWS_PATH,
} from '@redhat/backstage-plugin-orchestrator-common';

import { spawn } from 'child_process';
import { join, resolve } from 'path';

import { GitService } from './GitService';
import { executeWithRetry } from './Helper';

const SONATA_FLOW_RESOURCES_PATH =
  '/home/kogito/serverless-workflow-project/src/main/resources';
const DEFAULT_SONATAFLOW_RUNTIME = 'docker';

interface LauncherCommand {
  command: string;
  args: string[];
}

interface DevModeConnectionConfig {
  host: string;
  port?: number;
  containerImage: string;
  resourcesPath: string;
  persistencePath?: string;
  repoUrl?: string;
  notificationsBearerToken?: string;
  notificationsUrl?: string;
  runtime: string;
}

export class DevModeService {
  private readonly connection: DevModeConnectionConfig;
  private readonly gitService;

  constructor(
    config: Config,
    private readonly logger: LoggerService,
  ) {
    this.connection = this.extractConnectionConfig(config);
    this.gitService = new GitService(logger, config);
  }

  public get devModeUrl(): string {
    if (!this.connection.port) {
      return this.connection.host;
    }
    return `${this.connection.host}:${this.connection.port}`;
  }

  public async launchDevMode(): Promise<boolean> {
    await this.loadDevWorkflows();

    const isAlreadyUp = await this.isSonataFlowUp(false, this.devModeUrl);
    if (isAlreadyUp) {
      return true;
    }

    this.launchSonataFlow();

    return await this.isSonataFlowUp(true, this.devModeUrl);
  }

  private async isSonataFlowUp(
    withRetry: boolean,
    endpoint: string,
  ): Promise<boolean> {
    const healthUrl = `${endpoint}/q/health`;
    this.logger.info(`Checking SonataFlow health at: ${healthUrl}`);

    try {
      const response = await executeWithRetry(
        () => fetch(healthUrl),
        withRetry ? 15 : 1,
      );
      if (response.ok) {
        this.logger.info('SonataFlow is up and running');
        return true;
      }
    } catch (e) {
      this.logger.error(`Error when checking SonataFlow health: ${e}`);
    }
    return false;
  }

  private launchSonataFlow(): void {
    const launcherCmd = this.createLauncherCommand();

    this.logger.info(
      `Auto starting SonataFlow through: ${
        launcherCmd.command
      } ${launcherCmd.args.join(' ')}`,
    );

    const process = spawn(launcherCmd.command, launcherCmd.args, {
      shell: false,
    });

    process.on('close', code => {
      this.logger.info(`SonataFlow process exited with code ${code}`);
    });

    process.on('exit', code => {
      this.logger.info(`SonataFlow process exited with code ${code}`);
    });

    process.on('error', error => {
      this.logger.error(`SonataFlow process error: ${error}`);
    });
  }

  private createLauncherCommand(): LauncherCommand {
    const resourcesAbsPath = resolve(
      join(this.connection.resourcesPath, DEFAULT_WORKFLOWS_PATH),
    );

    const launcherArgs = [
      'run',
      '--name',
      'backstage-internal-sonataflow',
      ...(this.connection.runtime === 'podman'
        ? ['--replace']
        : ['--add-host', 'host.docker.internal:host-gateway']),
    ];

    // TODO: pass automatically a set of env variables from configuration, i.e. all config props with names starting at ENV_:
    //   config: orchestrator.sonataFlowService.ENV_foo

    launcherArgs.push('-e', `QUARKUS_HTTP_PORT=${this.connection.port}`);

    launcherArgs.push('-p', `${this.connection.port}:${this.connection.port}`);
    launcherArgs.push('-e', `KOGITO_SERVICE_URL=${this.devModeUrl}`);
    launcherArgs.push(
      '-v',
      `${resourcesAbsPath}:${SONATA_FLOW_RESOURCES_PATH}:Z`,
    );
    if (this.connection?.persistencePath) {
      // if persistence is enabled, mount the volume and persist data across restarts
      const persistenceAbsPath = resolve(this.connection.persistencePath);
      this.logger.info(
        `Persistence is enabled, mounting ${persistenceAbsPath} as volume to persist data`,
      );
      if (!fs.existsSync(persistenceAbsPath)) {
        fs.mkdirSync(persistenceAbsPath, { recursive: true });
      }
      launcherArgs.push(
        '-v',
        `${persistenceAbsPath}:${DEFAULT_SONATAFLOW_PERSISTENCE_PATH}:Z`,
      );
    }
    launcherArgs.push('-e', 'KOGITO.CODEGEN.PROCESS.FAILONERROR=false');
    launcherArgs.push(
      '-e',
      `QUARKUS_EMBEDDED_POSTGRESQL_DATA_DIR=${DEFAULT_SONATAFLOW_PERSISTENCE_PATH}`,
    );
    launcherArgs.push(
      '-e',
      `NOTIFICATIONS_BEARER_TOKEN=${this.connection.notificationsBearerToken}`,
    );
    launcherArgs.push(
      '-e',
      `BACKSTAGE_NOTIFICATIONS_URL=${this.connection.notificationsUrl}`,
    );

    launcherArgs.push(this.connection.containerImage);

    return {
      command: this.connection.runtime,
      args: launcherArgs,
    };
  }

  private extractConnectionConfig(config: Config): DevModeConnectionConfig {
    const host =
      config.getOptionalString('orchestrator.sonataFlowService.baseUrl') ??
      DEFAULT_SONATAFLOW_BASE_URL;
    const port = config.getOptionalNumber(
      'orchestrator.sonataFlowService.port',
    );

    const resourcesPath =
      config.getOptionalString(
        'orchestrator.sonataFlowService.workflowsSource.localPath',
      ) ?? '';

    const containerImage =
      config.getOptionalString('orchestrator.sonataFlowService.container') ??
      DEFAULT_SONATAFLOW_CONTAINER_IMAGE;

    const persistencePath =
      config.getOptionalString(
        'orchestrator.sonataFlowService.persistence.path',
      ) ?? '';

    const repoUrl =
      config.getOptionalString(
        'orchestrator.sonataFlowService.workflowsSource.gitRepositoryUrl',
      ) ?? '';

    const notificationsBearerToken =
      config.getOptionalString(
        'orchestrator.sonataFlowService.notificationsBearerToken',
      ) ?? '';

    const notificationsUrl =
      config.getOptionalString(
        'orchestrator.sonataFlowService.notificationsUrl',
      ) ?? '';

    const runtime =
      config.getOptionalString('orchestrator.sonataFlowService.runtime') ??
      DEFAULT_SONATAFLOW_RUNTIME;

    return {
      runtime,
      host,
      port,
      containerImage,
      resourcesPath,
      persistencePath,
      repoUrl,
      notificationsBearerToken,
      notificationsUrl,
    };
  }

  public async loadDevWorkflows() {
    if (!this.connection?.repoUrl || !this.connection?.resourcesPath) {
      this.logger.info(
        'No Git repository or path configured. Skipping dev workflows loading.',
      );
      return;
    }

    this.logger.info(`Loading dev workflows from ${this.connection.repoUrl}`);
    const localPath = this.connection.resourcesPath;
    if (await fs.pathExists(localPath)) {
      this.logger.info(`Path ${localPath} already exists. Skipping clone.`);
      return;
    }

    await this.gitService.clone(this.connection.repoUrl, localPath);
    // Remove .git to avoid any submodule issues
    await fs.rm(join(localPath, '.git'), { recursive: true, force: true });
  }
}
