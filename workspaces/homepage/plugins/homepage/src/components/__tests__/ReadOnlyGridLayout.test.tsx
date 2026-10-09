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

import { ReadOnlyGridLayout } from '../ReadOnlyGridLayout';
import { HomePageCardConfig } from '../../types';

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

const cardElement = createElement('div', null, 'Card Content');

const ContentCard = ({ label }: { label: string }) =>
  createElement('div', null, label);

const homepageCardsWithLayout = [
  {
    name: 'headline',
    component: cardElement,
    breakpointLayouts: {
      xl: { x: 0, y: 0, w: 6, h: 4 },
    },
  },
] as unknown as HomePageCardConfig[];

const homepageCardsWithoutLayout = [
  {
    name: 'headline',
    component: cardElement,
  },
] as unknown as HomePageCardConfig[];

function getCardLayout(testId = 'home-page card 1') {
  const layoutAttr = screen.getByTestId(testId).getAttribute('data-layout');
  expect(layoutAttr).toBeTruthy();
  return JSON.parse(layoutAttr!) as Record<string, { w: number; h: number }>;
}

describe('ReadOnlyGridLayout', () => {
  it('renders cards with configured breakpoint layouts', () => {
    render(<ReadOnlyGridLayout homepageCards={homepageCardsWithLayout} />);

    expect(screen.getByTestId('responsive-grid')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();

    const layout = getCardLayout();
    expect(layout.xl).toMatchObject({ w: 6, h: 4 });
    // Only configured breakpoints are present — not full default set
    expect(layout.lg).toBeUndefined();
    expect(layout.xxs).toBeUndefined();
  });

  it('renders cards with default layouts when none are configured', () => {
    render(<ReadOnlyGridLayout homepageCards={homepageCardsWithoutLayout} />);

    expect(screen.getByText('Card Content')).toBeInTheDocument();

    const layout = getCardLayout();
    expect(layout.xl).toMatchObject({ w: 12, h: 4 });
    // Defaults fill every breakpoint
    expect(layout.lg).toBeDefined();
    expect(layout.xxs).toBeDefined();
  });

  it('renders component from Content wrapper when provided', () => {
    render(
      <ReadOnlyGridLayout
        homepageCards={[
          {
            name: 'wrapped',
            component: {
              Content: () => <ContentCard label="Wrapped Content" />,
            },
          } as unknown as HomePageCardConfig,
        ]}
      />,
    );

    expect(screen.getByText('Wrapped Content')).toBeInTheDocument();
  });

  it('renders react element components directly', () => {
    render(
      <ReadOnlyGridLayout
        homepageCards={
          [
            {
              name: 'element',
              component: createElement('div', null, 'Element Content'),
            },
          ] as unknown as HomePageCardConfig[]
        }
      />,
    );

    expect(screen.getByText('Element Content')).toBeInTheDocument();
  });
});
