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
import { ModelCatalog } from '@redhat-ai-dev/model-catalog-types';

/**
 * ModelCatalogKeys is the object used by the bridge to return the list of keys corresponding to each model catalog entry in the bridge
 * @public
 */
export interface ModelCatalogKeys {
  uris: string[];
}

/**
 * fetchModelCatalogKeys retrieves the keys for each of the model catalog entries in the model catalog bridge service
 * @public
 */
export async function fetchModelCatalogKeys(
  baseUrl: string,
): Promise<string[]> {
  // ToDo: Discover catalog-info endpoint?
  const res = await fetch(`${baseUrl}/list`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error(res.statusText);
  }

  const modelCatalogKeys: ModelCatalogKeys = await res.json();
  return modelCatalogKeys.uris;
}

/**
 * fetchModelCatalogFromKey fetches a model catalog JSON object from the bridge based on a given key
 * @public
 */
export async function fetchModelCatalogFromKey(
  baseUrl: string,
  modelCatalogKey: string,
): Promise<ModelCatalog> {
  const res = await fetch(`${baseUrl}${modelCatalogKey}`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error(res.statusText);
  }

  const modelCatalog: ModelCatalog = await res.json();
  return modelCatalog;
}
