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

import type { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import { MarketplaceApi } from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';

import { marketplaceApiRef } from '../api';
import { rootRouteRef } from '../routes';
import { queryClient } from '../queryclient';

import { MarketplaceCatalogGrid } from './MarketplaceCatalogGrid';

const apis = [[marketplaceApiRef, {} as MarketplaceApi]] as const;

queryClient.setDefaultOptions({
  queries: { retry: false },
});

const Providers = ({ children }: PropsWithChildren<{}>) => (
  <TestApiProvider apis={apis}>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </TestApiProvider>
);

describe('MarketplaceCatalogGrid', () => {
  it('should render without error', async () => {
    await renderInTestApp(
      <Providers>
        <MarketplaceCatalogGrid />
      </Providers>,
      {
        mountedRoutes: {
          '/marketplace': rootRouteRef,
        },
      },
    );
  });
});
