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

import { EntityRefLink } from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';
import { MarkdownContent } from '@backstage/core-components';

import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';

import TagList from './TagList';

interface EntityCardProps {
  title: string;
  version?: string;
  description: string;
  tags: string[];
  kind: string;
  entity: Entity;
}

const EntityCard: FC<EntityCardProps> = ({
  title,
  description,
  tags,
  kind,
  entity,
}) => {
  return (
    <Card
      elevation={0}
      sx={{
        border: theme => `1px solid ${theme.palette.grey[400]}`,
        overflow: 'auto',
        height: '100%',
        width: '100%',
      }}
    >
      <CardContent
        sx={{
          pb: 2,
          '&:last-child': {
            pb: 2,
          },
          backgroundColor: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ overflow: 'hidden' }}>
          <EntityRefLink
            entityRef={entity}
            style={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '0.875rem',
              fontWeight: '500',
              textDecoration: 'underline',
            }}
          >
            {title}
          </EntityRefLink>
        </Box>
        <Box
          sx={{
            pt: 2,
            height: '175px',
            overflow: 'hidden',
          }}
        >
          <Typography
            variant="body2"
            paragraph
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 8,
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
        <TagList kind={kind} tags={tags} />
      </CardContent>
    </Card>
  );
};

export default EntityCard;
