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
import { GlobalHeader } from './GlobalHeader';
import type { GlobalHeaderComponentData } from '../types';

jest.mock('@backstage/core-components', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe('GlobalHeader', () => {
  it('renders all components from context', () => {
    const components: GlobalHeaderComponentData[] = [
      { component: () => <span>Logo</span>, priority: 200 },
      { component: () => <span>Search</span>, priority: 100 },
    ];

    render(
      <GlobalHeaderProvider components={components} menuItems={[]}>
        <GlobalHeader />
      </GlobalHeaderProvider>,
    );

    expect(screen.getByText('Logo')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('renders an empty toolbar when no components are provided', () => {
    render(
      <GlobalHeaderProvider components={[]} menuItems={[]}>
        <GlobalHeader />
      </GlobalHeaderProvider>,
    );

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(
      screen.getByRole('navigation').querySelector('.MuiToolbar-root'),
    ).toBeEmptyDOMElement();
  });

  it('renders the nav element with id="global-header"', () => {
    render(
      <GlobalHeaderProvider components={[]} menuItems={[]}>
        <GlobalHeader />
      </GlobalHeaderProvider>,
    );

    expect(document.getElementById('global-header')).toBeInTheDocument();
  });
});
