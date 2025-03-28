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
import React, { useEffect, useState } from 'react';
import Parser from 'rss-parser';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { ItemCardGrid } from '@backstage/core-components';
import { Article, NewsCard } from './NewsCard';

const feedUrl =
  'https://newsroom.ibm.com/press-releases-artificial-intelligence?pagetemplate=rss';

export const NewsGrid: React.FC = () => {
  const theme = useTheme();

  const [articleData, setArticleData] = useState<any>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRSS = async () => {
      try {
        const parser = new Parser();
        const feed = await parser.parseURL(feedUrl);
        setArticleData(
          feed.items.map(item => ({
            title: item.title || 'No Title',
            link: item.link || '#',
            pubDate: item.pubDate || 'Unknown Date',
          })),
        );
      } catch (error) {
        console.error('Error fetching RSS feed:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRSS();
  }, [feedUrl]);

  return (
    <Box
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '36px 240px 48px 60px',
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {loading && <p>Loading...</p>}
      <ItemCardGrid>
        {articleData?.map(article => (
          <NewsCard key={article.title} article={article} />
        ))}
      </ItemCardGrid>
    </Box>
  );
};
