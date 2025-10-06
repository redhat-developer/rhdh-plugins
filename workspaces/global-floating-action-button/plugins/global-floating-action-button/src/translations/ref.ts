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

export const globalFloatingActionButtonMessages = {
  fab: {
    create: {
      label: 'Create',
      tooltip: 'Create entity',
    },
    docs: {
      label: 'Docs',
      tooltip: 'Documentation',
    },
    apis: {
      label: 'APIs',
      tooltip: 'API Documentation',
    },
    github: {
      label: 'GitHub',
      tooltip: 'GitHub Repository',
    },
    bulkImport: {
      label: 'Bulk Import',
      tooltip: 'Register multiple repositories in bulk',
    },
    quay: {
      label: 'Quay',
      tooltip: 'Quay Container Registry',
    },
    menu: {
      tooltip: 'Menu',
    },
  },
};

/**
 * Translation reference for global floating action button plugin
 * @public
 */
export const globalFloatingActionButtonTranslationRef = createTranslationRef({
  id: 'plugin.global-floating-action-button',
  messages: globalFloatingActionButtonMessages,
});
