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

/**
 * RHDH app module for the new frontend system.
 *
 * @packageDocumentation
 */

import { createFrontendFeatureLoader } from '@backstage/frontend-plugin-api';

import { appDefaultsModule } from './appDefaultsModule';
import { apiDocsPluginOverride } from './api-docs/apiDocsPluginOverride';
import { catalogPluginOverride } from './catalog/catalogPluginOverride';
import { catalogGraphPluginOverride } from './catalog-graph/catalogGraphPluginOverride';
import { docsPluginOverride } from './docs/docsPluginOverride';
import { scaffolderPluginOverride } from './scaffolder/scaffolderPluginOverride';

export { appDefaultsModule };

export { apiDocsPluginOverride };

export { catalogGraphPluginOverride };

export { catalogPluginOverride };

export { docsPluginOverride };

export { scaffolderPluginOverride };

/**
 * Feature loader that registers the RHDH app defaults module and all
 * plugin overrides (catalog, catalog graph, scaffolder, API docs, TechDocs)
 * that add empty-state pages when no entities are available.
 *
 * @public
 */
export default createFrontendFeatureLoader({
  loader() {
    return [
      appDefaultsModule,
      catalogPluginOverride,
      catalogGraphPluginOverride,
      scaffolderPluginOverride,
      apiDocsPluginOverride,
      docsPluginOverride,
    ];
  },
});
