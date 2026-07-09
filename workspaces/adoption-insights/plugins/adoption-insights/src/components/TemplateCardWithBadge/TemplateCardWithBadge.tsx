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

import { useCallback } from 'react';

import { RELATION_OWNED_BY } from '@backstage/catalog-model';
import { ItemCardHeader, MarkdownContent } from '@backstage/core-components';
import { useAnalytics } from '@backstage/core-plugin-api';
import {
  EntityRefLinks,
  FavoriteEntity,
  getEntityRelations,
} from '@backstage/plugin-catalog-react';
import { usePermission } from '@backstage/plugin-permission-react';
import { taskCreatePermission } from '@backstage/plugin-scaffolder-common/alpha';
import type { TemplateEntityV1beta3 } from '@backstage/plugin-scaffolder-common';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import UserIcon from '@mui/icons-material/PersonOutlined';

import { TimeSavedBadge } from '../TimeSavedBadge';

/**
 * @public
 */
export type TemplateCardWithBadgeProps = {
  template: TemplateEntityV1beta3;
  onSelected?: (template: TemplateEntityV1beta3) => void;
};

/**
 * @public
 */
export const TemplateCardWithBadge = ({
  template,
  onSelected,
}: TemplateCardWithBadgeProps) => {
  const theme = useTheme();
  const analytics = useAnalytics();
  const ownedByRelations = getEntityRelations(template, RELATION_OWNED_BY);
  const { allowed: canCreateTask } = usePermission({
    permission: taskCreatePermission,
  });

  const hasTags = !!template.metadata.tags?.length;
  const title = template.metadata.title ?? template.metadata.name;
  const type = template.spec?.type as string | undefined;
  const description = template.metadata.description ?? 'No description';

  const handleChoose = useCallback(() => {
    analytics.captureEvent('click', 'Template has been opened');
    onSelected?.(template);
  }, [analytics, onSelected, template]);

  const backstageTheme = theme as typeof theme & {
    getPageTheme?: (opts: { themeId: string }) => {
      backgroundImage: string;
      fontColor: string;
    };
  };
  const pageTheme = type
    ? backstageTheme.getPageTheme?.({ themeId: type })
    : undefined;

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ItemCardHeader
        title={title}
        subtitle={
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="body2" component="span">
              {type}
            </Typography>
            <FavoriteEntity
              entity={template}
              style={{ padding: 0, marginLeft: 6 }}
            />
          </Box>
        }
        classes={
          pageTheme
            ? {
                root: undefined as unknown as string,
              }
            : undefined
        }
        {...(pageTheme && {
          style: {
            backgroundImage: pageTheme.backgroundImage,
            color: pageTheme.fontColor,
          },
        })}
      />

      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
          }}
        >
          <MarkdownContent content={description} />
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <TimeSavedBadge annotations={template.metadata.annotations} />
          {hasTags &&
            template.metadata.tags!.map(tag => (
              <Chip size="small" label={tag} key={tag} />
            ))}
        </Box>
      </CardContent>

      <CardActions sx={{ padding: '16px' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            flex: 1,
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flex: 1,
              color: theme.palette.primary.main,
            }}
          >
            {ownedByRelations.length > 0 && (
              <>
                <UserIcon fontSize="small" />
                <EntityRefLinks
                  style={{ marginLeft: '8px' }}
                  entityRefs={ownedByRelations}
                  defaultKind="Group"
                  hideIcons
                />
              </>
            )}
          </Box>
          {canCreateTask && (
            <Button
              size="small"
              variant="outlined"
              color="primary"
              onClick={handleChoose}
            >
              Choose
            </Button>
          )}
        </Box>
      </CardActions>
    </Card>
  );
};
