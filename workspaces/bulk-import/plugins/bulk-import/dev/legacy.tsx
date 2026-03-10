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

import { configApiRef } from '@backstage/core-plugin-api';
import { createDevApp } from '@backstage/dev-utils';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { permissionApiRef } from '@backstage/plugin-permission-react';
import { TestApiProvider } from '@backstage/test-utils';

import { getAllThemes } from '@red-hat-developer-hub/backstage-plugin-theme';

import { BulkImportIcon } from '../src/components/BulkImportSidebarItem';
import { BulkImportPage, bulkImportPlugin } from '../src/plugin';
import { bulkImportTranslations } from '../src/translations';
import {
  bulkImportApiRef,
  mockBulkImportApi,
  mockCatalogApi,
  mockConfigApi,
  mockPermissionApi,
} from './mocks';

createDevApp()
  .registerPlugin(bulkImportPlugin)
  .addTranslationResource(bulkImportTranslations)
  .setAvailableLanguages(['en', 'de', 'es', 'fr', 'it', 'ja'])
  .setDefaultLanguage('en')
  .addThemes(getAllThemes())
  .addPage({
    element: (
      <TestApiProvider
        apis={[
          [permissionApiRef, mockPermissionApi],
          [catalogApiRef, mockCatalogApi],
          [bulkImportApiRef, mockBulkImportApi],
          [configApiRef, mockConfigApi],
        ]}
      >
        <BulkImportPage />
      </TestApiProvider>
    ),
    title: 'Bulk import',
    path: '/bulk-import',
    icon: BulkImportIcon,
  })
  .render();
