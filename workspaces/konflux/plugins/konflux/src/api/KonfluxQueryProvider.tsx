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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo } from 'react';

let queryClient: QueryClient | undefined;

function getQueryClient() {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30 * 1000, // 30 seconds
          gcTime: 5 * 60 * 1000, // 5 minutes
          retry: 1,
          // TODO: check if the bellow options are really needed
          refetchOnWindowFocus: true, // refetch when window regains focus
          refetchOnReconnect: true, // refetch when network reconnects
        },
      },
    });
  }
  return queryClient;
}

/**
 * uses a singleton QueryClient to ensure cache is shared across all konflux components.
 * @public
 */
export function KonfluxQueryProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const client = useMemo(() => getQueryClient(), []);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
