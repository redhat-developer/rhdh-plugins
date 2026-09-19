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

import catalogPlugin from '@backstage/plugin-catalog/alpha';

/**
 * RHDH overview column defaults without `app.extensions` config.
 *
 * @internal
 */
export const entityOverviewCatalogCardDefaults = [
  catalogPlugin.getExtension('entity-card:catalog/about').override({
    factory(originalFactory) {
      return originalFactory({ params: { type: 'info' } });
    },
  }),
  catalogPlugin.getExtension('entity-card:catalog/links').override({
    factory(originalFactory) {
      return originalFactory({ params: { type: 'info' } });
    },
  }),
];
