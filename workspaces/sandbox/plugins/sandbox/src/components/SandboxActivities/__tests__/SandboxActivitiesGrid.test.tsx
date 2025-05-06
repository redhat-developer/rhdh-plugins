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

import React from 'react';
import { render, screen } from '@testing-library/react';
import { SandboxActivitiesGrid } from '../SandboxActivitiesGrid';
import { articleData } from '../articleData';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme } from '@backstage/theme';
import { wrapInTestApp } from '@backstage/test-utils';
import { SandboxActivitiesCard } from '../SandboxActivitiesCard';

// Mock the SandboxActivitiesCard component
jest.mock('../SandboxActivitiesCard', () => ({
  SandboxActivitiesCard: jest.fn(() => <div data-testid="mock-card" />),
}));

// Mock the articleData
jest.mock('../articleData', () => ({
  articleData: {
    featured: [
      {
        img: 'featured-image.jpg',
        title: 'Featured Article',
        description: 'This is a featured article',
        link: '/featured-link',
      },
    ],
    other: [
      {
        img: 'other-image-1.jpg',
        title: 'Other Article 1',
        description: 'This is another article',
        link: '/other-link-1',
      },
      {
        img: 'other-image-2.jpg',
        title: 'Other Article 2',
        description: 'This is yet another article',
        link: '/other-link-2',
      },
    ],
  },
}));

describe('SandboxActivitiesGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderGrid = () => {
    return render(
      wrapInTestApp(
        <ThemeProvider theme={lightTheme}>
          <SandboxActivitiesGrid />
        </ThemeProvider>,
      ),
    );
  };

  it('renders the featured and other articles sections', () => {
    renderGrid();

    // Check for Featured heading
    expect(screen.getByText('Featured')).toBeInTheDocument();

    // Check that we have the right number of cards rendered (1 featured + 2 other)
    const cards = screen.getAllByTestId('mock-card');
    expect(cards).toHaveLength(3);
  });

  it('renders the correct number of cards for other articles', () => {
    renderGrid();

    // SandboxActivitiesCard should be called once for each featured article
    // and once for each other article
    expect(SandboxActivitiesCard).toHaveBeenCalledTimes(
      articleData.featured.length + articleData.other.length,
    );
  });

  describe('Articles component', () => {
    // Directly testing the Articles component would require exposing it,
    // but we can test its behavior through the parent component

    it('renders correctly when there are no other articles', () => {
      // Temporarily modify the mock to have no other articles
      const originalOther = articleData.other;
      articleData.other = [];

      renderGrid();

      // Should only render the featured article cards
      expect(SandboxActivitiesCard).toHaveBeenCalledTimes(
        articleData.featured.length,
      );

      // Restore the original mock
      articleData.other = originalOther;
    });
  });
});
