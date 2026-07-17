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
import { HomePageCardConfig } from '../../../types';

jest.mock('../../../hooks/useContainerQuery', () => ({
  useContainerQuery: jest.fn(),
}));

jest.mock('@backstage/plugin-home', () => ({
  CustomHomepageGrid: ({
    children,
    config,
  }: {
    children: React.ReactNode;
    config: unknown[];
  }) => (
    <div data-testid="custom-homepage-grid" data-config-length={config.length}>
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
    name: 'skipped',
    component: createElement('div', null, 'Skipped'),
  },
] as unknown as HomePageCardConfig[];

describe('CustomizableGridLayout', () => {
  it('renders customizable homepage grid with default layout config', () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <CustomizableGridLayout homepageCards={homepageCards} />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('custom-homepage-grid')).toHaveAttribute(
      'data-config-length',
      '2',
    );
    expect(screen.getByTestId('headline-card')).toBeInTheDocument();
    expect(screen.getByTestId('search-card')).toBeInTheDocument();
    expect(screen.getByText('Skipped')).toBeInTheDocument();
  });
});
