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
import { Entity } from '@backstage/catalog-model';

import YAML from 'yaml';

// listModels will list the models from an OpenAI compatible endpoint
/*
export async function listModels(
  baseUrl: string,
  access_token: string,
): Promise<ModelList> {
  const res = await fetch(`${baseUrl}/v1/models`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: access_token,
    },
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error(res.statusText);
  }

  const data = await res.json();
  return data;
}*/

/**
 * fetchCatalogEntities retrieves model catalog entities from the Model Catalog Bridge services
 * @public
 */
export async function fetchCatalogEntities(baseUrl: string): Promise<Entity[]> {
  // ToDo: Discover catalog-info endpoint?
  const res = await fetch(`${baseUrl}`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error(res.statusText);
  }

  // ToDo: Look at seeing if we can use the parser provided by the CatalogProcessorProvider package
  const data = await res
    .blob()
    .then(blob => blob.text())
    .then(yamlStr => YAML.parseAllDocuments(yamlStr))
    .then(yamlData => yamlData.map(item => item.toJS()));
  return data;
}
