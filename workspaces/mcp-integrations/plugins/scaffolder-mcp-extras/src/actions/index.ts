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
import { createFetchTemplateMetadataAction } from './createFetchTemplateMetadataAction.ts';
import { createListScaffolderActionsAction } from './createListScaffolderActionsAction.ts';
import type { ScaffolderActionsListProvider } from './createListScaffolderActionsAction.ts';

export { createFetchTemplateMetadataAction } from './createFetchTemplateMetadataAction.ts';
export {
  createListScaffolderActionsAction,
  scaffolderActionsListProviderFromActionsService,
  type ScaffolderActionsListProvider,
} from './createListScaffolderActionsAction.ts';

export const createScaffolderActions = (options: {
  actionsRegistry: ActionsRegistryService;
  catalog: CatalogService;
  logger: LoggerService;
  /**
   * Optional. When provided, list-scaffolder-actions returns the real list.
   * When omitted, the tool is still registered but returns an empty list.
   * Not exported from @backstage/plugin-scaffolder-backend; pass an implementation
   * (e.g. TemplateActionRegistry from the scaffolder backend when wired by the host app).
   */
  templateActionRegistry?: ScaffolderActionsListProvider;
}) => {
  createFetchTemplateMetadataAction(options);
  createListScaffolderActionsAction({
    actionsRegistry: options.actionsRegistry,
    templateActionRegistry: options.templateActionRegistry,
  });
};
