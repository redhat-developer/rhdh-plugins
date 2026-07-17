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

import { mockUseTranslation } from '../../../test-utils/mockTranslations';
import {
  CatalogStarredEntitiesCard,
  RecentlyVisitedCard,
  TopVisitedCard,
} from '../TranslatedUpstreamHomePageCards';

jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => mockUseTranslation(),
}));

jest.mock('@backstage/plugin-home', () => ({
  HomePageStarredEntities: ({ title }: { title: string }) => (
    <div data-testid="starred">{title}</div>
  ),
  HomePageRecentlyVisited: ({ title }: { title: string }) => (
    <div data-testid="recent">{title}</div>
  ),
  HomePageTopVisited: ({ title }: { title: string }) => (
    <div data-testid="top">{title}</div>
  ),
}));

describe('TranslatedUpstreamHomePageCards', () => {
  it('renders CatalogStarredEntitiesCard with translated title', () => {
    render(<CatalogStarredEntitiesCard />);

    expect(screen.getByTestId('starred')).toHaveTextContent(
      'Starred catalog entities',
    );
  });

  it('renders RecentlyVisitedCard with translated title', () => {
    render(<RecentlyVisitedCard />);

    expect(screen.getByTestId('recent')).toHaveTextContent('Recently Visited');
  });

  it('renders TopVisitedCard with translated title', () => {
    render(<TopVisitedCard />);

    expect(screen.getByTestId('top')).toHaveTextContent('Top Visited');
  });

  it('uses titleKey when provided', () => {
    render(<CatalogStarredEntitiesCard titleKey="starredEntities.title" />);

    expect(screen.getByTestId('starred')).toHaveTextContent(
      'Starred catalog entities',
    );
  });
});
