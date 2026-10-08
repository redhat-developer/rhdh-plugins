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
import {
  wrapInTestApp,
  TestApiProvider,
  MockConfigApi,
} from '@backstage/test-utils';
import {
  configApiRef,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import {
  agentsApiRef,
  catalogApiRef,
  policyManagerApiRef,
  resourcesApiRef,
} from './apis';
import { Router } from './Router';

jest.mock('./hooks/useTranslation', () => {
  const mod = require('./test-utils/mockTranslations');
  return { useTranslation: mod.mockUseTranslation };
});

jest.mock('./pages/data-center/DataCenterPage', () => ({
  DataCenterPage: () => <div>DataCenterPage</div>,
}));

const apis = [
  [configApiRef, new MockConfigApi({ dcm: { auth: { enabled: false } } })],
  [discoveryApiRef, { getBaseUrl: jest.fn() }],
  [fetchApiRef, { fetch: jest.fn() }],
  [agentsApiRef, {}],
  [catalogApiRef, {}],
  [policyManagerApiRef, {}],
  [resourcesApiRef, {}],
] as const;

function renderRouter(routeEntries?: string[]) {
  return render(
    wrapInTestApp(
      <TestApiProvider apis={[...apis]}>
        <Router />
      </TestApiProvider>,
      routeEntries ? { routeEntries } : undefined,
    ),
  );
}

describe('Router', () => {
  it('renders DataCenterPage on the default route', () => {
    renderRouter();
    expect(screen.getByText('DataCenterPage')).toBeInTheDocument();
  });

  it('renders DataCenterPage on a known tab path', () => {
    renderRouter(['/policies']);
    expect(screen.getByText('DataCenterPage')).toBeInTheDocument();
  });

  it('renders a 404 ErrorPage for unknown paths', () => {
    renderRouter(['/nonexistent']);
    expect(screen.queryByText('DataCenterPage')).not.toBeInTheDocument();
    expect(screen.getByTestId('error')).toBeInTheDocument();
    expect(screen.getByTestId('error')).toHaveTextContent(/404/);
    expect(screen.getByTestId('error')).toHaveTextContent(/Page not found/);
  });
});
