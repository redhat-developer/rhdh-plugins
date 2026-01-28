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
import type { FC } from 'react';

import { Link } from '@backstage/core-components';
import { MarkdownContent } from '@backstage/core-components';

import Box from '@mui/material/Box';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';

interface TemplateCardProps {
  link: string;
  title: string;
  description: string;
  kind: string;
  type: string;
}

const TemplateCard: FC<TemplateCardProps> = ({
  link,
  title,
  description,
  kind,
  type,
}) => {
  const params = new URLSearchParams({
    'filters[kind]': kind,
    'filters[type]': type,
    'filters[user]': 'all',
  });

  const catalogLink = `/catalog?${params.toString()}`;

  return (
    <Card
      elevation={0}
      sx={{
        border: theme => `1px solid ${theme.palette.grey[400]}`,
        overflow: 'auto',
        maxHeight: '100%',
      }}
    >
      <CardContent
        sx={{
          pb: 2,
          '&:last-child': {
            pb: 2,
          },
          backgroundColor: 'transparent',
        }}
      >
        <Box sx={{ margin: '8px 0', height: '21px', overflow: 'hidden' }}>
          <Link
            to={link}
            underline="always"
            style={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '0.9rem',
              fontWeight: '500',
            }}
          >
            {title}
          </Link>
        </Box>
        <Box
          sx={{
            padding: '8px 0',
            height: '90px',
            overflow: 'hidden',
          }}
        >
          <Typography
            variant="body2"
            paragraph
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              '& p': {
                margin: 'auto',
              },
            }}
          >
            <MarkdownContent content={description} />
          </Typography>
        </Box>
        <Box sx={{ pt: 2 }}>
          {type && (
            <Link to={catalogLink}>
              <Chip
                label={
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 400 }}>
                    {type}
                  </Typography>
                }
                key={type}
                size="small"
              />
            </Link>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default TemplateCard;
