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
import { FC } from 'react';
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

export const NewsCard: FC<NewsCardProps> = ({
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
          height: thumbnail ? '330px' : '180px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRadius: 4,
          border: `1px solid ${
            theme.palette.mode === 'dark' ? '#57585a' : '#E4E4E4'
          }`,
          padding: `0 ${theme.spacing(3)} 0 ${theme.spacing(3)}`,
          paddingTop: thumbnail ? `${theme.spacing(3)}` : `${theme.spacing(1)}`,
        }}
      >
        {thumbnail && (
          <CardMedia
            component="img"
            height="140"
            image={thumbnail}
            alt={title}
            sx={{
              objectFit: 'cover',
              height: '140px',
            }}
          />
        )}
        <CardContent
          sx={{
            padding: `${theme.spacing(2)} ${theme.spacing(0.5)} ${theme.spacing(
              0.5,
            )} ${theme.spacing(0.5)}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            backgroundColor:
              theme.palette.mode === 'dark'
                ? '#2F3134'
                : theme.palette.background.paper,
            gap: theme.spacing(0.5),
            ...(thumbnail ? {} : { justifyContent: 'center', flex: 1 }), // Center vertically if no thumbnail
          }}
        >
          <Tooltip title={title} placement="top">
            <Typography
              variant="h6"
              color="primary"
              gutterBottom
              sx={{
                fontFamily: theme.typography.body1.fontFamily,
                fontWeight: 450,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
              }}
            >
              {title}
            </Typography>
          </Tooltip>
          <Typography
            variant="body2"
            data-testid="news-card-description"
            sx={{
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
