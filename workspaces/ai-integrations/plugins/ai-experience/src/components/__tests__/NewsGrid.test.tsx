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
import { render, screen, waitFor } from '@testing-library/react';
import { NewsGrid } from '../NewsPage/NewsGrid';
import { useApi } from '@backstage/core-plugin-api';
import { parseStringPromise } from 'xml2js';
import { sanitizeXML, extractImageFromHTML } from '../../utils/rss-utils';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { lightTheme } from '@backstage/theme';
import { TestApiProvider } from '@backstage/test-utils';
import { mockUseTranslation } from '../../test-utils/mockTranslations';

// Mock dependencies
jest.mock('@backstage/core-plugin-api');
jest.mock('xml2js');
jest.mock('../../utils/rss-utils');
jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => mockUseTranslation(),
}));
jest.mock('../NewsPage/NewsCard', () => ({
  NewsCard: jest.fn(({ article }) => (
    <div data-testid={`news-card-${article.title}`}>{article.title}</div>
  )),
}));

const mockUseApi = useApi as jest.Mock;
const mockParseStringPromise = parseStringPromise as jest.Mock;
const mockSanitizeXML = sanitizeXML as jest.Mock;
const mockExtractImageFromHTML = extractImageFromHTML as jest.Mock;

const mockRssApi = {
  fetch: jest.fn(),
};

const theme = createTheme(lightTheme);

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <TestApiProvider apis={[]}>
      <ThemeProvider theme={theme}>{component}</ThemeProvider>
    </TestApiProvider>,
  );
};

describe('NewsGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApi.mockReturnValue(mockRssApi);
    mockSanitizeXML.mockImplementation(xml => xml); // Default mock implementation
    mockExtractImageFromHTML.mockReturnValue(undefined); // Default mock implementation
  });

  it('should display loading indicator initially', () => {
    mockRssApi.fetch.mockResolvedValue('<rss></rss>'); // Prevent immediate error
    mockParseStringPromise.mockResolvedValue({
      rss: { channel: { item: [] } },
    });
    renderWithTheme(<NewsGrid />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Fetching RSS Feed')).toBeInTheDocument();
  });

  it('should display "No content available" when fetch returns empty data', async () => {
    const mockXml = '<rss><channel></channel></rss>';
    const mockParsedData = { rss: { channel: { item: [] } } };
    mockRssApi.fetch.mockResolvedValue(mockXml);
    mockParseStringPromise.mockResolvedValue(mockParsedData);
    mockSanitizeXML.mockReturnValue(mockXml);

    renderWithTheme(<NewsGrid />);

    await waitFor(() => {
      expect(screen.getByText('No content available')).toBeInTheDocument();
    });
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(mockSanitizeXML).toHaveBeenCalledWith(mockXml);
    expect(mockParseStringPromise).toHaveBeenCalledWith(
      mockXml,
      expect.any(Object),
    );
  });

  it('should display "No content available" when fetch returns data without items', async () => {
    const mockXml = '<rss><channel><title>Test Feed</title></channel></rss>';
    const mockParsedData = { rss: { channel: { title: 'Test Feed' } } }; // No 'item' key
    mockRssApi.fetch.mockResolvedValue(mockXml);
    mockParseStringPromise.mockResolvedValue(mockParsedData);
    mockSanitizeXML.mockReturnValue(mockXml);

    renderWithTheme(<NewsGrid />);

    await waitFor(() => {
      expect(screen.getByText('No content available')).toBeInTheDocument();
    });
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('should display "No content available" on API fetch error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const error = new Error('Failed to fetch');
    mockRssApi.fetch.mockRejectedValue(error);

    renderWithTheme(<NewsGrid />);

    await waitFor(() => {
      expect(screen.getByText('No content available')).toBeInTheDocument();
    });
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching RSS feed:',
      error,
    );
    consoleErrorSpy.mockRestore();
  });

  it('should display "No content available" on XML parsing error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const error = new Error('XML Parse Error');
    const mockXml = '<rss>invalid xml</rss>';
    mockRssApi.fetch.mockResolvedValue(mockXml);
    mockSanitizeXML.mockReturnValue(mockXml);
    mockParseStringPromise.mockRejectedValue(error);

    renderWithTheme(<NewsGrid />);

    await waitFor(() => {
      expect(screen.getByText('No content available')).toBeInTheDocument();
    });
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching RSS feed:',
      error,
    );
    consoleErrorSpy.mockRestore();
  });

  it('should render news cards when data is fetched successfully', async () => {
    const mockXml =
      '<rss><channel><item><title>Article 1</title><link>link1</link><pubDate>date1</pubDate><description>desc1</description></item><item><title>Article 2</title><link>link2</link><pubDate>date2</pubDate><description>desc2</description></item></channel></rss>';
    const mockParsedData = {
      rss: {
        channel: {
          item: [
            {
              title: 'Article 1',
              link: 'link1',
              pubDate: 'date1',
              description: 'desc1',
            },
            {
              title: 'Article 2',
              link: 'link2',
              pubDate: 'date2',
              description: 'desc2',
            },
          ],
        },
      },
    };
    mockRssApi.fetch.mockResolvedValue(mockXml);
    mockParseStringPromise.mockResolvedValue(mockParsedData);
    mockSanitizeXML.mockReturnValue(mockXml);

    renderWithTheme(<NewsGrid />);

    await waitFor(() => {
      expect(screen.getByTestId('news-card-Article 1')).toBeInTheDocument();
      expect(screen.getByTestId('news-card-Article 2')).toBeInTheDocument();
    });

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(
      screen.queryByText('No RSS Content Available'),
    ).not.toBeInTheDocument();
    expect(mockSanitizeXML).toHaveBeenCalledWith(mockXml);
    expect(mockParseStringPromise).toHaveBeenCalledWith(
      mockXml,
      expect.any(Object),
    );
  });

  it('should handle single item in feed', async () => {
    const mockXml =
      '<rss><channel><item><title>Single Article</title><link>link1</link></item></channel></rss>';
    // xml2js might return single item not as array if explicitArray is false
    const mockParsedData = {
      rss: {
        channel: {
          item: { title: 'Single Article', link: 'link1' },
        },
      },
    };
    mockRssApi.fetch.mockResolvedValue(mockXml);
    mockParseStringPromise.mockResolvedValue(mockParsedData);
    mockSanitizeXML.mockReturnValue(mockXml);

    renderWithTheme(<NewsGrid />);

    await waitFor(() => {
      expect(
        screen.getByTestId('news-card-Single Article'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('should correctly extract thumbnail URLs from various fields', async () => {
    const mockXml =
      '<rss><channel><item><title>Article T1</title><thumbnail url="thumb1"/></item><item><title>Article T2</title><content url="thumb2"/></item><item><title>Article T3</title><media:thumbnail url="thumb3"/></item><item><title>Article T4</title><media:content url="thumb4"/></item><item><title>Article T5</title><itunes:image href="thumb5"/></item><item><title>Article T6</title><description>desc6</description></item></channel></rss>';
    const mockParsedData = {
      rss: {
        channel: {
          item: [
            { title: 'Article T1', thumbnail: { url: 'thumb1' } },
            { title: 'Article T2', content: { url: 'thumb2' } },
            { title: 'Article T3', 'media:thumbnail': { url: 'thumb3' } },
            { title: 'Article T4', 'media:content': { url: 'thumb4' } },
            { title: 'Article T5', 'itunes:image': { href: 'thumb5' } },
            { title: 'Article T6', description: 'desc6' },
          ],
        },
      },
    };
    mockRssApi.fetch.mockResolvedValue(mockXml);
    mockParseStringPromise.mockResolvedValue(mockParsedData);
    mockSanitizeXML.mockReturnValue(mockXml);
    mockExtractImageFromHTML.mockReturnValue('extracted_thumb'); // Mock for the last item

    renderWithTheme(<NewsGrid />);

    await waitFor(() => {
      expect(screen.getByTestId('news-card-Article T1')).toBeInTheDocument();
    });

    // Check if NewsCard received the correct thumbnail props
    const NewsCard = jest.requireMock('../NewsPage/NewsCard').NewsCard;
    expect(NewsCard).toHaveBeenCalledWith(
      expect.objectContaining({
        article: expect.objectContaining({
          title: 'Article T1',
          thumbnail: 'thumb1',
        }),
      }),
      expect.anything(),
    );
    expect(NewsCard).toHaveBeenCalledWith(
      expect.objectContaining({
        article: expect.objectContaining({
          title: 'Article T2',
          thumbnail: 'thumb2',
        }),
      }),
      expect.anything(),
    );
    expect(NewsCard).toHaveBeenCalledWith(
      expect.objectContaining({
        article: expect.objectContaining({
          title: 'Article T3',
          thumbnail: 'thumb3',
        }),
      }),
      expect.anything(),
    );
    expect(NewsCard).toHaveBeenCalledWith(
      expect.objectContaining({
        article: expect.objectContaining({
          title: 'Article T4',
          thumbnail: 'thumb4',
        }),
      }),
      expect.anything(),
    );
    expect(NewsCard).toHaveBeenCalledWith(
      expect.objectContaining({
        article: expect.objectContaining({
          title: 'Article T5',
          thumbnail: 'thumb5',
        }),
      }),
      expect.anything(),
    );
    expect(NewsCard).toHaveBeenCalledWith(
      expect.objectContaining({
        article: expect.objectContaining({
          title: 'Article T6',
          thumbnail: 'extracted_thumb',
        }),
      }),
      expect.anything(),
    );
    expect(mockExtractImageFromHTML).toHaveBeenCalledWith('desc6');
  });
});
