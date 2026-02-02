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
import { mockUseTranslation } from '../../test-utils/mockTranslations';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

import { Dashboard } from './Dashboard';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import {
  mockApis,
  registerMswTestHooks,
  renderInTestApp,
  TestApiProvider,
} from '@backstage/test-utils';
import { discoveryApiRef, fetchApiRef } from '@backstage/core-plugin-api';

describe('Dashboard component', () => {
  const server = setupServer();
  // Enable sane handlers for network requests
  registerMswTestHooks(server);

  // setup mock response
  beforeEach(() => {
    server.use(
      rest.get('/*', (_, res, ctx) => res(ctx.status(200), ctx.json({}))),
    );
  });

  it('should render', async () => {
    const discoveryApiMock = mockApis.discovery({
      baseUrl: 'http://localhost:1234',
    });
    const fetchApiMock = {
      fetch: jest.fn().mockReturnValue(new Promise(() => {})),
    };

    await renderInTestApp(
      <TestApiProvider
        apis={[
          [fetchApiRef, fetchApiMock],
          [discoveryApiRef, discoveryApiMock],
        ]}
      >
        <Dashboard />
      </TestApiProvider>,
    );
    expect(screen.getByText('Migration Hub')).toBeInTheDocument();
  });
});
