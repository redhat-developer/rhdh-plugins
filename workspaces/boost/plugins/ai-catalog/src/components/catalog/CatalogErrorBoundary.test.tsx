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
import { fireEvent, screen } from '@testing-library/react';
import type { ReactElement } from 'react';

import { CatalogErrorBoundary } from './CatalogErrorBoundary';

function Boom(): ReactElement {
  throw new Error('catalog render exploded');
}

let shouldThrow = true;

function BoomUntilRetry(): ReactElement {
  if (shouldThrow) {
    throw new Error('catalog render exploded');
  }
  return <div>catalog recovered</div>;
}

describe('CatalogErrorBoundary', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    shouldThrow = true;
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('renders children when there is no error', async () => {
    await renderInTestApp(
      <CatalogErrorBoundary>
        <div>catalog ok</div>
      </CatalogErrorBoundary>,
    );
    expect(screen.getByText('catalog ok')).toBeInTheDocument();
  });

  it('shows the error message and a retry action', async () => {
    await renderInTestApp(
      <CatalogErrorBoundary title="Failed to load AI assets" retryLabel="Retry">
        <Boom />
      </CatalogErrorBoundary>,
    );

    expect(screen.getByText('Failed to load AI assets')).toBeInTheDocument();
    expect(screen.getByText('catalog render exploded')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('renders children again after Retry', async () => {
    await renderInTestApp(
      <CatalogErrorBoundary title="Failed to load AI assets" retryLabel="Retry">
        <BoomUntilRetry />
      </CatalogErrorBoundary>,
    );

    expect(screen.getByText('catalog render exploded')).toBeInTheDocument();
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(screen.getByText('catalog recovered')).toBeInTheDocument();
    expect(screen.queryByText('catalog render exploded')).toBeNull();
  });
});
