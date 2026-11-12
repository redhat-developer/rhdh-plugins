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
  createExtensionInput,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import { RiSparkling2Fill } from '@remixicon/react';
import { SidebarItemBlueprint } from '@red-hat-developer-hub/backstage-plugin-app-react';

import { filterDefinitionDataRef } from '../blueprints/AiCatalogFilterBlueprint';
import { rootRouteRef } from '../routes';

const AiCatalogIcon = () => <RiSparkling2Fill size="1em" />;

export const aiCatalogPage = PageBlueprint.makeWithOverrides({
  name: 'ai-catalog',
  inputs: {
    filters: createExtensionInput([filterDefinitionDataRef]),
  },
  factory(originalFactory, { inputs }) {
    const filterDefs = inputs.filters
      .map(f => f.get(filterDefinitionDataRef))
      .sort((a, b) => a.priority - b.priority);

    const registeredParams = new Set<string>();
    for (const def of filterDefs) {
      if (registeredParams.has(def.urlParam)) {
        throw new Error(
          `Duplicate filter urlParam '${def.urlParam}'. Each filter must use a unique URL parameter.`,
        );
      }
      registeredParams.add(def.urlParam);
    }

    return originalFactory({
      path: '/ai-catalog',
      routeRef: rootRouteRef,
      title: 'AI Catalog',
      icon: <AiCatalogIcon />,
      noHeader: true,
      loader: () =>
        import('../pages/AiCatalogPage').then(m => (
          <m.AiCatalogPage filters={filterDefs} />
        )),
    });
  },
});

export const aiCatalogSidebarItem = SidebarItemBlueprint.make({
  name: 'ai-catalog',
  params: {
    title: 'AI Catalog',
    icon: AiCatalogIcon,
    to: '/ai-catalog',
  },
});
