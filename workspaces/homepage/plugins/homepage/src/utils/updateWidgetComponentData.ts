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

import type { ComponentType } from 'react';

// Matches @backstage/core-plugin-api component data storage.
const COMPONENT_DATA_KEY = '__backstage_data';

/**
 * Updates metadata attached to a widget component type so CustomHomepageGrid
 * can read translated title/description without replacing the component type
 * (which would break useElementFilter / Add widget discovery).
 */
export function updateWidgetComponentData(
  component: ComponentType,
  type: string,
  data: unknown,
): void {
  const container = (
    component as {
      [COMPONENT_DATA_KEY]?: { map: Map<string, unknown> };
    }
  )[COMPONENT_DATA_KEY];

  container?.map.set(type, data);
}
