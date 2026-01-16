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

import type {
  AuditorService,
  DiscoveryService,
  HttpAuthService,
  LoggerService,
  PermissionsService,
  SchedulerService,
  UrlReaderService,
  UserInfoService,
} from '@backstage/backend-plugin-api';
import type { CatalogApi } from '@backstage/catalog-client';
import type { Config } from '@backstage/config';

import express from 'express';

import { WorkflowLogsProvidersRegistry } from '../providers/WorkflowLogsProvidersRegistry';
import { DevModeService } from '../service/DevModeService';
import { createBackendRouter } from '../service/router';

export interface RouterOptions {
  config: Config;
  logger: LoggerService;
  auditor: AuditorService;
  discovery: DiscoveryService;
  catalogApi: CatalogApi;
  urlReader: UrlReaderService;
  scheduler: SchedulerService;
  permissions: PermissionsService;
  httpAuth: HttpAuthService;
  userInfo: UserInfoService;
  workflowLogsProvidersRegistry: WorkflowLogsProvidersRegistry;
}

export async function createRouter(
  args: RouterOptions,
): Promise<express.Router> {
  const autoStartDevMode =
    args.config.getOptionalBoolean(
      'orchestrator.sonataFlowService.autoStart',
    ) ?? false;

  if (autoStartDevMode) {
    const devModeService = new DevModeService(args.config, args.logger);

    const isSonataFlowUp = await devModeService.launchDevMode();

    if (!isSonataFlowUp) {
      args.logger.error('SonataFlow is not up. Check your configuration.');
    }
  }

  return await createBackendRouter({
    config: args.config,
    logger: args.logger,
    auditor: args.auditor,
    discovery: args.discovery,
    catalogApi: args.catalogApi,
    urlReader: args.urlReader,
    scheduler: args.scheduler,
    permissions: args.permissions,
    httpAuth: args.httpAuth,
    userInfo: args.userInfo,
    workflowLogsProvidersRegistry: args.workflowLogsProvidersRegistry,
  });
}
