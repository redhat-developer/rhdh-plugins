/*
 * Copyright The Backstage Authors
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

import { useQuery } from '@tanstack/react-query';

import { GetEntitiesRequest } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { useMarketplaceApi } from './useMarketplaceApi';

export const useCollections = (request: GetEntitiesRequest) => {
  const marketplaceApi = useMarketplaceApi();
  return useQuery({
    queryKey: ['marketplaceApi', 'getCollections', request],
    queryFn: () => marketplaceApi.getCollections(request),
  });
};
