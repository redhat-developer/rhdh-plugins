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

import { useApiHolder } from '@backstage/frontend-plugin-api';
import { SidebarSearchModal } from '@backstage/plugin-search';
import { searchApiRef } from '@backstage/plugin-search-react';

/**
 * Renders the search modal sidebar entry, but only when the search API is
 * available. Without the search plugin installed the entry is skipped instead
 * of crashing.
 *
 * @internal
 */
export function SidebarSearch() {
  const apis = useApiHolder();
  if (!apis.get(searchApiRef)) {
    return null;
  }
  return <SidebarSearchModal />;
}
