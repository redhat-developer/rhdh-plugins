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

import { VisitListener } from '../VisitListener';
import { useDynamicHomePageCards } from '../../hooks/useDynamicHomePageCards';

jest.mock('../../hooks/useDynamicHomePageCards');

jest.mock('@backstage/plugin-home', () => ({
  VisitListener: () => <div data-testid="visit-listener" />,
}));

const mockUseDynamicHomePageCards =
  useDynamicHomePageCards as jest.MockedFunction<
    typeof useDynamicHomePageCards
  >;

const RecentlyVisitedCard = () => createElement('div');
RecentlyVisitedCard.displayName = 'Extension(RecentlyVisitedCard)';

const HeadlineCard = () => createElement('div');
HeadlineCard.displayName = 'Extension(HeadlineCard)';

describe('VisitListener', () => {
  it('renders nothing when there are no cards', () => {
    mockUseDynamicHomePageCards.mockReturnValue([]);

    const { container } = render(<VisitListener />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when no card requires visit listener', () => {
    mockUseDynamicHomePageCards.mockReturnValue([
      { Component: HeadlineCard, config: { id: 'headline' } },
    ]);

    const { container } = render(<VisitListener />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders VisitListener when RecentlyVisitedCard is present', () => {
    mockUseDynamicHomePageCards.mockReturnValue([
      { Component: RecentlyVisitedCard, config: { id: 'recent' } },
    ]);

    render(<VisitListener />);

    expect(screen.getByTestId('visit-listener')).toBeInTheDocument();
  });

  it('renders VisitListener when TopVisitedCard is present', () => {
    const TopVisitedCard = () => createElement('div');
    TopVisitedCard.displayName = 'Extension(TopVisitedCard)';

    mockUseDynamicHomePageCards.mockReturnValue([
      { Component: TopVisitedCard, config: { id: 'top' } },
    ]);

    render(<VisitListener />);

    expect(screen.getByTestId('visit-listener')).toBeInTheDocument();
  });
});
