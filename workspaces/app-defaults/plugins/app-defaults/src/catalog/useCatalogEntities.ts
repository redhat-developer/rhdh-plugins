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

import { useEffect, useState } from 'react';
import { useApi } from '@backstage/frontend-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import type { EntityFilterQuery } from '@backstage/catalog-client';

type State =
  | { status: 'loading' }
  | { status: 'success'; hasEntities: boolean }
  | { status: 'error'; error: Error };

export function useCatalogEntities(filter?: EntityFilterQuery): State {
  const catalogApi = useApi(catalogApiRef);
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    catalogApi
      .getEntityFacets({
        facets: ['kind'],
        filter,
      })
      .then(response => {
        setState({
          status: 'success',
          hasEntities: response.facets.kind.some(f => f.count > 0),
        });
      })
      .catch(err => setState({ status: 'error', error: err }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogApi, JSON.stringify(filter)]);

  return state;
}
