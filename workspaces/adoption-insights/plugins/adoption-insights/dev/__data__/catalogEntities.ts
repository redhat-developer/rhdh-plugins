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
export const generateCatalogEntitiesData = (n: number): any[] => {
  const kinds = ['Component', 'API', 'System', 'Resource'];
  const names = ['devhub', 'hg-dev-hub-starter', 'netbox', 'sample-plugin'];
  const namespaces = ['default', 'internal', 'external'];

  return Array.from({ length: n }, (_, i) => ({
    plugin_id: (i + 1).toString(),
    name: names[i % names.length],
    kind: kinds[i % kinds.length],
    last_used: new Date(
      Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 10, // NOSONAR
    ).toISOString(),
    count: Math.floor(Math.random() * 3000), // NOSONAR
    namespace: namespaces[i % namespaces.length],
  }));
};

export default {
  data: generateCatalogEntitiesData(9),
};
