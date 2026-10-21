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
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { CustomizableGridLayout } from '../CustomizableGridLayout';
import { HomePageCardConfig } from '../../types';

jest.mock('../../hooks/useContainerQuery', () => ({
  useContainerQuery: jest.fn(),
}));

jest.mock('@backstage/plugin-home', () => ({
  CustomHomepageGrid: ({
    children,
    config,
  }: {
    children: React.ReactNode;
    config: Array<{ width: number; height: number }>;
  }) => (
    <div
      data-testid="custom-homepage-grid"
      data-config-length={config.length}
      data-first-width={config[0]?.width}
      data-first-height={config[0]?.height}
      data-second-width={config[1]?.width}
      data-second-height={config[1]?.height}
    >
      {children}
    </div>
  ),
}));

const HeadlineCard = createElement(
  'div',
  { 'data-testid': 'headline-card' },
  'Headline',
);
const SearchCard = createElement(
  'div',
  { 'data-testid': 'search-card' },
  'Search',
);

const homepageCards = [
  {
    name: 'headline',
    component: HeadlineCard,
    node: HeadlineCard,
    breakpointLayouts: {
      xl: { x: 0, y: 0, w: 12, h: 2 },
    },
  },
  {
    name: 'search',
    component: SearchCard,
    node: SearchCard,
  },
  {
    // Cards without a node still render as children, but are omitted from grid config.
    name: 'without-node',
    component: createElement('div', null, 'Without node'),
  },
] as unknown as HomePageCardConfig[];

describe('CustomizableGridLayout', () => {
  it('builds grid config from cards with nodes and passes layout size', () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <CustomizableGridLayout homepageCards={homepageCards} />
      </ThemeProvider>,
    );

    const grid = screen.getByTestId('custom-homepage-grid');
    expect(grid).toHaveAttribute('data-config-length', '2');
    expect(grid).toHaveAttribute('data-first-width', '12');
    expect(grid).toHaveAttribute('data-first-height', '2');
    expect(grid).toHaveAttribute('data-second-width', '12');
    expect(grid).toHaveAttribute('data-second-height', '4');
    expect(screen.getByTestId('headline-card')).toBeInTheDocument();
    expect(screen.getByTestId('search-card')).toBeInTheDocument();
    expect(screen.getByText('Without node')).toBeInTheDocument();
  });
});
