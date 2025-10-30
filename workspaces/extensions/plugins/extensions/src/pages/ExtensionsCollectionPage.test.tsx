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

import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';

import { ExtensionsApi } from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import { ExtensionsCollectionPage } from './ExtensionsCollectionPage';
import { extensionsApiRef } from '../api';
import { rootRouteRef } from '../routes';
import { queryClient } from '../queryclient';

const apis = [[extensionsApiRef, {} as ExtensionsApi]] as const;

queryClient.setDefaultOptions({
  queries: { retry: false },
});

describe('ExtensionsCollectionPage', () => {
  it('should render without error', async () => {
    const { getByText } = await renderInTestApp(
      <TestApiProvider apis={apis}>
        <ExtensionsCollectionPage />
      </TestApiProvider>,
      {
        mountedRoutes: {
          '/extensions': rootRouteRef,
        },
      },
    );
    expect(getByText('Collections')).toBeInTheDocument();
  });
});
