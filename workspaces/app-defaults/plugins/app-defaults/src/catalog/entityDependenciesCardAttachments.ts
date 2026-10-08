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
import apiDocsPlugin from '@backstage/plugin-api-docs/alpha';

const dependenciesTabCards = {
  attachTo: {
    id: 'entity-content:catalog/rhdh-component-dependencies',
    input: 'cards',
  },
} as const;

/**
 * Stock entity cards that belong on the Dependencies tab, not Overview.
 * Extension IDs stay `entity-card:*` so `app.extensions` config still applies.
 *
 * @internal
 */
export const entityDependenciesCatalogCardAttachments = [
  catalogPlugin
    .getExtension('entity-card:catalog/depends-on-components')
    .override(dependenciesTabCards),
  catalogPlugin
    .getExtension('entity-card:catalog/depends-on-resources')
    .override(dependenciesTabCards),
  catalogPlugin
    .getExtension('entity-card:catalog/has-subcomponents')
    .override(dependenciesTabCards),
];

/**
 * Stock api-docs entity cards that belong on the Dependencies tab, not Overview.
 * Extension IDs stay `entity-card:*` so `app.extensions` config still applies.
 *
 * @internal
 */
export const entityDependenciesApiDocsCardAttachments = [
  apiDocsPlugin
    .getExtension('entity-card:api-docs/consumed-apis')
    .override(dependenciesTabCards),
  apiDocsPlugin
    .getExtension('entity-card:api-docs/provided-apis')
    .override(dependenciesTabCards),
];
