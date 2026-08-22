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

import { mockUseTranslation } from '../../test-utils/mockTranslations';
import { CustomizableGrid } from '../CustomizableGrid';
import { HomePageCardMountPoint } from '../../types';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => mockUseTranslation(),
}));

jest.mock('../../hooks/useContainerQuery', () => ({
  useContainerQuery: jest.fn(),
}));

jest.mock('../../plugin', () => ({
  dynamicHomePagePlugin: {
    provide: jest.fn(() => {
      const Card = () => createElement('div', { 'data-testid': 'grid-card' });
      return Card;
    }),
  },
}));

jest.mock('@backstage/plugin-home-react', () => ({
  createCardExtension: jest.fn(config => config),
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

const HeadlineCard = () => createElement('div', null, 'Headline');
const SearchCard = () => createElement('div', null, 'Search');

const mountPoints = [
  {
    Component: HeadlineCard,
    config: {
      id: 'headline',
      title: 'Headline',
      layouts: {
        xl: { x: 0, y: 0, w: 12, h: 2 },
      },
    },
  },
  {
    Component: SearchCard,
    config: {
      id: 'search',
      title: 'Search Bar',
    },
  },
  {
    Component: SearchCard,
    config: {},
  },
] as HomePageCardMountPoint[];

describe('CustomizableGrid', () => {
  it('renders customizable homepage grid with configured cards', () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <CustomizableGrid mountPoints={mountPoints} />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('custom-homepage-grid')).toHaveAttribute(
      'data-config-length',
      '1',
    );
    expect(screen.getAllByTestId('grid-card')).toHaveLength(2);
  });
});
