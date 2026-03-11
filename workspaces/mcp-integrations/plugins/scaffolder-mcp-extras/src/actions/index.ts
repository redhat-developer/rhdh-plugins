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
import {
  AuthService,
  DiscoveryService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';
import { ScmIntegrations } from '@backstage/integration';
import { CatalogService } from '@backstage/plugin-catalog-node';
import type { ScaffolderClient } from '@backstage/plugin-scaffolder-common';
import { createDryRunTemplateAction } from './createDryRunTemplateAction';
import { createExecuteTemplateAction } from './createExecuteTemplateAction';
import { createFetchTemplateMetadataAction } from './createFetchTemplateMetadataAction';
import { createListScaffolderActionsAction } from './createListScaffolderActionsAction';
import { createGetScaffolderTaskLogsAction } from './createGetScaffolderTaskLogsAction';
import { createListScaffolderTasksAction } from './listScaffolderTasksAction';

export { createDryRunTemplateAction } from './createDryRunTemplateAction';
export { createExecuteTemplateAction } from './createExecuteTemplateAction';
export { createFetchTemplateMetadataAction } from './createFetchTemplateMetadataAction';
export { createGetScaffolderTaskLogsAction } from './createGetScaffolderTaskLogsAction';
export { createListScaffolderActionsAction } from './createListScaffolderActionsAction';
export { createListScaffolderTasksAction } from './listScaffolderTasksAction';

export const createScaffolderActions = (options: {
  actionsRegistry: ActionsRegistryService;
  auth: AuthService;
  catalog: CatalogService;
  discovery: DiscoveryService;
  logger: LoggerService;
  scmIntegrations: ScmIntegrations;
  scaffolderClient?: ScaffolderClient;
}) => {
  createFetchTemplateMetadataAction(options);
  createListScaffolderTasksAction({
    actionsRegistry: options.actionsRegistry,
    auth: options.auth,
    discovery: options.discovery,
    scmIntegrations: options.scmIntegrations,
  });
  createGetScaffolderTaskLogsAction({
    actionsRegistry: options.actionsRegistry,
    auth: options.auth,
    discovery: options.discovery,
  });
  if (options.scaffolderClient) {
    createListScaffolderActionsAction({
      actionsRegistry: options.actionsRegistry,
      scaffolderClient: options.scaffolderClient,
    });
    createDryRunTemplateAction({
      actionsRegistry: options.actionsRegistry,
      scaffolderClient: options.scaffolderClient,
    });
    createExecuteTemplateAction({
      actionsRegistry: options.actionsRegistry,
      scaffolderClient: options.scaffolderClient,
      auth: options.auth,
    });
  }
};
