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
import {
  RELATION_OWNED_BY,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import {
  ItemCardHeader,
  Link,
  MarkdownContent,
  UserIcon,
} from '@backstage/core-components';
import {
  IconComponent,
  useAnalytics,
  useApp,
  useRouteRef,
} from '@backstage/core-plugin-api';
import { useTranslationRef } from '@backstage/frontend-plugin-api';
import {
  EntityRefLinks,
  FavoriteEntity,
  entityRouteParams,
  entityRouteRef,
  getEntityRelations,
} from '@backstage/plugin-catalog-react';
import { usePermission } from '@backstage/plugin-permission-react';
import { taskCreatePermission } from '@backstage/plugin-scaffolder-common/alpha';
import { TemplateCardComponentProps } from '@backstage/plugin-scaffolder-react/alpha';
import { scaffolderReactTranslationRef } from '@backstage/plugin-scaffolder-react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import DescriptionIcon from '@mui/icons-material/Description';
import LanguageIcon from '@mui/icons-material/Language';

import type { TemplateCardActionData, TemplateCardBadgeData } from '../types';

/** @alpha */
export interface TemplateCardProps extends TemplateCardComponentProps {
  actionOverride?: TemplateCardActionData['component'];
  badges?: TemplateCardBadgeData[];
}

const TemplateDetailButton = (props: {
  template: TemplateCardComponentProps['template'];
  fontColor: string;
}) => {
  const { template, fontColor } = props;
  const catalogEntityRoute = useRouteRef(entityRouteRef);
  const { t } = useTranslationRef(scaffolderReactTranslationRef);
  const entityRef = stringifyEntityRef(template);
  const app = useApp();
  const TemplateIcon = app.getSystemIcon('kind:template') || DescriptionIcon;

  return (
    <Tooltip id={`tooltip-${entityRef}`} title={t('cardHeader.detailBtnTitle')}>
      <IconButton
        aria-label={t('cardHeader.detailBtnTitle')}
        id={`viewDetail-${entityRef}`}
        sx={{ padding: 0 }}
        size="small"
      >
        <Typography component="span">
          <Link
            to={catalogEntityRoute(entityRouteParams(template))}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <TemplateIcon sx={{ color: fontColor }} />
          </Link>
        </Typography>
      </IconButton>
    </Tooltip>
  );
};

const CardLink = (props: {
  icon: IconComponent;
  text: string;
  url: string;
}) => {
  const { icon: Icon, text, url } = props;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
      <Icon fontSize="small" />
      <Link style={{ marginLeft: '8px' }} to={url}>
        {text || url}
      </Link>
    </Box>
  );
};

/**
 * TemplateCard that mirrors the upstream scaffolder card with extension
 * support for the primary action button.
 *
 * @alpha
 */
export const TemplateCard = (props: TemplateCardProps) => {
  const {
    additionalLinks,
    onSelected,
    template,
    actionOverride: ActionOverride,
    badges = [],
  } = props;
  const analytics = useAnalytics();
  const app = useApp();
  const theme = useTheme();
  const { t } = useTranslationRef(scaffolderReactTranslationRef);
  const ownedByRelations = getEntityRelations(template, RELATION_OWNED_BY);
  const hasTags = !!template.metadata.tags?.length;
  const hasBadgesOrTags = badges.length > 0 || hasTags;
  const hasLinks =
    !!additionalLinks?.length || !!template.metadata.links?.length;
  const displayDefaultDivider = !hasBadgesOrTags && !hasLinks;

  const { allowed: canCreateTask } = usePermission({
    permission: taskCreatePermission,
  });

  const handleChoose = useCallback(() => {
    analytics.captureEvent('click', 'Template has been opened');
    onSelected?.();
  }, [analytics, onSelected]);

  const templateTitle = template.metadata.title ?? template.metadata.name;
  const templateType = template.spec.type;

  const themeForType = (theme as any).getPageTheme?.({
    themeId: templateType,
  }) ?? { fontColor: '#fff', backgroundImage: 'none' };

  const iconResolver = (key?: string): IconComponent =>
    key ? app.getSystemIcon(key) ?? LanguageIcon : LanguageIcon;

  return (
    <Card>
      <Box
        data-testid="template-card-header"
        sx={{
          backgroundImage: themeForType.backgroundImage,
          color: themeForType.fontColor,
          '& *': {
            color: 'inherit !important',
          },
          '& > *': {
            backgroundImage: 'inherit !important',
          },
        }}
      >
        <ItemCardHeader
          title={templateTitle}
          subtitle={
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>{templateType}</div>
              <div>
                <TemplateDetailButton
                  template={template}
                  fontColor={themeForType.fontColor}
                />
                <FavoriteEntity
                  entity={template}
                  style={{ padding: 0, marginLeft: 6 }}
                />
              </div>
            </Box>
          }
        />
      </Box>
      <CardContent>
        <Grid container spacing={2} data-testid="template-card-content">
          <Grid item xs={12}>
            <Box
              data-testid="template-card-content-container"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 10,
                WebkitBoxOrient: 'vertical',
                '& :first-of-type': { margin: 0 },
              }}
            >
              <MarkdownContent
                content={
                  template.metadata.description ??
                  t('templateCard.noDescription')
                }
              />
            </Box>
          </Grid>
          {displayDefaultDivider && (
            <Grid item xs={12}>
              <Divider data-testid="template-card-separator" />
            </Grid>
          )}
          {hasBadgesOrTags && (
            <>
              <Grid item xs={12}>
                <Divider data-testid="template-card-separator--tags" />
              </Grid>
              <Grid item xs={12}>
                <Box
                  sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}
                  data-testid="template-card-tags"
                >
                  {[...badges]
                    .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
                    .map((badge, index) => {
                      const BadgeComponent = badge.component;
                      return (
                        <BadgeComponent
                          key={`badge-${index}`}
                          template={
                            template as unknown as Record<string, unknown>
                          }
                        />
                      );
                    })}
                  {template.metadata.tags?.map(tag => (
                    <Chip
                      key={tag}
                      style={{ margin: 0 }}
                      size="small"
                      label={tag}
                      data-testid={`template-card-tag-chip-${tag}`}
                    />
                  ))}
                </Box>
              </Grid>
            </>
          )}
          {hasLinks && (
            <>
              <Grid item xs={12}>
                <Divider data-testid="template-card-separator--links" />
              </Grid>
              <Grid item xs={12}>
                <Grid container spacing={2} data-testid="template-card-links">
                  {additionalLinks?.map(({ icon, text, url }, index) => (
                    <Grid
                      item
                      xs={6}
                      key={index}
                      data-testid="template-card-links--item"
                    >
                      <CardLink icon={icon} text={text} url={url} />
                    </Grid>
                  ))}
                  {template.metadata.links?.map(
                    ({ url, icon, title }, index) => (
                      <Grid
                        item
                        xs={6}
                        key={index}
                        data-testid="template-card-links--metalink"
                      >
                        <CardLink
                          icon={iconResolver(icon)}
                          text={title || url}
                          url={url}
                        />
                      </Grid>
                    ),
                  )}
                </Grid>
              </Grid>
            </>
          )}
        </Grid>
      </CardContent>
      <CardActions
        sx={{ padding: '16px', flex: 1, alignItems: 'flex-end' }}
        data-testid="template-card-actions"
      >
        <Box
          data-testid="template-card-actions--footer"
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            flex: 1,
            alignItems: 'center',
          }}
        >
          <Box
            data-testid="template-card-actions--ownedby"
            sx={{
              display: 'flex',
              alignItems: 'center',
              flex: 1,
              color: theme.palette.text.secondary,
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
          {ActionOverride ? (
            <ActionOverride
              template={template as unknown as Record<string, unknown>}
              onSelected={handleChoose}
              canCreateTask={canCreateTask}
            />
          ) : (
            canCreateTask && (
              <Button
                size="small"
                variant="outlined"
                color="primary"
                data-testid="template-card-actions--create"
                onClick={handleChoose}
              >
                {t('templateCard.chooseButtonText')}
              </Button>
            )
          )}
        </Box>
      </CardActions>
    </Card>
  );
};
