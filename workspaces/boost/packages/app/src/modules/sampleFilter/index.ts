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

import { createFrontendModule } from '@backstage/frontend-plugin-api';
import type { Entity } from '@backstage/catalog-model';

import { AiCatalogFilterBlueprint } from '@red-hat-developer-hub/backstage-plugin-boost';

function uniqueSorted(
  items: (string | undefined)[],
): { id: string; label: string }[] {
  const set = new Set<string>();
  for (const item of items) {
    if (item) set.add(item);
  }
  return Array.from(set)
    .sort((a, b) => a.localeCompare(b))
    .map(v => ({ id: v, label: v }));
}

/**
 * Example module demonstrating how a third-party plugin contributes
 * a custom filter to the AI Catalog browse page.
 *
 * Lifecycle is not a built-in filter — it's added here via the
 * extension system to show how deployers and third-party plugins
 * can extend the filter sidebar.
 */
const lifecycleFilterExt = AiCatalogFilterBlueprint.make({
  name: 'lifecycle',
  params: {
    urlParam: 'lifecycle',
    label: 'Lifecycle',
    getOptions: (entities: Entity[]) =>
      uniqueSorted(
        entities.map(
          e =>
            (e.spec as Record<string, unknown> | undefined)?.lifecycle as
              | string
              | undefined,
        ),
      ),
    matchEntity: (entity: Entity, values: string[]) => {
      const lifecycle = (entity.spec as Record<string, unknown> | undefined)
        ?.lifecycle as string | undefined;
      return (
        lifecycle !== undefined &&
        values.some(v => v.toLowerCase() === lifecycle.toLowerCase())
      );
    },
    priority: 500,
  },
});

export const sampleFilterModule = createFrontendModule({
  pluginId: 'boost',
  extensions: [lifecycleFilterExt],
});
