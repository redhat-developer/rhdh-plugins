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

import { renderInTestApp } from '@backstage/test-utils';
import { screen } from '@testing-library/react';

import { PopularContentListCard } from '../PopularContentListCard';

describe('PopularContentListCard', () => {
  it('renders items with links, icons, and non-clickable entries', async () => {
    await renderInTestApp(
      <PopularContentListCard
        title="Top Plugins"
        items={[
          {
            id: 'catalog',
            title: 'Software Catalog',
            href: '/catalog',
            icon: <span data-testid="catalog-icon" />,
          },
          { id: 'unknown', title: 'mystery-plugin' },
        ]}
      />,
    );

    expect(screen.getByText('Top Plugins')).toBeInTheDocument();
    // ListRow + href uses react-aria row navigation (data-href), not role=link.
    expect(
      screen.getByRole('row', { name: 'Software Catalog' }),
    ).toHaveAttribute('data-href', '/catalog');
    expect(screen.getByTestId('catalog-icon')).toBeInTheDocument();
    expect(screen.getByText('mystery-plugin')).toBeInTheDocument();
    expect(
      screen.getByRole('row', { name: 'mystery-plugin' }),
    ).not.toHaveAttribute('data-href');
  });

  it('renders rank in front of title, omits icons, trend/visits, and header info', async () => {
    await renderInTestApp(
      <PopularContentListCard
        title="Top Plugins"
        titleTooltip="Trend calculated based on the last 28 days"
        showRank
        items={[
          {
            id: 'techdocs',
            title: 'TechDocs',
            subtitle: 'techdocs',
            href: '/docs',
            icon: <span data-testid="techdocs-icon" />,
            visitCount: 1284,
            trendPercentage: '12',
          },
          {
            id: 'scaffolder',
            title: 'Software Templates',
            subtitle: 'scaffolder',
            visitCount: 876,
            trendPercentage: '-5',
          },
        ]}
      />,
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('TechDocs')).toBeInTheDocument();
    expect(screen.getByText('techdocs')).toBeInTheDocument();
    expect(screen.queryByTestId('techdocs-icon')).not.toBeInTheDocument();
    expect(screen.getByRole('row', { name: 'TechDocs' })).toHaveAttribute(
      'data-href',
      '/docs',
    );
    expect(
      screen.getByRole('row', { name: 'Software Templates' }),
    ).not.toHaveAttribute('data-href');
    expect(screen.getByLabelText('Trend 12%')).toBeInTheDocument();
    expect(screen.getByLabelText('Trend -5%')).toBeInTheDocument();
    expect(screen.getByText('1,284 visits')).toBeInTheDocument();
    expect(screen.getByText('876 visits')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Trend calculated based on the last 28 days'),
    ).toBeInTheDocument();
  });

  it('renders empty state without throwing', async () => {
    await renderInTestApp(
      <PopularContentListCard title="Top Plugins" items={[]} />,
    );
    expect(
      screen.getByText('No popular content to show yet.'),
    ).toBeInTheDocument();
  });

  it('renders error state without throwing', async () => {
    await renderInTestApp(
      <PopularContentListCard
        title="Top Plugins"
        items={[]}
        error={new Error('boom')}
      />,
    );
    expect(
      screen.getByText('Unable to load popular content right now.'),
    ).toBeInTheDocument();
  });

  it('renders permission denied state', async () => {
    await renderInTestApp(
      <PopularContentListCard
        title="Top Plugins"
        items={[]}
        permissionDenied
      />,
    );
    expect(
      screen.getByText(
        'You do not have permission to view adoption insights data.',
      ),
    ).toBeInTheDocument();
  });
});
