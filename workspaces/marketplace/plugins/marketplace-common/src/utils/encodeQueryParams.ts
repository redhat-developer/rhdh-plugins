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
import { EntityFilterQuery } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

/**
 * @public
 */
export const encodeFilterParams = (filter: EntityFilterQuery) => {
  const params = new URLSearchParams();

  Object.entries(filter).forEach(([key, value]) => {
    const values = Array.isArray(value) ? value : [value];

    values.forEach(v => {
      params.append(
        'filter',
        `${encodeURIComponent(key)}=${encodeURIComponent(v)}`,
      );
    });
  });

  return params;
};

/**
 * @public
 */
export const encodeFacetParams = (facets: string[]) => {
  const params = new URLSearchParams();
  facets.forEach(f => params.append('facet', encodeURIComponent(f)));
  return params;
};

/**
 * @public
 */
export const encodeQueryParams = (options?: {
  filter?: EntityFilterQuery;
  facets?: string[];
}) => {
  const params = new URLSearchParams();

  const { filter, facets } = options || {};

  if (filter) {
    encodeFilterParams(filter).forEach((value, key) =>
      params.append(key, value),
    );
  }

  if (facets) {
    encodeFacetParams(facets).forEach((value, key) =>
      params.append(key, value),
    );
  }

  return params.toString();
};
