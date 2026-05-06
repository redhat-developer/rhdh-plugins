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

import { useApi } from '@backstage/core-plugin-api';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { lightspeedApiRef } from '../api/api';

/**
 * Hook to fetch conversation IDs associated with notebook sessions for filtering
 * Works even when notebooks feature is disabled
 */
export const useNotebookConversationIds = (): UseQueryResult<
  string[],
  Error
> => {
  const lightspeedApi = useApi(lightspeedApiRef);

  return useQuery({
    queryKey: ['notebookConversationIds'],
    queryFn: async () => {
      return await lightspeedApi.getNotebookConversationIds();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
};
