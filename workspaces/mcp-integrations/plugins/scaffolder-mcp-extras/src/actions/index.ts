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
import { LoggerService } from '@backstage/backend-plugin-api';
import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';
import { CatalogService } from '@backstage/plugin-catalog-node';
import type { ScaffolderClient } from '@backstage/plugin-scaffolder-common';
import { createDryRunTemplateAction } from './createDryRunTemplateAction';
import { createFetchTemplateMetadataAction } from './createFetchTemplateMetadataAction';

export { createDryRunTemplateAction } from './createDryRunTemplateAction';
export { createFetchTemplateMetadataAction } from './createFetchTemplateMetadataAction';

export const createScaffolderActions = (options: {
  actionsRegistry: ActionsRegistryService;
  catalog: CatalogService;
  logger: LoggerService;
  scaffolderClient?: ScaffolderClient;
}) => {
  createFetchTemplateMetadataAction(options);
  if (options.scaffolderClient) {
    createDryRunTemplateAction({
      actionsRegistry: options.actionsRegistry,
      scaffolderClient: options.scaffolderClient,
    });
  }
};
