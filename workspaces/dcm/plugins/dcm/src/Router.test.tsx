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

import { render, screen } from '@testing-library/react';
import { wrapInTestApp, TestApiProvider } from '@backstage/test-utils';
import {
  configApiRef,
  discoveryApiRef,
  fetchApiRef,
  type ConfigApi,
} from '@backstage/core-plugin-api';
import {
  agentsApiRef,
  catalogApiRef,
  policyManagerApiRef,
  resourcesApiRef,
} from './apis';
import { Router } from './Router';

jest.mock('./pages/data-center/DataCenterPage', () => ({
  DataCenterPage: () => <div>DataCenterPage</div>,
}));

describe('Router', () => {
  it('renders DataCenterPage on the default route', () => {
    render(
      wrapInTestApp(
        <TestApiProvider
          apis={[
            [
              configApiRef,
              {
                getOptionalBoolean: jest.fn().mockReturnValue(false),
              } as unknown as ConfigApi,
            ],
            [discoveryApiRef, { getBaseUrl: jest.fn() }],
            [fetchApiRef, { fetch: jest.fn() }],
            [agentsApiRef, {}],
            [catalogApiRef, {}],
            [policyManagerApiRef, {}],
            [resourcesApiRef, {}],
          ]}
        >
          <Router />
        </TestApiProvider>,
      ),
    );
    expect(screen.getByText('DataCenterPage')).toBeInTheDocument();
  });
});
