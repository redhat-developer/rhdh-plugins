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

import { createElement } from 'react';
import { render, screen } from '@testing-library/react';

import { ReadOnlyGrid } from '../ReadOnlyGrid';
import { HomePageCardMountPoint } from '../../types';

jest.mock('react-use/lib/useMeasure', () => ({
  __esModule: true,
  default: () => [jest.fn(), { width: 1200, height: 800 }],
}));

jest.mock('react-grid-layout', () => ({
  Responsive: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-grid">{children}</div>
  ),
}));

jest.mock('@backstage/core-components', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const CardComponent = () => createElement('div', null, 'Card Content');

const mountPointsWithLayout = [
  {
    Component: CardComponent,
    config: {
      layouts: {
        xl: { x: 0, y: 0, w: 6, h: 4 },
      },
    },
  },
] as unknown as HomePageCardMountPoint[];

const mountPointsWithoutLayout = [
  {
    Component: CardComponent,
    config: {},
  },
] as unknown as HomePageCardMountPoint[];

describe('ReadOnlyGrid', () => {
  it('renders cards with configured layouts', () => {
    render(<ReadOnlyGrid mountPoints={mountPointsWithLayout} />);

    expect(screen.getByTestId('responsive-grid')).toBeInTheDocument();
    expect(screen.getByTestId('home-page card 1')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('renders cards with default layouts when none are configured', () => {
    render(<ReadOnlyGrid mountPoints={mountPointsWithoutLayout} />);

    expect(screen.getByTestId('home-page card 1')).toBeInTheDocument();
  });

  it('renders no cards when mount points are not default configurations', () => {
    render(
      <ReadOnlyGrid
        mountPoints={[
          {
            Component: CardComponent,
            config: { id: 'non-default' },
          },
        ]}
      />,
    );

    expect(screen.queryByTestId('home-page card 1')).not.toBeInTheDocument();
  });
});
