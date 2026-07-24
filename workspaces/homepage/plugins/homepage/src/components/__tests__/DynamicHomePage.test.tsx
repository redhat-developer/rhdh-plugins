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

import { DynamicHomePage } from '../DynamicHomePage';
import { useDynamicHomePageCards } from '../../hooks/useDynamicHomePageCards';

jest.mock('../../hooks/useDynamicHomePageCards');

jest.mock('../HomePage', () => ({
  HomePage: ({
    customizable,
    mountPoints,
    title,
  }: {
    customizable: boolean;
    mountPoints: unknown[];
    title?: string;
  }) => (
    <div data-testid="home-page">
      <span data-testid="customizable">{String(customizable)}</span>
      <span data-testid="mount-count">{mountPoints.length}</span>
      <span data-testid="title">{title}</span>
    </div>
  ),
}));

const mockUseDynamicHomePageCards =
  useDynamicHomePageCards as jest.MockedFunction<
    typeof useDynamicHomePageCards
  >;

const MockCard = () => createElement('div');
const mountPoints = [{ Component: MockCard, config: { id: 'card-1' } }];

describe('DynamicHomePage', () => {
  it('passes mount points to HomePage with customizable false', () => {
    mockUseDynamicHomePageCards.mockReturnValue(mountPoints);

    render(<DynamicHomePage title="My Home" />);

    expect(screen.getByTestId('customizable')).toHaveTextContent('false');
    expect(screen.getByTestId('mount-count')).toHaveTextContent('1');
    expect(screen.getByTestId('title')).toHaveTextContent('My Home');
  });
});
