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

import { coreExtensionData } from '@backstage/frontend-plugin-api';
import techdocsPlugin from '@backstage/plugin-techdocs/alpha';
import { CustomDocsPage } from './CustomDocsPage';

/**
 * Override of the Backstage TechDocs plugin that adds an empty state
 * when no documented entities are available.
 *
 * @public
 */
export const docsPluginOverride = techdocsPlugin.withOverrides({
  extensions: [
    techdocsPlugin.getExtension('page:techdocs').override({
      factory(originalFactory) {
        const original = originalFactory();
        const originalElement = original.get(coreExtensionData.reactElement);
        return [
          ...original,
          coreExtensionData.reactElement(
            <CustomDocsPage>{originalElement}</CustomDocsPage>,
          ),
        ];
      },
    }),
  ],
});
