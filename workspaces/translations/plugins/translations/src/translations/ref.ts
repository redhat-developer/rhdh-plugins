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
import { createTranslationRef } from '@backstage/core-plugin-api/alpha';

/**
 * @alpha
 */
export const translationsMessages = {
  page: {
    title: 'Translations',
    subtitle: 'Manage and view loaded translations',
  },
  table: {
    title: 'Loaded translations ({{count}})',
    headers: {
      refId: 'Ref ID',
      key: 'Key',
    },
    options: {
      pageSize: 'Items per page',
      pageSizeOptions: 'Show {{count}} items',
    },
  },
  export: {
    title: 'Translations',
    downloadButton: 'Download default translations (English)',
    filename: 'translations-{{timestamp}}.json',
  },
  common: {
    loading: 'Loading...',
    error: 'An error occurred',
    noData: 'No data available',
    refresh: 'Refresh',
  },
  language: {
    displayFormat: '{{displayName}} ({{code}})',
  },
};
/**
 * @alpha
 */
export const translationsPluginTranslationRef = createTranslationRef({
  id: 'plugin.translations',
  messages: translationsMessages,
});
