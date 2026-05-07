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

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LaptopMacOutlinedIcon from '@mui/icons-material/LaptopMacOutlined';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';

import RefreshIcon from '@mui/icons-material/Refresh';
import { alpha, useTheme } from '@mui/material/styles';
import type { Entity } from '@backstage/catalog-model';
import { useAgentTemplates } from './useAgentTemplates';

export interface AgentTemplateBrowserProps {
  onBack: () => void;
  tag?: string;
  /** Filter templates by `spec.type` (e.g. "agent" or "tool"). */
  specType?: string;
  /** Callback to open a template's source repo in a DevSpace. */
  onOpenInDevSpace?: (gitRepoUrl: string) => void;
  /** Header title. Defaults to "Agent Templates". */
  title?: string;
  /** Descriptive blurb below the header. */
  description?: string;
  /** Title shown when no templates match. Defaults to "No agent templates found". */
  emptyTitle?: string;
  /** Description shown when no templates match. */
  emptyDescription?: string;
  /** Tooltip and aria-label for the DevSpace button. Defaults to "Open in Agent DevSpace". */
  devSpaceLabel?: string;
}

function templateTitle(entity: Entity): string {
  return (entity.metadata.title as string | undefined) ?? entity.metadata.name;
}

function templateDescription(entity: Entity): string {
  return entity.metadata.description ?? '';
}

const MAX_VISIBLE_TAGS = 4;

function templateTags(entity: Entity): string[] {
  return (entity.metadata.tags as string[] | undefined) ?? [];
}

function templateOwner(entity: Entity): string | undefined {
  const spec = entity.spec as Record<string, unknown> | undefined;
  if (!spec) return undefined;
  return typeof spec.owner === 'string' ? spec.owner : undefined;
}

function templateType(entity: Entity): string | undefined {
  const spec = entity.spec as Record<string, unknown> | undefined;
  if (!spec) return undefined;
  return typeof spec.type === 'string' ? spec.type : undefined;
}

function templateSourceRepo(entity: Entity): string | undefined {
  const annotations = entity.metadata.annotations ?? {};
  const sourceUrl =
    annotations['backstage.io/source-location'] ??
    annotations['backstage.io/techdocs-ref'];
  if (sourceUrl && sourceUrl.startsWith('url:')) {
    return sourceUrl.slice(4).replace(/\/catalog-info\.yaml$/i, '');
  }
  return undefined;
}

function buildScaffolderUrl(entity: Entity): string {
  const ns = entity.metadata.namespace ?? 'default';
  const name = entity.metadata.name;
  return `/create/templates/${ns}/${name}`;
}

function defaultEmptyDescription(
  specType: string | undefined,
  tag: string | undefined,
  theme: ReturnType<typeof useTheme>,
): React.ReactNode {
  if (specType) {
    return (
      <>
        Register a Backstage software template with{' '}
        <Typography
          component="code"
          variant="body2"
          sx={{
            px: 0.5,
            bgcolor: alpha(theme.palette.action.hover, 0.1),
            borderRadius: 0.5,
            fontFamily: 'monospace',
          }}
        >
          spec.type: {specType}
        </Typography>{' '}
        in the catalog and it will appear here automatically.
      </>
    );
  }
  if (tag) {
    return (
      <>
        Templates with the tag{' '}
        <Typography
          component="code"
          variant="body2"
          sx={{
            px: 0.5,
            bgcolor: alpha(theme.palette.action.hover, 0.1),
            borderRadius: 0.5,
            fontFamily: 'monospace',
          }}
        >
          {tag}
        </Typography>{' '}
        will appear here automatically.
      </>
    );
  }
  return 'All Backstage software templates (kind: Template) registered in the catalog will appear here automatically.';
}

export function AgentTemplateBrowser({
  onBack,
  tag,
  specType,
  onOpenInDevSpace,
  title: titleLabel = 'Agent Templates',
  description:
    descriptionLabel = 'Choose a software template to scaffold a new agent project. Templates are discovered from the catalog automatically.',
  emptyTitle = 'No agent templates found',
  emptyDescription,
  devSpaceLabel = 'Open in Agent DevSpace',
}: AgentTemplateBrowserProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const hookOpts = tag || specType ? { tag, specType } : undefined;
  const { templates, loading, error, reload } = useAgentTemplates(hookOpts);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.trim().toLowerCase();
    return templates.filter(t => {
      const title = templateTitle(t).toLowerCase();
      const desc = templateDescription(t).toLowerCase();
      const tags = templateTags(t).join(' ').toLowerCase();
      return title.includes(q) || desc.includes(q) || tags.includes(q);
    });
  }, [templates, search]);

  const handleLaunch = (entity: Entity) => {
    navigate(buildScaffolderUrl(entity));
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2,
        }}
      >
        <IconButton onClick={onBack} size="small" aria-label="Back">
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, flex: 1, color: 'text.primary' }}
        >
          {titleLabel}
        </Typography>
        <IconButton
          onClick={reload}
          size="small"
          aria-label="Refresh templates"
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {descriptionLabel}
      </Typography>

      {!loading && templates.length > 0 && (
        <TextField
          size="small"
          placeholder="Search templates by name, description, or tag..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon
                  fontSize="small"
                  sx={{ color: theme.palette.text.disabled }}
                />
              </InputAdornment>
            ),
          }}
        />
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: 1.5,
          }}
        >
          {[0, 1, 2].map(i => (
            <Card key={i} variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Skeleton variant="text" width="70%" height={22} />
                <Skeleton variant="text" width="100%" height={16} />
                <Skeleton variant="text" width="80%" height={16} />
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.75 }}>
                  <Skeleton variant="rounded" width={52} height={20} />
                  <Skeleton variant="rounded" width={44} height={20} />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {!loading && filtered.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 5,
            gap: 1.5,
            border: `1px dashed ${alpha(theme.palette.divider, 0.5)}`,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.action.hover, 0.03),
          }}
        >
          <DescriptionOutlinedIcon
            sx={{ fontSize: 40, color: theme.palette.text.disabled }}
          />
          <Typography
            variant="body1"
            sx={{ fontWeight: 600, color: theme.palette.text.secondary }}
          >
            {emptyTitle}
          </Typography>
          <Typography
            variant="body2"
            color="text.disabled"
            sx={{ textAlign: 'center', maxWidth: 400, px: 2 }}
          >
            {emptyDescription ?? defaultEmptyDescription(specType, tag, theme)}
          </Typography>
        </Box>
      )}

      {!loading && filtered.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: 1.5,
          }}
        >
          {filtered.map(entity => {
            const title = templateTitle(entity);
            const desc = templateDescription(entity);
            const tags = templateTags(entity);
            const owner = templateOwner(entity);
            const type = templateType(entity);
            const sourceRepo = templateSourceRepo(entity);
            const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
            const hiddenCount = tags.length - visibleTags.length;

            return (
              <Card
                key={`${entity.metadata.namespace ?? 'default'}/${entity.metadata.name}`}
                variant="outlined"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                  transition: 'box-shadow 0.15s, border-color 0.15s',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.25)}`,
                  },
                }}
                onClick={() => handleLaunch(entity)}
              >
                <CardContent
                  sx={{
                    flex: 1,
                    p: 2,
                    '&:last-child': { pb: 2 },
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.75,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {title}
                    </Typography>
                    {type && (
                      <Chip
                        label={type}
                        size="small"
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.7rem', flexShrink: 0 }}
                      />
                    )}
                  </Box>

                  {desc && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.4,
                        fontSize: '0.8rem',
                      }}
                    >
                      {desc}
                    </Typography>
                  )}

                  {visibleTags.length > 0 && (
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 0.5,
                        flexWrap: 'nowrap',
                        overflow: 'hidden',
                      }}
                    >
                      {visibleTags.map(t => (
                        <Chip
                          key={t}
                          label={t}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.7rem',
                            flexShrink: 0,
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            color: theme.palette.primary.main,
                          }}
                        />
                      ))}
                      {hiddenCount > 0 && (
                        <Chip
                          label={`+${hiddenCount}`}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.7rem',
                            flexShrink: 0,
                            bgcolor: alpha(theme.palette.action.hover, 0.08),
                            color: theme.palette.text.secondary,
                          }}
                        />
                      )}
                    </Box>
                  )}

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mt: 'auto',
                      pt: 0.5,
                    }}
                  >
                    {owner && (
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                          mr: 1,
                        }}
                      >
                        {owner}
                      </Typography>
                    )}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        flexShrink: 0,
                        ml: 'auto',
                      }}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={e => {
                          e.stopPropagation();
                          handleLaunch(entity);
                        }}
                        sx={{
                          textTransform: 'none',
                          fontSize: '0.75rem',
                          py: 0.25,
                          px: 1.5,
                        }}
                      >
                        Use Template
                      </Button>
                      {onOpenInDevSpace && sourceRepo && (
                        <Tooltip title={devSpaceLabel}>
                          <IconButton
                            size="small"
                            onClick={e => {
                              e.stopPropagation();
                              onOpenInDevSpace(sourceRepo);
                            }}
                            sx={{
                              color: theme.palette.text.secondary,
                              '&:hover': {
                                color: theme.palette.primary.main,
                              },
                            }}
                            aria-label={devSpaceLabel}
                          >
                            <LaptopMacOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
