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

import { renderInTestApp } from '@backstage/test-utils';
import { screen } from '@testing-library/react';
import type { ReactElement } from 'react';

import { ErrorBoundary } from './ErrorBoundary';

function Boom(): ReactElement {
  throw new Error('catalog render exploded');
}

describe('ErrorBoundary', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('renders children when there is no error', async () => {
    await renderInTestApp(
      <ErrorBoundary>
        <div>catalog ok</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('catalog ok')).toBeInTheDocument();
  });

  it('shows the error message and a retry action', async () => {
    await renderInTestApp(
      <ErrorBoundary title="Failed to load AI assets" retryLabel="Retry">
        <Boom />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Failed to load AI assets')).toBeInTheDocument();
    expect(screen.getByText('catalog render exploded')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
});
