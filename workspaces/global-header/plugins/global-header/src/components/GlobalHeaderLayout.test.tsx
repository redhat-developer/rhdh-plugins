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

import { GlobalHeaderProvider } from '../extensions/GlobalHeaderContext';
import {
  GLOBAL_HEADER_HEIGHT_VAR,
  GlobalHeaderLayout,
} from './GlobalHeaderLayout';

jest.mock('@backstage/core-components', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

class ResizeObserverMock {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('GlobalHeaderLayout', () => {
  const originalResizeObserver = global.ResizeObserver;

  beforeAll(() => {
    global.ResizeObserver =
      ResizeObserverMock as unknown as typeof ResizeObserver;
  });

  afterAll(() => {
    global.ResizeObserver = originalResizeObserver;
  });

  afterEach(() => {
    document.documentElement.style.removeProperty(GLOBAL_HEADER_HEIGHT_VAR);
  });

  it('renders the header above page content using the legacy layout ids', () => {
    render(
      <GlobalHeaderProvider components={[]} menuItems={[]}>
        <GlobalHeaderLayout>
          <main>page content</main>
        </GlobalHeaderLayout>
      </GlobalHeaderProvider>,
    );

    expect(document.getElementById('global-header')).toBeInTheDocument();
    expect(
      document.getElementById('rhdh-above-sidebar-header-container'),
    ).toBeInTheDocument();
    expect(document.getElementById('rhdh-sidebar-layout')).toBeInTheDocument();
    expect(screen.getByText('page content')).toBeInTheDocument();
  });

  it('publishes the measured header height as a CSS custom property', () => {
    const offsetDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetHeight',
    );
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() {
        return (this as HTMLElement).id ===
          'rhdh-above-sidebar-header-container'
          ? 64
          : 0;
      },
    });

    try {
      render(
        <GlobalHeaderProvider components={[]} menuItems={[]}>
          <GlobalHeaderLayout>child</GlobalHeaderLayout>
        </GlobalHeaderProvider>,
      );

      expect(
        document.documentElement.style.getPropertyValue(
          GLOBAL_HEADER_HEIGHT_VAR,
        ),
      ).toBe('64px');
    } finally {
      if (offsetDescriptor) {
        Object.defineProperty(
          HTMLElement.prototype,
          'offsetHeight',
          offsetDescriptor,
        );
      }
    }
  });
});
