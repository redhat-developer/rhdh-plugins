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

import {
  createExtensionBlueprint,
  createExtensionDataRef,
} from '@backstage/frontend-plugin-api';
import type { Entity } from '@backstage/catalog-model';

/**
 * Describes a single filter in the AI Catalog browse sidebar.
 * Filters are data — the FilterSidebar renders a generic Select for each.
 *
 * @public
 */
export interface FilterDefinition {
  /** URL query parameter name (e.g., 'type', 'owner', 'tag'). */
  urlParam: string;
  /** Plain text label for the filter heading. Used when `labelKey` is not set. */
  label: string;
  /** Translation key resolved via boostTranslationRef. Takes precedence over `label`. */
  labelKey?: string;
  /** Derive select options from the full set of loaded entities. */
  getOptions: (entities: Entity[]) => { id: string; label: string }[];
  /** Return true if the entity matches any of the selected values. */
  matchEntity: (entity: Entity, values: string[]) => boolean;
  /** Render order in the sidebar. Lower numbers render first. */
  priority: number;
}

/**
 * Extension data ref carrying a FilterDefinition from a filter extension
 * to the AI Catalog page.
 *
 * @public
 */
export const filterDefinitionDataRef =
  createExtensionDataRef<FilterDefinition>().with({
    id: 'ai-catalog-filter.definition',
  });

/**
 * Blueprint for contributing a filter to the AI Catalog browse sidebar.
 *
 * Each filter is a plain FilterDefinition — no per-filter React component
 * needed. The FilterSidebar renders a generic Select for each definition.
 *
 * @example
 * ```
 * const myFilter = AiCatalogFilterBlueprint.make({
 *   name: 'namespace',
 *   params: {
 *     urlParam: 'ns',
 *     label: 'Namespace',
 *     getOptions: entities =>
 *       uniqueSorted(entities.map(e => e.metadata.namespace ?? 'default')),
 *     matchEntity: (entity, values) =>
 *       values.includes(entity.metadata.namespace ?? 'default'),
 *   },
 * });
 * ```
 *
 * Deployers can disable filters via app-config:
 * ```yaml
 * app:
 *   extensions:
 *     - ai-catalog-filter:boost/owner: false
 * ```
 *
 * @public
 */
export const AiCatalogFilterBlueprint = createExtensionBlueprint({
  kind: 'ai-catalog-filter',
  attachTo: { id: 'page:boost/ai-catalog', input: 'filters' },
  output: [filterDefinitionDataRef],
  dataRefs: {
    filterDefinition: filterDefinitionDataRef,
  },
  *factory(params: {
    urlParam: string;
    label: string;
    labelKey?: string;
    getOptions: (entities: Entity[]) => { id: string; label: string }[];
    matchEntity: (entity: Entity, values: string[]) => boolean;
    priority?: number;
  }) {
    yield filterDefinitionDataRef({
      urlParam: params.urlParam,
      label: params.label,
      labelKey: params.labelKey,
      getOptions: params.getOptions,
      matchEntity: params.matchEntity,
      priority: params.priority ?? 100,
    });
  },
});
