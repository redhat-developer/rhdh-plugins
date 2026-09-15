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

import { createTranslationRef } from '@backstage/frontend-plugin-api';

/**
 * @public
 */
export const translationRef = createTranslationRef({
  id: 'plugin.app-defaults',
  messages: {
    catalog: {
      emptyState: {
        title: 'No catalog items available',
        description:
          'There are no catalog entities yet, or you do not have permission to view any. They will appear here once they are registered and you have access.',
        action: 'Register a component',
      },
    },
    catalogGraph: {
      emptyState: {
        title: 'No catalog items available',
        description:
          'There are no catalog entities yet, or you do not have permission to view any. The catalog graph will appear here once they are registered and you have access.',
        action: 'Go to catalog',
      },
    },
    scaffolder: {
      emptyState: {
        title: 'No templates available',
        description:
          'There are no software templates yet, or you do not have permission to view any. They will appear here once they are registered and you have access.',
        action: 'Register a template',
      },
    },
    apiDocs: {
      emptyState: {
        title: 'No APIs available',
        description:
          'There are no APIs yet, or you do not have permission to view any. They will appear here once they are registered and you have access.',
        action: 'Register an API',
      },
    },
    docs: {
      emptyState: {
        title: 'No documentation available',
        description:
          'There are no documented entities yet, or you do not have permission to view any. Documentation will appear here once entities with TechDocs annotations are registered and you have access.',
        action: 'Learn more',
      },
    },
  },
});
