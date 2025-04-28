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
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CardMedia from '@mui/material/CardMedia';
import { useTheme } from '@mui/material/styles';
import { Link } from '@backstage/core-components';
import { formatDescription } from '../../utils/rss-utils';

export interface Article {
  title: string;
  link: string;
  pubDate?: string;
  description?: string;
  thumbnail?: string;
}

type NewsCardProps = {
  key: string;
  article: Article;
};

export const NewsCard: React.FC<NewsCardProps> = ({
  key,
  article: { title, description, link, thumbnail },
}) => {
  const theme = useTheme();

  return (
    <Link to={link} style={{ textDecoration: 'none' }}>
      <Card
        key={key}
        elevation={2}
        sx={{
          height: thumbnail ? '320px' : '180px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRadius: 4,
          border: `1px solid ${
            theme.palette.mode === 'dark' ? '#57585a' : '#E4E4E4'
          }`,
        }}
      >
        {thumbnail && (
          <CardMedia
            component="img"
            height="140"
            image={thumbnail}
            alt={title}
            sx={{
              margin: `${theme.spacing(2)} auto 0 auto`,
              objectFit: 'cover',
            }}
          />
        )}
        <CardContent
          sx={{
            padding: `${theme.spacing(2)} ${theme.spacing(0.5)} ${theme.spacing(
              0.5,
            )} ${theme.spacing(0.5)}`,
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor:
              theme.palette.mode === 'dark'
                ? '#2A2D30'
                : theme.palette.background.paper,
          }}
        >
          <Tooltip title={title} placement="top">
            <Typography
              variant="h6"
              color="primary"
              gutterBottom
              sx={{
                fontWeight: 600,
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {title.length > 70 ? `${title.substring(0, 70)}...` : title}
            </Typography>
          </Tooltip>
          <Typography
            variant="body2"
            color="textSecondary"
            data-testid="news-card-description"
            sx={{
              mt: 1,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {description && description.trim() !== ''
              ? formatDescription(description)
              : title}
          </Typography>
        </CardContent>
      </Card>
    </Link>
  );
};
