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
import { useEffect, useState } from 'react';
import { parseStringPromise, processors } from 'xml2js';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
import { useApi } from '@backstage/core-plugin-api';
import { extractImageFromHTML, sanitizeXML } from '../../utils/rss-utils';
import { Article, NewsCard } from './NewsCard';
import Image from '../../assets/rss-not-found.svg';
import { rssApiRef } from '../../api';
import { useTranslation } from '../../hooks/useTranslation';

export const NewsGrid: React.FC = () => {
  const theme = useTheme();
  const rssApi = useApi(rssApiRef);
  const { t } = useTranslation();
  const [articleData, setArticleData] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRSS = async () => {
      try {
        const response = await rssApi.fetch();

        const sanitizedText = sanitizeXML(response);

        const result = await parseStringPromise(sanitizedText, {
          trim: true,
          explicitArray: false,
          mergeAttrs: true,
          tagNameProcessors: [processors.stripPrefix],
        });

        const items = result.rss?.channel?.item || [];
        const parsedItems = (Array.isArray(items) ? items : [items]).map(
          (item: any) => {
            const thumbnail =
              item.thumbnail?.url ||
              item.content?.url ||
              item['media:thumbnail']?.url ||
              item['media:content']?.url ||
              item['itunes:image']?.href ||
              extractImageFromHTML(item.description);

            return {
              title: item.title,
              link: item.link,
              pubDate: item.pubDate,
              description: item.description,
              thumbnail,
            };
          },
        );

        setArticleData(parsedItems);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching RSS feed:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRSS();
  }, [rssApi]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          padding: '40px 0',
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <CircularProgress />
        <Box sx={{ mt: 2 }}>{t('news.fetchingRssFeed')}</Box>
      </Box>
    );
  }

  if (!articleData || articleData.length === 0) {
    return (
      <Stack direction="row">
        <Box
          sx={{
            margin: `${theme.spacing(26)} ${theme.spacing(10)}`,
          }}
        >
          <Typography
            variant="h1"
            gutterBottom
            sx={{
              fontWeight: 300,
              marginTop: theme.spacing(2),
            }}
          >
            {t('news.noContentAvailable')}
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{
              fontWeight: 400,
              fontSize: theme.typography.h6.fontSize,
              marginTop: theme.spacing(1),
              marginBottom: theme.spacing(2),
            }}
          >
            {t('news.noContentDescription')}
          </Typography>
        </Box>
        <Box
          sx={{
            display: { xs: 'none', sm: 'none', md: 'block', lg: 'block' },
            marginRight: `${theme.spacing(10)}`,
          }}
        >
          <img src={Image} alt={t('news.noRssContent')} />
        </Box>
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${theme.spacing(4.5)} ${theme.spacing(30)} ${theme.spacing(
          6,
        )} ${theme.spacing(5)}`,
      }}
    >
      <Grid container direction="row" spacing={4}>
        {articleData?.map(article => (
          <Grid
            item
            lg={4}
            md={6}
            sm={12}
            xs={12}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'stretch',
            }}
          >
            <NewsCard key={article.title} article={article} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
