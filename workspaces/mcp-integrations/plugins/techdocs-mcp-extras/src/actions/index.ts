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
import { LoggerService, DiscoveryService } from '@backstage/backend-plugin-api';
import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';
import { CatalogService } from '@backstage/plugin-catalog-node';
import type { Config } from '@backstage/config';
import { createFetchTechDocsAction } from './createFetchTechDocsAction.ts';
import { createAnalyzeTechDocsCoverageAction } from './createAnalyzeTechDocsCoverageAction.ts';
import { createRetrieveTechDocsContentAction } from './createRetrieveTechDocsContentAction.ts';

export { createFetchTechDocsAction } from './createFetchTechDocsAction.ts';
export { createAnalyzeTechDocsCoverageAction } from './createAnalyzeTechDocsCoverageAction.ts';
export { createRetrieveTechDocsContentAction } from './createRetrieveTechDocsContentAction.ts';

export const createTechDocsActions = (options: {
  actionsRegistry: ActionsRegistryService;
  catalog: CatalogService;
  auth: any;
  logger: LoggerService;
  config: Config;
  discovery: DiscoveryService;
}) => {
  createFetchTechDocsAction(options);
  createAnalyzeTechDocsCoverageAction(options);
  createRetrieveTechDocsContentAction(options);
};
