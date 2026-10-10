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

import { NotFoundErrorPage } from '@backstage/frontend-plugin-api';
import { SwappableComponentBlueprint } from '@backstage/plugin-app-react';

/**
 * Replaces the `core-not-found-error-page` swappable component of
 * `@backstage/plugin-app` with a custom RHDH not-found page that uses
 * the same visual language as the catalog empty state and supports
 * translations.
 *
 * @public
 */
export const notFoundExtension = SwappableComponentBlueprint.make({
  name: 'core-not-found-error-page',
  params: define =>
    define({
      component: NotFoundErrorPage,
      loader: () =>
        import('./CustomNotFoundPage').then(m => m.CustomNotFoundPage),
    }),
});
