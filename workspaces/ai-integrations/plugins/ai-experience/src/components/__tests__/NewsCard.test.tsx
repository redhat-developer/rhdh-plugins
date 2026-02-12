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
import { NewsCard, Article } from '../NewsPage/NewsCard';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme } from '@backstage/theme';
import { MemoryRouter } from 'react-router-dom'; // Import MemoryRouter

// Mock the Link component from @backstage/core-components
jest.mock('@backstage/core-components', () => ({
  ...jest.requireActual('@backstage/core-components'),
  Link: ({ to, children, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

const renderInTheme = (children: React.ReactNode) =>
  render(
    <MemoryRouter>
      {' '}
      {/* Wrap with MemoryRouter */}
      <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
    </MemoryRouter>,
  );

describe('NewsCard', () => {
  const baseArticle: Article = {
    title: 'Test Article Title',
    link: 'https://example.com/article',
    description: 'This is a test description for the article.',
    thumbnail: 'https://example.com/thumbnail.jpg',
    pubDate: '2025-04-22',
  };

  it('renders the card with title, description, and thumbnail', () => {
    renderInTheme(<NewsCard key="1" article={baseArticle} />);

    expect(screen.getByText(baseArticle.title)).toBeInTheDocument();
    expect(screen.getByText(baseArticle.description!)).toBeInTheDocument();
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', baseArticle.thumbnail);
    expect(image).toHaveAttribute('alt', baseArticle.title);
    expect(screen.getByRole('link')).toHaveAttribute('href', baseArticle.link);
  });

  it('renders the card without a thumbnail', () => {
    const articleWithoutThumbnail = { ...baseArticle, thumbnail: undefined };
    renderInTheme(<NewsCard key="1" article={articleWithoutThumbnail} />);

    expect(screen.getByText(articleWithoutThumbnail.title)).toBeInTheDocument();
    expect(
      screen.getByText(articleWithoutThumbnail.description!),
    ).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      articleWithoutThumbnail.link,
    );
  });

  it('does not truncate a short title', () => {
    const shortTitle = 'Short Title';
    const articleWithShortTitle = { ...baseArticle, title: shortTitle };
    renderInTheme(<NewsCard key="1" article={articleWithShortTitle} />);

    expect(screen.getByText(shortTitle)).toBeInTheDocument();
    expect(screen.queryByText(`${shortTitle}...`)).not.toBeInTheDocument(); // Check it doesn't add ellipsis unnecessarily
  });

  it('truncates a long description', () => {
    const longDescription =
      'This is an extremely long description designed to test the truncation logic. It needs to be significantly longer than two hundred characters to ensure that the substring and ellipsis functionality is correctly applied as expected by the card component styling and layout requirements. Adding more words just to be sure it hits the limit.';
    const articleWithLongDescription = {
      ...baseArticle,
      description: longDescription,
    };
    renderInTheme(<NewsCard key="1" article={articleWithLongDescription} />);

    expect(
      screen.getByText(`${longDescription.substring(0, 200)}...`),
    ).toBeInTheDocument();
    // Check that the full description is not rendered
    expect(screen.queryByText(longDescription)).not.toBeInTheDocument();
  });

  it('does not truncate a short description', () => {
    const shortDescription = 'A concise description.';
    const articleWithShortDescription = {
      ...baseArticle,
      description: shortDescription,
    };
    renderInTheme(<NewsCard key="1" article={articleWithShortDescription} />);

    expect(screen.getByText(shortDescription)).toBeInTheDocument();
    // Ensure no ellipsis is added
    expect(
      screen.queryByText(`${shortDescription}...`),
    ).not.toBeInTheDocument();
  });

  it('uses title as description if description is missing', () => {
    const articleWithoutDescription = {
      ...baseArticle,
      description: undefined,
    };
    renderInTheme(<NewsCard key="1" article={articleWithoutDescription} />);

    // The title should appear twice: once as the heading, once in the description area
    expect(
      screen.getAllByText(articleWithoutDescription.title).length,
    ).toBeGreaterThanOrEqual(1); // Title is rendered
    // Check the description text content specifically using data-testid
    const descriptionElement = screen.getByTestId('news-card-description');
    expect(descriptionElement).toHaveTextContent(
      articleWithoutDescription.title,
    );
  });

  it('uses title as description if description is empty string', () => {
    const articleWithEmptyDescription = { ...baseArticle, description: '' };
    renderInTheme(<NewsCard key="1" article={articleWithEmptyDescription} />);

    expect(
      screen.getAllByText(articleWithEmptyDescription.title).length,
    ).toBeGreaterThanOrEqual(1);
    // Check the description text content specifically using data-testid
    const descriptionElement = screen.getByTestId('news-card-description');
    expect(descriptionElement).toHaveTextContent(
      articleWithEmptyDescription.title,
    );
  });

  it('uses title as description if description is whitespace string', () => {
    const articleWithWhitespaceDescription = {
      ...baseArticle,
      description: '   ',
    };
    renderInTheme(
      <NewsCard key="1" article={articleWithWhitespaceDescription} />,
    );

    expect(
      screen.getAllByText(articleWithWhitespaceDescription.title).length,
    ).toBeGreaterThanOrEqual(1);
    // Check the description text content specifically using data-testid
    const descriptionElement = screen.getByTestId('news-card-description');
    expect(descriptionElement).toHaveTextContent(
      articleWithWhitespaceDescription.title,
    );
  });

  it('strips HTML tags and decodes &nbsp; from description', () => {
    const descriptionWithHtml =
      '<p>This description&nbsp;has <b>HTML</b> tags.</p>';
    const expectedText = 'This description has HTML tags.';
    const articleWithHtmlDescription = {
      ...baseArticle,
      description: descriptionWithHtml,
    };
    renderInTheme(<NewsCard key="1" article={articleWithHtmlDescription} />);

    expect(screen.getByText(expectedText)).toBeInTheDocument();
    expect(screen.queryByText(descriptionWithHtml)).not.toBeInTheDocument();
  });

  it('renders the link correctly', () => {
    renderInTheme(<NewsCard key="1" article={baseArticle} />);
    const linkElement = screen.getByRole('link');
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute('href', baseArticle.link);
  });
});
