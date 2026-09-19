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
import { EntityHeaderLayoutBlueprint } from '@backstage/plugin-catalog-react/alpha';

/**
 * Custom entity header layout. With no `filter` it matches every entity, so it
 * becomes the header + tab bar for the whole catalog entity page and localizes
 * the tab titles. Extension ID: `entity-header-layout:catalog/localized`.
 */
const localizedEntityHeaderLayout = EntityHeaderLayoutBlueprint.make({
  name: 'localized',
  params: {
    loader: () =>
      import('./LocalizedEntityHeaderLayout').then(
        m => m.LocalizedEntityHeaderLayout,
      ),
  },
});

/**
 * Module for the Backstage catalog plugin that replaces the entity page header
 * layout with one that localizes the catalog tab titles through the
 * app-defaults translations.
 *
 * @public
 */
export const catalogModule = createFrontendModule({
  pluginId: 'catalog',
  extensions: [localizedEntityHeaderLayout],
});
