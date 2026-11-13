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

import { SidebarItem } from '@backstage/core-components';
import { useApiHolder, useRouteRef } from '@backstage/frontend-plugin-api';
import { SidebarSearchModal } from '@backstage/plugin-search';
import searchPlugin from '@backstage/plugin-search/alpha';
import { searchApiRef } from '@backstage/plugin-search-react';
import SearchIcon from '@mui/icons-material/Search';

/**
 * Renders the search modal sidebar entry, but only when the search API is
 * available. Without the search plugin installed the entry is skipped instead
 * of crashing.
 *
 * `SidebarSearchModal` resolves the search page via this package's
 * `routeRef{id=search}`. Under module federation the remote often bundles its
 * own `@backstage/plugin-search`, so that routeRef is unbound even when the
 * host app registered `page:search` — clicking then throws
 * "No path for routeRef". When the route is missing, fall back to a plain
 * sidebar link to the canonical `/search` path.
 *
 * @internal
 */
export function SidebarSearch() {
  const apis = useApiHolder();
  const searchRoute = useRouteRef(searchPlugin.routes.root);
  if (!apis.get(searchApiRef)) {
    return null;
  }
  if (!searchRoute) {
    return <SidebarItem icon={SearchIcon} to="/search" text="Search" />;
  }
  return <SidebarSearchModal />;
}
