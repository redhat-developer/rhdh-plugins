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
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { discoveryApiRef } from '@backstage/core-plugin-api';
import { Route, Routes } from 'react-router-dom';
import { DownloadStaticPublicFile } from './DownloadStaticPublicFile';

const MOCK_BASE_URL = 'http://localhost:7007/api/x2a';

describe('DownloadStaticPublicFile', () => {
  const discoveryApi = {
    getBaseUrl: jest.fn().mockResolvedValue(MOCK_BASE_URL),
  };

  const origLocation = globalThis.location;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(globalThis, 'location', {
      writable: true,
      value: { ...origLocation, href: '' },
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'location', {
      writable: true,
      value: origLocation,
    });
  });

  const renderComponent = (entry: string) =>
    renderInTestApp(
      <TestApiProvider apis={[[discoveryApiRef, discoveryApi]]}>
        <Routes>
          <Route path="/download/*" element={<DownloadStaticPublicFile />} />
        </Routes>
      </TestApiProvider>,
      { routeEntries: [entry] },
    );

  it('redirects to the backend static URL for the given file', async () => {
    await renderComponent('/download/sample-projects.csv');

    expect(discoveryApi.getBaseUrl).toHaveBeenCalledWith('x2a');
    expect(globalThis.location.href).toBe(
      `${MOCK_BASE_URL}/static/sample-projects.csv`,
    );
  });

  it('handles nested file paths', async () => {
    await renderComponent('/download/subdir/file.txt');

    expect(globalThis.location.href).toBe(
      `${MOCK_BASE_URL}/static/subdir/file.txt`,
    );
  });

  it('does not redirect when no file path is provided', async () => {
    await renderComponent('/download/');

    expect(globalThis.location.href).toBe('');
  });

  it('renders nothing', async () => {
    const { container } = await renderComponent(
      '/download/sample-projects.csv',
    );

    expect(container.innerHTML).toBe('');
  });
});
