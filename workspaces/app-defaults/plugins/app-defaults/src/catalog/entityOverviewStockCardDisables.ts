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
 * Hide NFS default Overview cards that belong on other legacy RHDH tabs.
 *
 * @internal
 */
export const entityOverviewStockCardDisables = [
  catalogPlugin
    .getExtension('entity-card:catalog/depends-on-components')
    .override({ disabled: true }),
  catalogPlugin
    .getExtension('entity-card:catalog/depends-on-resources')
    .override({ disabled: true }),
  catalogPlugin
    .getExtension('entity-card:catalog/has-subcomponents')
    .override({ disabled: true }),
  catalogPlugin
    .getExtension('entity-card:catalog/has-subdomains')
    .override({ disabled: true }),
  catalogPlugin
    .getExtension('entity-card:catalog/labels')
    .override({ disabled: true }),
];
