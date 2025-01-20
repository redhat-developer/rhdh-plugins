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

import React from 'react';
import { ExampleComponent } from './ExampleComponent';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import {
  registerMswTestHooks,
  renderInTestApp,
  TestApiProvider,
} from '@backstage/test-utils';
import { searchApiRef } from '@backstage/plugin-search-react';

describe('ExampleComponent', () => {
  const server = setupServer();
  // Enable sane handlers for network requests
  registerMswTestHooks(server);

  // Mock the search API response
  const mockSearchApi = {
    query: jest.fn().mockResolvedValue({
      results: [
        {
          type: 'software-catalog',
          document: {
            title: 'Example Result',
            location: '/catalog/default/component/example',
          },
        },
      ],
    }),
  };

  // setup mock response
  beforeEach(() => {
    server.use(
      rest.get('/*', (_, res, ctx) => res(ctx.status(200), ctx.json({}))),
    );
  });

  it('should render', async () => {
    await renderInTestApp(
      <TestApiProvider apis={[[searchApiRef, mockSearchApi]]}>
        <ExampleComponent />
      </TestApiProvider>,
    );
    expect(screen.getByText('Global Header Example')).toBeInTheDocument();
  });
});
