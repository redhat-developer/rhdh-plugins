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
import { SandboxActivitiesCard } from '../SandboxActivitiesCard';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme } from '@backstage/theme';
import { wrapInTestApp } from '@backstage/test-utils';

describe('SandboxActivitiesCard', () => {
  const mockArticle = {
    img: 'test-image.jpg',
    title: 'Test Article',
    description: 'This is a test article description',
    link: '/test-link',
  };

  const renderCard = () => {
    return render(
      wrapInTestApp(
        <ThemeProvider theme={lightTheme}>
          <SandboxActivitiesCard key="test-key" article={mockArticle} />
        </ThemeProvider>,
      ),
    );
  };

  it('renders without errors', () => {
    renderCard();
    expect(screen.getByText(mockArticle.title)).toBeInTheDocument();
  });

  it('displays the correct article title', () => {
    renderCard();
    const titleElement = screen.getByText(mockArticle.title);
    expect(titleElement).toBeInTheDocument();
    expect(titleElement.tagName).toBe('H5');
  });

  it('displays the correct article description', () => {
    renderCard();
    const descriptionElement = screen.getByText(mockArticle.description);
    expect(descriptionElement).toBeInTheDocument();
  });

  it('renders the image with correct attributes', () => {
    renderCard();
    const imageElement = screen.getByRole('img');
    expect(imageElement).toHaveAttribute('src', mockArticle.img);
    expect(imageElement).toHaveAttribute('alt', mockArticle.title);
    expect(imageElement).toHaveAttribute('height', '120');
  });

  it('links to the correct destination', () => {
    renderCard();
    const linkElement = screen.getByRole('link');
    expect(linkElement).toHaveAttribute('href', mockArticle.link);
  });

  it('has no text decoration on the link', () => {
    renderCard();
    const linkElement = screen.getByRole('link');
    expect(linkElement).toHaveStyle('text-decoration: none');
  });

  it('creates a card with the expected styling', () => {
    renderCard();
    const cardElement = screen.getByRole('link').firstChild;

    // Check that it's using the Card component by inspecting class names
    expect(cardElement).toHaveClass(/MuiCard-root/);

    // Check it has no elevation
    expect(cardElement).toHaveClass(/MuiPaper-elevation0/);
  });

  it('applies appropriate typographic styles', () => {
    renderCard();
    const titleElement = screen.getByText(mockArticle.title);
    const descriptionElement = screen.getByText(mockArticle.description);

    // Check title is primary color
    expect(titleElement).toHaveClass(/MuiTypography-h5/);

    // Check description is secondary color
    expect(descriptionElement).toHaveClass(/MuiTypography-body2/);

    // Check description has italic style
    expect(descriptionElement).toHaveStyle('font-style: italic');
  });
});
