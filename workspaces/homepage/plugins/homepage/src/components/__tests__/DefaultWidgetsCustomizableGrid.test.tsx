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
import { DefaultWidgetsCustomizableGrid } from '../DefaultWidgetsCustomizableGrid';
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

const mountPoints: HomePageCardMountPoint[] = [
  {
    Component: HeadlineCard,
    config: {
      id: 'homepage.headline',
      title: 'Headline',
    },
  },
  {
    Component: HeadlineCard,
    config: {},
  },
];

describe('DefaultWidgetsCustomizableGrid', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders default widgets and mount points', () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <DefaultWidgetsCustomizableGrid
          defaultWidgets={[
            {
              id: 'headline-1',
              ref: 'homepage.headline',
              layout: { xl: { x: 0, y: 0, w: 12, h: 2 } },
            },
          ]}
          mountPoints={mountPoints}
        />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('custom-homepage-grid')).toHaveAttribute(
      'data-config-length',
      '1',
    );
    expect(screen.getAllByTestId('grid-card').length).toBeGreaterThan(0);
  });

  it('warns when default widget ref does not match a mount point', () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <DefaultWidgetsCustomizableGrid
          defaultWidgets={[
            {
              id: 'missing',
              ref: 'homepage.missing',
            },
          ]}
          mountPoints={mountPoints}
        />
      </ThemeProvider>,
    );

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('invalid ref'),
    );
  });

  it('creates custom card when default widget has props', () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <DefaultWidgetsCustomizableGrid
          defaultWidgets={[
            {
              id: 'custom-headline',
              ref: 'homepage.headline',
              props: {
                title: 'Custom Headline',
                debugContent: 'Custom Headline',
              },
              layout: { xl: { x: 0, y: 0, w: 12, h: 2 } },
            },
          ]}
          mountPoints={mountPoints}
        />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('custom-homepage-grid')).toBeInTheDocument();
  });
});
