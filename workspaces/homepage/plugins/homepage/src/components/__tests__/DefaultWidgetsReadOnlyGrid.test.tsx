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

import { DefaultWidgetsReadOnlyGrid } from '../DefaultWidgetsReadOnlyGrid';
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

const HeadlineCard = ({ title }: { title?: string }) =>
  createElement('div', null, title ?? 'Headline');

const mountPoints: HomePageCardMountPoint[] = [
  {
    Component: HeadlineCard,
    config: {
      id: 'homepage.headline',
      props: { title: 'Default Headline' },
    },
  },
];

describe('DefaultWidgetsReadOnlyGrid', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders widgets with configured layouts', () => {
    render(
      <DefaultWidgetsReadOnlyGrid
        defaultWidgets={[
          {
            id: 'headline-1',
            ref: 'homepage.headline',
            props: { title: 'Widget Headline' },
            layout: { xl: { x: 0, y: 0, w: 12, h: 2 } },
          },
        ]}
        mountPoints={mountPoints}
      />,
    );

    expect(screen.getByTestId('responsive-grid')).toBeInTheDocument();
    expect(screen.getByTestId('home-page card 1')).toBeInTheDocument();
    expect(screen.getByText('Widget Headline')).toBeInTheDocument();
  });

  it('uses default layouts when widget layout is not provided', () => {
    render(
      <DefaultWidgetsReadOnlyGrid
        defaultWidgets={[
          {
            id: 'headline-1',
            ref: 'homepage.headline',
          },
        ]}
        mountPoints={mountPoints}
      />,
    );

    expect(screen.getByTestId('home-page card 1')).toBeInTheDocument();
    expect(screen.getByText('Default Headline')).toBeInTheDocument();
  });

  it('warns and skips widgets with unknown refs', () => {
    render(
      <DefaultWidgetsReadOnlyGrid
        defaultWidgets={[
          {
            id: 'missing',
            ref: 'homepage.missing',
          },
        ]}
        mountPoints={mountPoints}
      />,
    );

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('No mount point found'),
    );
    expect(screen.queryByTestId('home-page card 1')).not.toBeInTheDocument();
  });
});
