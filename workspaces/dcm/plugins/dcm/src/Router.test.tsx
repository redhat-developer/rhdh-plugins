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
import { ErrorBoundary } from '@backstage/core-components';
import { wrapInTestApp } from '@backstage/test-utils';

/**
 * A component that throws synchronously during render to simulate an unhandled
 * React render error (e.g. unexpected null, bad type-cast, etc.).
 */
function Bomb(): JSX.Element {
  throw new Error('simulated render error');
}

describe('Router – ErrorBoundary', () => {
  it('renders the Backstage error fallback instead of crashing when a child throws', () => {
    render(
      wrapInTestApp(
        <ErrorBoundary>
          <Bomb />
        </ErrorBoundary>,
      ),
    );

    // Backstage ErrorBoundary renders a fallback that shows the error message
    // and prevents the whole page from going blank.
    const body = document.body.textContent ?? '';
    expect(body.length).toBeGreaterThan(0);

    // The error boundary fallback contains the error message — at least one
    // element with that text should be present in the DOM.
    expect(
      screen.queryAllByText(/simulated render error/i).length,
    ).toBeGreaterThan(0);
  });

  it('does not crash the test environment (fallback is rendered, not thrown)', () => {
    expect(() => {
      render(
        wrapInTestApp(
          <ErrorBoundary>
            <Bomb />
          </ErrorBoundary>,
        ),
      );
    }).not.toThrow();
  });
});
