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
import { useRouteRef, useTranslationRef } from '@backstage/frontend-plugin-api';

import { LearningPathsSidebarItem } from './LearningPathsSidebarItem';

jest.mock('@backstage/frontend-plugin-api', () => ({
  ...jest.requireActual('@backstage/frontend-plugin-api'),
  useRouteRef: jest.fn(),
  useTranslationRef: jest.fn(),
}));

jest.mock('@backstage/core-components', () => ({
  ...jest.requireActual('@backstage/core-components'),
  SidebarItem: ({ text, to }: { text: string; to: string }) => (
    <a data-testid="sidebar-item" href={to}>
      {text}
    </a>
  ),
}));

const mockUseRouteRef = useRouteRef as jest.Mock;
const mockUseTranslationRef = useTranslationRef as jest.Mock;

beforeEach(() => {
  mockUseRouteRef.mockReturnValue(() => '/learning-paths');
  mockUseTranslationRef.mockReturnValue({ t: (key: string) => key });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('LearningPathsSidebarItem', () => {
  it('renders a sidebar item with the localized title and route link', () => {
    render(<LearningPathsSidebarItem />);

    const item = screen.getByTestId('sidebar-item');
    expect(item).toHaveTextContent('menuItem.learningPaths');
    expect(item).toHaveAttribute('href', '/learning-paths');
    expect(mockUseTranslationRef).toHaveBeenCalled();
  });

  it('renders nothing when the route is not available', () => {
    mockUseRouteRef.mockReturnValue(undefined);

    render(<LearningPathsSidebarItem />);

    expect(screen.queryByTestId('sidebar-item')).not.toBeInTheDocument();
  });
});
