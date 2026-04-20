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

import {
  useState,
  useMemo,
  useCallback,
  type FC,
  type MouseEvent,
} from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Fade from '@mui/material/Fade';
import Slide from '@mui/material/Slide';
import Skeleton from '@mui/material/Skeleton';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { useTheme, alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ChatIcon from '@mui/icons-material/Chat';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import HistoryIcon from '@mui/icons-material/History';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import StreamIcon from '@mui/icons-material/Stream';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import { useApi } from '@backstage/core-plugin-api';
import { augmentApiRef } from '../../api';
import type { ChatAgentConfig } from '../../types';
import type { AgentWithCard } from './agentUtils';
import {
  getAgentAvatarColor,
  isAgentReady,
  sanitizeDescription,
  sortAgents,
} from './agentUtils';
import { useAgentGalleryData } from './useAgentGalleryData';
import { usePinnedRecent } from './usePinnedRecent';

type SortOption = 'name' | 'status' | 'newest';

interface AgentCatalogDialogProps {
  open: boolean;
  onClose: () => void;
  onAgentSelect: (agentId: string, agentName: string) => void;
  onStarterSelect?: (agentId: string, prompt: string) => void;
  chatAgentConfigs: ChatAgentConfig[];
}

// ---------------------------------------------------------------------------
// Featured card (horizontal top row)
// ---------------------------------------------------------------------------

interface FeaturedCardProps {
  agent: AgentWithCard;
  config?: ChatAgentConfig;
  onSelect: (agent: AgentWithCard) => void;
}

const FeaturedCard: FC<FeaturedCardProps> = ({ agent, config, onSelect }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const displayName =
    config?.displayName || agent.agentCard?.name || agent.name;
  const description =
    config?.description || agent.agentCard?.description || agent.description;
  const avatarColor = config?.accentColor || getAgentAvatarColor(displayName);
  const avatarUrl = config?.avatarUrl;
  const ready = isAgentReady(agent.status);

  return (
    <Card
      variant="outlined"
      sx={{
        width: 240,
        minHeight: 110,
        flexShrink: 0,
        borderRadius: 3,
        transition: 'all 0.2s ease',
        opacity: ready ? 1 : 0.6,
        display: 'flex',
        flexDirection: 'column',
        scrollSnapAlign: 'start',
        borderColor: alpha(theme.palette.divider, isDark ? 0.15 : 0.18),
        bgcolor: alpha(theme.palette.background.paper, isDark ? 0.6 : 0.9),
        boxShadow: isDark
          ? `0 2px 8px ${alpha('#000', 0.2)}`
          : `0 2px 8px ${alpha('#000', 0.05)}`,
        '&:hover': {
          borderColor: alpha(avatarColor, 0.4),
          boxShadow: isDark
            ? `0 8px 24px ${alpha(avatarColor, 0.15)}`
            : `0 8px 24px ${alpha(avatarColor, 0.1)}`,
          transform: ready ? 'translateY(-2px)' : undefined,
        },
      }}
    >
      <CardActionArea
        onClick={() => onSelect(agent)}
        sx={{
          borderRadius: 3,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
      >
        <CardContent
          sx={{
            p: 2,
            '&:last-child': { pb: 2 },
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              mb: 1,
            }}
          >
            {avatarUrl ? (
              <Box
                component="img"
                src={avatarUrl}
                alt={displayName}
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  objectFit: 'cover',
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  bgcolor: alpha(avatarColor, isDark ? 0.2 : 0.12),
                  color: avatarColor,
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </Box>
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                noWrap
                sx={{
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  lineHeight: 1.3,
                }}
              >
                {displayName}
              </Typography>
              {!ready && (
                <Chip
                  label={agent.status}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ height: 16, fontSize: '0.65rem', mt: 0.25 }}
                />
              )}
            </Box>
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: '0.72rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.4,
              flex: 1,
            }}
          >
            {description ? sanitizeDescription(description, 80) : '\u00A0'}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Compact grid card
// ---------------------------------------------------------------------------

interface GridCardProps {
  agent: AgentWithCard;
  isSelected: boolean;
  isPinned: boolean;
  onSelect: (agent: AgentWithCard) => void;
  onInfo: (agent: AgentWithCard) => void;
  onTogglePin: (agentId: string, e: MouseEvent) => void;
  index: number;
}

const GridCard: FC<GridCardProps> = ({
  agent,
  isSelected,
  isPinned,
  onSelect,
  onInfo,
  onTogglePin,
  index,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const card = agent.agentCard;
  const agentId = `${agent.namespace}/${agent.name}`;
  const displayName = card?.name || agent.name;
  const avatarColor = getAgentAvatarColor(displayName);
  const ready = isAgentReady(agent.status);
  const rawDesc = card?.description || agent.description || '';
  const cleanDesc = sanitizeDescription(rawDesc, 70);

  return (
    <Fade in timeout={80 + index * 20}>
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          transition: 'all 0.2s ease',
          position: 'relative',
          height: 132,
          display: 'flex',
          flexDirection: 'column',
          opacity: ready ? 1 : 0.55,
          borderColor: isSelected
            ? theme.palette.primary.main
            : alpha(theme.palette.divider, isDark ? 0.15 : 0.18),
          bgcolor: isSelected
            ? alpha(theme.palette.primary.main, isDark ? 0.06 : 0.03)
            : alpha(theme.palette.background.paper, isDark ? 0.6 : 0.9),
          boxShadow: isDark
            ? `0 1px 4px ${alpha('#000', 0.2)}`
            : `0 1px 4px ${alpha('#000', 0.06)}`,
          '&:hover': {
            borderColor: alpha(avatarColor, 0.4),
            boxShadow: isDark
              ? `0 4px 16px ${alpha(avatarColor, 0.15)}`
              : `0 4px 16px ${alpha(avatarColor, 0.1)}`,
            transform: ready ? 'translateY(-2px)' : undefined,
          },
          '&:focus-within': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        }}
      >
        <Box
          className="grid-pin"
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            zIndex: 2,
            display: 'flex',
            gap: 0.25,
            transition: 'opacity 0.15s ease',
          }}
        >
          <Tooltip title="Details">
            <IconButton
              size="small"
              onClick={e => {
                e.stopPropagation();
                onInfo(agent);
              }}
              sx={{
                p: 0.3,
                color: alpha(theme.palette.text.secondary, 0.5),
                borderRadius: 1.5,
                '&:hover': {
                  color: theme.palette.text.secondary,
                  bgcolor: alpha(theme.palette.background.paper, 0.85),
                },
              }}
            >
              <InfoOutlinedIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={isPinned ? 'Unpin' : 'Pin'}>
            <IconButton
              size="small"
              onClick={e => onTogglePin(agentId, e)}
              sx={{
                p: 0.3,
                color: isPinned
                  ? theme.palette.warning.main
                  : alpha(theme.palette.text.secondary, 0.35),
                opacity: isPinned ? 1 : 0,
                borderRadius: 1.5,
                transition: 'all 0.15s ease',
                '.MuiCard-root:hover &': { opacity: 1 },
                '&:hover': {
                  color: isPinned
                    ? theme.palette.warning.main
                    : theme.palette.text.secondary,
                  bgcolor: alpha(theme.palette.background.paper, 0.85),
                },
              }}
            >
              {isPinned ? (
                <StarIcon sx={{ fontSize: 13 }} />
              ) : (
                <StarBorderIcon sx={{ fontSize: 13 }} />
              )}
            </IconButton>
          </Tooltip>
        </Box>

        <CardActionArea
          onClick={() => onSelect(agent)}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
          }}
        >
          <CardContent
            sx={{
              p: 1.5,
              '&:last-child': { pb: 1.5 },
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 0.75,
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  bgcolor: alpha(avatarColor, isDark ? 0.2 : 0.12),
                  color: avatarColor,
                  flexShrink: 0,
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  noWrap
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    lineHeight: 1.3,
                  }}
                >
                  {displayName}
                </Typography>
                {!ready && (
                  <Chip
                    label={agent.status}
                    size="small"
                    color="warning"
                    variant="outlined"
                    sx={{ height: 16, fontSize: '0.65rem', mt: 0.25 }}
                  />
                )}
              </Box>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: '0.75rem',
                lineHeight: 1.45,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                flex: 1,
              }}
            >
              {cleanDesc}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    </Fade>
  );
};

// ---------------------------------------------------------------------------
// Preview panel (right side detail)
// ---------------------------------------------------------------------------

interface PreviewPanelProps {
  agent: AgentWithCard;
  config?: ChatAgentConfig;
  onStart: (agentId: string, agentName: string) => void;
  onStarterClick: (agentId: string, prompt: string) => void;
}

const PreviewPanel: FC<PreviewPanelProps> = ({
  agent,
  config,
  onStart,
  onStarterClick,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const card = agent.agentCard;
  const displayName = config?.displayName || card?.name || agent.name;
  const avatarColor = config?.accentColor || getAgentAvatarColor(displayName);
  const avatarUrl = config?.avatarUrl;
  const ready = isAgentReady(agent.status);
  const agentId = `${agent.namespace}/${agent.name}`;
  const skills = card?.skills || [];
  const rawDesc = card?.description || agent.description || '';
  const cleanDesc = sanitizeDescription(rawDesc, 500);

  const starters =
    config?.conversationStarters ||
    skills.flatMap(s => s.examples || []).slice(0, 4);

  const handleStart = () => onStart(agentId, displayName);

  const LABEL_SX = {
    fontWeight: 600,
    color: 'text.secondary',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    fontSize: '0.7rem',
    display: 'block',
    mb: 0.75,
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '80vh',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          pb: 2,
          background: isDark
            ? `linear-gradient(180deg, ${alpha(avatarColor, 0.08)} 0%, transparent 100%)`
            : `linear-gradient(180deg, ${alpha(avatarColor, 0.04)} 0%, transparent 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, isDark ? 0.08 : 0.12)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          {avatarUrl ? (
            <Box
              component="img"
              src={avatarUrl}
              alt={displayName}
              sx={{
                width: 48,
                height: 48,
                borderRadius: 3,
                objectFit: 'cover',
              }}
            />
          ) : (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(avatarColor, isDark ? 0.2 : 0.12),
                color: avatarColor,
                fontWeight: 700,
                fontSize: '1.3rem',
                flexShrink: 0,
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </Box>
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.3 }}
            >
              {displayName}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mt: 0.25,
                flexWrap: 'wrap',
              }}
            >
              <Chip
                label={agent.status}
                size="small"
                color={ready ? 'success' : 'warning'}
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
              {card?.version && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.7rem',
                    color: theme.palette.text.disabled,
                  }}
                >
                  v{card.version}
                </Typography>
              )}
              <Chip
                label={agent.namespace}
                size="small"
                variant="outlined"
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  borderColor: alpha(theme.palette.divider, 0.3),
                  color: theme.palette.text.disabled,
                }}
              />
            </Box>
          </Box>
        </Box>

        <Button
          variant="contained"
          fullWidth
          startIcon={<ChatIcon />}
          onClick={handleStart}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 3,
            py: 1,
          }}
        >
          Start Conversation
        </Button>
        {!ready && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 0.5,
              color: theme.palette.warning.main,
              fontSize: '0.7rem',
            }}
          >
            This agent is {agent.status.toLowerCase()} and may not respond
          </Typography>
        )}
      </Box>

      {/* Scrollable content */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, py: 1.5 }}>
        {/* Starters */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={LABEL_SX}>
            Try asking
          </Typography>
          {starters.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {starters.map((s, i) => (
                <Chip
                  key={i}
                  icon={<PlayArrowIcon sx={{ fontSize: 12 }} />}
                  label={s}
                  size="small"
                  variant="outlined"
                  onClick={() => onStarterClick(agentId, s)}
                  sx={{
                    height: 'auto',
                    py: 0.5,
                    borderRadius: 2.5,
                    justifyContent: 'flex-start',
                    transition: 'all 0.2s ease',
                    '& .MuiChip-label': {
                      fontSize: '0.72rem',
                      whiteSpace: 'normal',
                      lineHeight: 1.4,
                    },
                    borderColor: alpha(theme.palette.primary.main, 0.25),
                    color: theme.palette.text.primary,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.06),
                      borderColor: theme.palette.primary.main,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                    },
                  }}
                />
              ))}
            </Box>
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.disabled,
                fontStyle: 'italic',
                fontSize: '0.75rem',
              }}
            >
              Start a conversation to explore this agent
            </Typography>
          )}
        </Box>

        {/* Description */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={LABEL_SX}>
            About
          </Typography>
          {cleanDesc && cleanDesc !== 'No description available' ? (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.primary,
                lineHeight: 1.6,
                fontSize: '0.8rem',
              }}
            >
              {cleanDesc}
            </Typography>
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.disabled,
                fontStyle: 'italic',
                fontSize: '0.78rem',
              }}
            >
              No description provided
            </Typography>
          )}
        </Box>

        {/* Skills */}
        {skills.length > 0 && (
          <>
            <Divider
              sx={{ mb: 1.5, borderColor: alpha(theme.palette.divider, 0.3) }}
            />
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={LABEL_SX}>
                Skills ({skills.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {skills.map((skill, idx) => (
                  <Box
                    key={skill.id || idx}
                    sx={{
                      p: 1.25,
                      borderRadius: 2,
                      bgcolor: alpha(
                        theme.palette.background.paper,
                        isDark ? 0.5 : 0.8,
                      ),
                      border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.1 : 0.12)}`,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, fontSize: '0.78rem' }}
                    >
                      {skill.name || skill.id || `Skill ${idx + 1}`}
                    </Typography>
                    {skill.description && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.secondary,
                          display: 'block',
                          mt: 0.25,
                          lineHeight: 1.4,
                        }}
                      >
                        {skill.description}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          </>
        )}

        {/* Capabilities */}
        <Divider
          sx={{ mb: 1.5, borderColor: alpha(theme.palette.divider, 0.3) }}
        />
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={LABEL_SX}>
            Capabilities
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {card?.streaming && (
              <Chip
                icon={<StreamIcon sx={{ fontSize: 13 }} />}
                label="Streaming"
                size="small"
                variant="outlined"
                color="info"
                sx={{
                  height: 24,
                  fontSize: '0.7rem',
                  borderRadius: 2,
                }}
              />
            )}
            {agent.labels?.protocol && (
              <Chip
                icon={<SyncAltIcon sx={{ fontSize: 13 }} />}
                label="A2A Protocol"
                size="small"
                variant="outlined"
                sx={{
                  height: 24,
                  fontSize: '0.7rem',
                  borderRadius: 2,
                }}
              />
            )}
            {!card?.streaming && !agent.labels?.protocol && (
              <Chip
                label="Standard request/response"
                size="small"
                variant="outlined"
                sx={{
                  height: 24,
                  fontSize: '0.7rem',
                  borderRadius: 2,
                  color: theme.palette.text.disabled,
                  borderColor: alpha(theme.palette.divider, 0.3),
                }}
              />
            )}
          </Box>
        </Box>

        {/* Technical details */}
        <Divider
          sx={{ mb: 1.5, borderColor: alpha(theme.palette.divider, 0.3) }}
        />
        <Box>
          <Typography variant="caption" sx={LABEL_SX}>
            Details
          </Typography>
          {(() => {
            const DETAIL_CELL_SX = {
              p: 1,
              borderRadius: 2,
              bgcolor: alpha(
                theme.palette.background.paper,
                isDark ? 0.4 : 0.6,
              ),
              border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.08 : 0.1)}`,
            } as const;
            const detailFields = [
              agent.labels?.framework && {
                label: 'Framework',
                value: agent.labels.framework,
              },
              { label: 'Workspace', value: agent.namespace },
              card?.version && { label: 'Version', value: card.version },
              agent.createdAt && {
                label: 'Created',
                value: new Date(agent.createdAt).toLocaleDateString(),
              },
            ].filter(Boolean) as { label: string; value: string }[];
            const cols = detailFields.length <= 2 ? '1fr' : '1fr 1fr';
            return (
              <Box sx={{ display: 'grid', gridTemplateColumns: cols, gap: 1 }}>
                {detailFields.map(f => (
                  <Box key={f.label} sx={DETAIL_CELL_SX}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.text.disabled,
                        display: 'block',
                        fontSize: '0.65rem',
                      }}
                    >
                      {f.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: '0.78rem', fontWeight: 500 }}
                    >
                      {f.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            );
          })()}
        </Box>
      </Box>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Main dialog
// ---------------------------------------------------------------------------

export const AgentCatalogDialog: FC<AgentCatalogDialogProps> = ({
  open,
  onClose,
  onAgentSelect,
  onStarterSelect,
  chatAgentConfigs,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const api = useApi(augmentApiRef);
  const { agents, loading } = useAgentGalleryData(api);
  const { pinnedIds, recentIds, togglePin, addRecent } = usePinnedRecent();

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [sort, setSort] = useState<SortOption>('name');
  const [frameworkFilter, setFrameworkFilter] = useState('');
  const [previewAgent, setPreviewAgent] = useState<AgentWithCard | null>(null);

  // Admin visibility filter
  const visibleAgents = useMemo(() => {
    if (chatAgentConfigs.length === 0) return agents;
    const hiddenIds = new Set(
      chatAgentConfigs.filter(c => !c.visible).map(c => c.agentId),
    );
    return agents.filter(a => !hiddenIds.has(`${a.namespace}/${a.name}`));
  }, [agents, chatAgentConfigs]);

  // Featured agents
  const featured = useMemo(() => {
    const featuredConfigs = chatAgentConfigs
      .filter(c => c.featured && c.visible !== false)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    if (featuredConfigs.length === 0) return [];
    return featuredConfigs
      .map(cfg => {
        const agent = visibleAgents.find(
          a => `${a.namespace}/${a.name}` === cfg.agentId,
        );
        return agent ? { agent, config: cfg } : null;
      })
      .filter(Boolean) as Array<{
      agent: AgentWithCard;
      config: ChatAgentConfig;
    }>;
  }, [visibleAgents, chatAgentConfigs]);

  // Framework list for filter
  const frameworks = useMemo(() => {
    const set = new Set<string>();
    visibleAgents.forEach(a => {
      if (a.labels?.framework) set.add(a.labels.framework);
    });
    return Array.from(set).sort();
  }, [visibleAgents]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = visibleAgents;
    if (tab === 'pinned') {
      list = list.filter(a => pinnedIds.includes(`${a.namespace}/${a.name}`));
    } else if (tab === 'recent') {
      const recentSet = new Set(recentIds);
      list = list.filter(a => recentSet.has(`${a.namespace}/${a.name}`));
      list.sort((a, b) => {
        const aIdx = recentIds.indexOf(`${a.namespace}/${a.name}`);
        const bIdx = recentIds.indexOf(`${b.namespace}/${b.name}`);
        return aIdx - bIdx;
      });
      return list;
    }
    if (frameworkFilter) {
      list = list.filter(a => a.labels?.framework === frameworkFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a => {
        const name = (a.agentCard?.name || a.name).toLowerCase();
        const desc = (
          a.agentCard?.description ||
          a.description ||
          ''
        ).toLowerCase();
        const skills = (a.agentCard?.skills || [])
          .map(s => (s.name || '').toLowerCase())
          .join(' ');
        return name.includes(q) || desc.includes(q) || skills.includes(q);
      });
    }
    return sortAgents(list, sort);
  }, [visibleAgents, tab, search, pinnedIds, recentIds, sort, frameworkFilter]);

  const handleAgentSelect = useCallback(
    (agentId: string, agentName: string) => {
      addRecent(agentId);
      onAgentSelect(agentId, agentName);
      onClose();
    },
    [onAgentSelect, onClose, addRecent],
  );

  const handleStarterClick = useCallback(
    (agentId: string, prompt: string) => {
      addRecent(agentId);
      if (onStarterSelect) {
        onStarterSelect(agentId, prompt);
      } else {
        const name = agentId.includes('/')
          ? agentId.split('/').pop()!
          : agentId;
        onAgentSelect(agentId, name);
      }
      onClose();
    },
    [onAgentSelect, onStarterSelect, onClose, addRecent],
  );

  const handleDirectSelect = useCallback(
    (agent: AgentWithCard) => {
      const agentId = `${agent.namespace}/${agent.name}`;
      const displayName = agent.agentCard?.name || agent.name;
      handleAgentSelect(agentId, displayName);
    },
    [handleAgentSelect],
  );

  const handlePreviewSelect = useCallback(
    (agent: AgentWithCard) => setPreviewAgent(agent),
    [],
  );

  const handlePreviewStart = useCallback(
    (agentId: string, agentName: string) =>
      handleAgentSelect(agentId, agentName),
    [handleAgentSelect],
  );

  const previewConfig = useMemo(
    () =>
      previewAgent
        ? chatAgentConfigs.find(
            c => c.agentId === `${previewAgent.namespace}/${previewAgent.name}`,
          )
        : undefined,
    [previewAgent, chatAgentConfigs],
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      TransitionComponent={Slide}
      TransitionProps={{ direction: 'up' } as Record<string, unknown>}
      PaperProps={{
        sx: {
          width: '95vw',
          maxWidth: 1200,
          height: '85vh',
          borderRadius: 4,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: theme.palette.background.default,
          border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.15 : 0.12)}`,
          boxShadow: isDark
            ? `0 24px 80px ${alpha('#000', 0.5)}`
            : `0 24px 80px ${alpha('#000', 0.12)}`,
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: alpha('#000', isDark ? 0.5 : 0.25),
          },
        },
      }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <Box
        sx={{
          px: 3,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, isDark ? 0.12 : 0.15)}`,
          bgcolor: alpha(theme.palette.background.paper, isDark ? 0.5 : 0.8),
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08),
          }}
        >
          <HubOutlinedIcon
            sx={{ fontSize: 20, color: theme.palette.primary.main }}
          />
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}
          >
            Agent Catalog
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.disabled',
              fontSize: '0.7rem',
              fontWeight: 500,
            }}
          >
            {visibleAgents.length}{' '}
            {visibleAgents.length === 1 ? 'agent' : 'agents'} available
          </Typography>
        </Box>

        <TextField
          size="small"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          placeholder="Search agents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon
                  sx={{ fontSize: 18, color: theme.palette.text.disabled }}
                />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch('')}>
                  <ClearIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
          sx={{
            flex: 1,
            maxWidth: 420,
            ml: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: 5,
              fontSize: '0.85rem',
              height: 40,
              bgcolor: alpha(
                theme.palette.background.default,
                isDark ? 0.4 : 0.6,
              ),
              '&.Mui-focused': {
                boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.15)}`,
              },
            },
          }}
        />

        <Box sx={{ flex: 1 }} />

        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: theme.palette.text.secondary,
            '&:hover': { color: theme.palette.text.primary },
          }}
        >
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* ── Body ───────────────────────────────────────────────── */}
      {loading && (
        <Box
          sx={{
            flex: 1,
            px: 3,
            pt: 3,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 1.5,
            alignContent: 'start',
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Box
              key={i}
              sx={{
                height: 132,
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <Skeleton
                variant="rectangular"
                width="100%"
                height="100%"
                sx={{ borderRadius: 3 }}
                animation="wave"
              />
            </Box>
          ))}
        </Box>
      )}
      {!loading && visibleAgents.length === 0 && (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            px: 3,
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, isDark ? 0.1 : 0.06),
            }}
          >
            <HubOutlinedIcon
              sx={{
                fontSize: 40,
                color: theme.palette.primary.main,
                opacity: 0.6,
              }}
            />
          </Box>
          <Typography
            variant="body1"
            sx={{ fontWeight: 600, color: theme.palette.text.primary }}
          >
            No agents available
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              textAlign: 'center',
              maxWidth: 360,
            }}
          >
            Deploy agents via the Command Center to get started. They will
            appear here automatically.
          </Typography>
        </Box>
      )}
      {!loading && visibleAgents.length > 0 && (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Featured row */}
          {featured.length > 0 && !search && tab === 'all' && (
            <Box
              sx={{
                px: 3,
                pt: 2,
                pb: 1,
                flexShrink: 0,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  fontSize: '0.7rem',
                  color: theme.palette.text.secondary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  mb: 1.5,
                }}
              >
                <StarIcon
                  sx={{ fontSize: 14, color: theme.palette.warning.main }}
                />
                Featured Agents
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  overflowX: 'auto',
                  pb: 1.5,
                  scrollSnapType: 'x mandatory',
                  '&::-webkit-scrollbar': { height: 4 },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: alpha(theme.palette.text.disabled, 0.3),
                    borderRadius: 2,
                  },
                }}
              >
                {featured.map(({ agent, config }) => (
                  <FeaturedCard
                    key={`${agent.namespace}/${agent.name}`}
                    agent={agent}
                    config={config}
                    onSelect={handleDirectSelect}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Toolbar: tabs + filters */}
          <Box
            sx={{
              px: 3,
              pt: 1.5,
              pb: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexShrink: 0,
              flexWrap: 'wrap',
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
            }}
          >
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{
                minHeight: 32,
                '& .MuiTab-root': {
                  minHeight: 32,
                  textTransform: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  minWidth: 'auto',
                  px: 1.5,
                  py: 0.25,
                },
              }}
            >
              <Tab label="All" value="all" />
              <Tab
                label="Recent"
                value="recent"
                icon={<HistoryIcon sx={{ fontSize: 14 }} />}
                iconPosition="start"
                disabled={recentIds.length === 0}
              />
              <Tab
                label="Pinned"
                value="pinned"
                icon={<StarIcon sx={{ fontSize: 14 }} />}
                iconPosition="start"
                disabled={pinnedIds.length === 0}
              />
            </Tabs>

            <Chip
              label={`${filtered.length} agent${filtered.length !== 1 ? 's' : ''}`}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 600,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}
            />

            <Box sx={{ flex: 1 }} />

            {frameworks.length > 0 && (
              <FormControl size="small">
                <Select
                  value={frameworkFilter}
                  onChange={e => setFrameworkFilter(e.target.value)}
                  displayEmpty
                  MenuProps={{ disablePortal: true }}
                  renderValue={v => (
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <FilterListIcon
                        sx={{
                          fontSize: 13,
                          color: theme.palette.text.disabled,
                        }}
                      />
                      <Box component="span">{v || 'All frameworks'}</Box>
                    </Box>
                  )}
                  sx={{
                    borderRadius: 2,
                    fontSize: '0.75rem',
                    height: 30,
                    minWidth: 140,
                    '& .MuiSelect-select': { py: 0.5, px: 1.25 },
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.8rem' }}>
                    All frameworks
                  </MenuItem>
                  {frameworks.map(fw => (
                    <MenuItem key={fw} value={fw} sx={{ fontSize: '0.8rem' }}>
                      {fw}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControl size="small">
              <Select
                value={sort}
                onChange={e => setSort(e.target.value as SortOption)}
                displayEmpty
                MenuProps={{ disablePortal: true }}
                renderValue={v => {
                  const labels: Record<string, string> = {
                    name: 'Name',
                    status: 'Status',
                    newest: 'Newest',
                  };
                  return (
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <SortIcon
                        sx={{
                          fontSize: 13,
                          color: theme.palette.text.disabled,
                        }}
                      />
                      <Box component="span">
                        {labels[v as string] || 'Name'}
                      </Box>
                    </Box>
                  );
                }}
                sx={{
                  borderRadius: 2,
                  fontSize: '0.75rem',
                  height: 30,
                  minWidth: 100,
                  '& .MuiSelect-select': { py: 0.5, px: 1.25 },
                }}
              >
                <MenuItem value="name" sx={{ fontSize: '0.8rem' }}>
                  Name
                </MenuItem>
                <MenuItem value="status" sx={{ fontSize: '0.8rem' }}>
                  Status
                </MenuItem>
                <MenuItem value="newest" sx={{ fontSize: '0.8rem' }}>
                  Newest
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Agent grid (full width) */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              px: 3,
              py: 1,
              mt: 1,
            }}
          >
            {filtered.length === 0 ? (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <SearchIcon
                  sx={{
                    fontSize: 40,
                    color: alpha(theme.palette.text.disabled, 0.4),
                  }}
                />
                <Typography
                  variant="body1"
                  sx={{ fontWeight: 600, color: theme.palette.text.primary }}
                >
                  {search ? 'No matching agents' : 'No agents here yet'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary, maxWidth: 300 }}
                >
                  {search
                    ? `No agents match "${search}". Try a different search term.`
                    : 'No agents in this category. Check back later or browse all agents.'}
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 1.5,
                  pb: 2,
                }}
              >
                {filtered.map((agent, idx) => {
                  const agentId = `${agent.namespace}/${agent.name}`;
                  const previewId = previewAgent
                    ? `${previewAgent.namespace}/${previewAgent.name}`
                    : '';
                  return (
                    <GridCard
                      key={agentId}
                      agent={agent}
                      isSelected={agentId === previewId}
                      isPinned={pinnedIds.includes(agentId)}
                      onSelect={handleDirectSelect}
                      onInfo={handlePreviewSelect}
                      onTogglePin={togglePin}
                      index={idx}
                    />
                  );
                })}
              </Box>
            )}
          </Box>

          {/* Agent preview popup (centered overlay) */}
          <Dialog
            open={!!previewAgent}
            onClose={() => setPreviewAgent(null)}
            maxWidth={false}
            PaperProps={{
              sx: {
                width: 440,
                maxWidth: '92vw',
                maxHeight: '80vh',
                borderRadius: 4,
                overflow: 'hidden',
                bgcolor: theme.palette.background.default,
                border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.15 : 0.12)}`,
                boxShadow: isDark
                  ? `0 24px 80px ${alpha('#000', 0.5)}`
                  : `0 24px 80px ${alpha('#000', 0.12)}`,
              },
            }}
            slotProps={{
              backdrop: {
                sx: {
                  bgcolor: alpha('#000', isDark ? 0.4 : 0.2),
                },
              },
            }}
          >
            {previewAgent && (
              <Box sx={{ position: 'relative' }}>
                <IconButton
                  onClick={() => setPreviewAgent(null)}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 2,
                    color: theme.palette.text.secondary,
                    bgcolor: alpha(theme.palette.background.paper, 0.85),
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: theme.palette.background.paper,
                    },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
                <PreviewPanel
                  agent={previewAgent}
                  config={previewConfig}
                  onStart={handlePreviewStart}
                  onStarterClick={handleStarterClick}
                />
              </Box>
            )}
          </Dialog>
        </Box>
      )}
    </Dialog>
  );
};
