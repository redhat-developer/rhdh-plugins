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

import { useState, useCallback, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Tooltip from '@mui/material/Tooltip';
import { useTheme, alpha } from '@mui/material/styles';
import SaveIcon from '@mui/icons-material/Save';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useApi } from '@backstage/core-plugin-api';
import { augmentApiRef } from '../../api';
import type { ChatAgentConfig } from '../../types';
import { useChatAgentConfig } from '../../hooks/useChatAgentConfig';
import { useAgentGalleryData } from '../WelcomeScreen/useAgentGalleryData';
import { getAgentAvatarColor, isAgentReady } from '../WelcomeScreen/agentUtils';
import type { AgentWithCard } from '../WelcomeScreen/agentUtils';

const MAX_FEATURED = 4;
const MAX_STARTERS = 6;

interface AgentConfigRow extends ChatAgentConfig {
  _agent?: AgentWithCard;
  _dirty?: boolean;
}

function mergeAgentsWithConfigs(
  agents: AgentWithCard[],
  configs: ChatAgentConfig[],
): AgentConfigRow[] {
  const configMap = new Map(configs.map(c => [c.agentId, c]));
  const rows: AgentConfigRow[] = [];

  for (const agent of agents) {
    const agentId = `${agent.namespace}/${agent.name}`;
    const existing = configMap.get(agentId);
    rows.push({
      agentId,
      visible: existing?.visible ?? true,
      featured: existing?.featured ?? false,
      order: existing?.order,
      displayName: existing?.displayName,
      description: existing?.description,
      avatarUrl: existing?.avatarUrl,
      accentColor: existing?.accentColor,
      greeting: existing?.greeting,
      conversationStarters: existing?.conversationStarters ?? [],
      _agent: agent,
    });
  }

  return rows.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (a.visible !== b.visible) return a.visible ? -1 : 1;
    return (a.order ?? 999) - (b.order ?? 999);
  });
}

export const ChatExperiencePanel = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const api = useApi(augmentApiRef);
  const { agents, loading: agentsLoading } = useAgentGalleryData(api);
  const {
    configs,
    loading: configLoading,
    saving,
    save,
  } = useChatAgentConfig();

  const [rows, setRows] = useState<AgentConfigRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!agentsLoading && !configLoading) {
      setRows(mergeAgentsWithConfigs(agents, configs));
    }
  }, [agents, configs, agentsLoading, configLoading]);

  const featuredCount = useMemo(
    () => rows.filter(r => r.featured).length,
    [rows],
  );

  const updateRow = useCallback(
    (agentId: string, patch: Partial<AgentConfigRow>) => {
      setRows(prev =>
        prev.map(r =>
          r.agentId === agentId ? { ...r, ...patch, _dirty: true } : r,
        ),
      );
      setDirty(true);
    },
    [],
  );

  const handleToggleVisible = useCallback(
    (agentId: string, visible: boolean) => {
      updateRow(agentId, { visible, featured: visible ? undefined : false });
    },
    [updateRow],
  );

  const handleToggleFeatured = useCallback(
    (agentId: string, featured: boolean) => {
      if (featured && featuredCount >= MAX_FEATURED) {
        setToast(`Maximum ${MAX_FEATURED} featured agents allowed`);
        return;
      }
      updateRow(agentId, { featured });
    },
    [updateRow, featuredCount],
  );

  const handleAddStarter = useCallback(
    (agentId: string) => {
      const row = rows.find(r => r.agentId === agentId);
      if (!row) return;
      const starters = [...(row.conversationStarters || [])];
      if (starters.length >= MAX_STARTERS) {
        setToast(`Maximum ${MAX_STARTERS} conversation starters`);
        return;
      }
      starters.push('');
      updateRow(agentId, { conversationStarters: starters });
    },
    [rows, updateRow],
  );

  const handleUpdateStarter = useCallback(
    (agentId: string, index: number, value: string) => {
      const row = rows.find(r => r.agentId === agentId);
      if (!row) return;
      const starters = [...(row.conversationStarters || [])];
      starters[index] = value;
      updateRow(agentId, { conversationStarters: starters });
    },
    [rows, updateRow],
  );

  const handleRemoveStarter = useCallback(
    (agentId: string, index: number) => {
      const row = rows.find(r => r.agentId === agentId);
      if (!row) return;
      const starters = [...(row.conversationStarters || [])];
      starters.splice(index, 1);
      updateRow(agentId, { conversationStarters: starters });
    },
    [rows, updateRow],
  );

  const handleSave = useCallback(async () => {
    const configsToSave: ChatAgentConfig[] = rows
      .filter(
        r =>
          r._dirty ||
          r.featured ||
          !r.visible ||
          r.displayName ||
          r.description ||
          r.avatarUrl ||
          r.accentColor ||
          r.greeting ||
          (r.conversationStarters && r.conversationStarters.length > 0),
      )
      .map(({ _agent: _a, _dirty: _d, ...cfg }) => ({
        ...cfg,
        conversationStarters: (cfg.conversationStarters || []).filter(
          s => s.trim() !== '',
        ),
      }));
    try {
      await save(configsToSave);
      setDirty(false);
      setToast('Chat experience saved');
    } catch {
      setToast('Failed to save');
    }
  }, [rows, save]);

  if (agentsLoading || configLoading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 960, mx: 'auto' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Chat Experience
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: '0.8rem' }}
          >
            Control which agents end users see and how they appear in chat.
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={saving ? <CircularProgress size={14} /> : <SaveIcon />}
          disabled={!dirty || saving}
          onClick={handleSave}
          sx={{ textTransform: 'none' }}
        >
          Save
        </Button>
      </Box>

      <Typography
        variant="caption"
        sx={{
          color: theme.palette.text.disabled,
          display: 'block',
          mb: 2,
        }}
      >
        {featuredCount} / {MAX_FEATURED} featured &middot;{' '}
        {rows.filter(r => r.visible).length} / {rows.length} visible
      </Typography>

      {rows.length === 0 ? (
        <Alert severity="info">
          No agents found. Deploy agents via the Agents panel first.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {rows.map(row => {
            const agent = row._agent;
            const displayName =
              row.displayName ||
              agent?.agentCard?.name ||
              agent?.name ||
              row.agentId;
            const avatarColor =
              row.accentColor || getAgentAvatarColor(displayName);
            const ready = agent ? isAgentReady(agent.status) : false;
            const isExpanded = expandedId === row.agentId;

            return (
              <Card
                key={row.agentId}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  opacity: row.visible ? 1 : 0.5,
                  transition: 'opacity 0.2s ease',
                }}
              >
                <CardContent
                  sx={{
                    p: 1.5,
                    '&:last-child': { pb: 1.5 },
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  {/* Avatar */}
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      bgcolor: alpha(avatarColor, isDark ? 0.2 : 0.12),
                      color: avatarColor,
                      flexShrink: 0,
                    }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </Box>

                  {/* Name + status */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{ fontWeight: 600, fontSize: '0.85rem' }}
                    >
                      {displayName}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.text.disabled,
                        fontSize: '0.65rem',
                      }}
                    >
                      {row.agentId}
                      {ready ? '' : ` · ${agent?.status || 'unknown'}`}
                    </Typography>
                  </Box>

                  {/* Visible toggle */}
                  <Tooltip
                    title={row.visible ? 'Hide from chat' : 'Show in chat'}
                  >
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleToggleVisible(row.agentId, !row.visible)
                      }
                      sx={{
                        color: row.visible
                          ? theme.palette.success.main
                          : theme.palette.text.disabled,
                      }}
                    >
                      {row.visible ? (
                        <VisibilityIcon sx={{ fontSize: 18 }} />
                      ) : (
                        <VisibilityOffIcon sx={{ fontSize: 18 }} />
                      )}
                    </IconButton>
                  </Tooltip>

                  {/* Featured toggle */}
                  <Tooltip
                    title={
                      row.featured
                        ? 'Remove from featured'
                        : 'Feature on welcome'
                    }
                  >
                    <IconButton
                      size="small"
                      disabled={!row.visible}
                      onClick={() =>
                        handleToggleFeatured(row.agentId, !row.featured)
                      }
                      sx={{
                        color: row.featured
                          ? theme.palette.warning.main
                          : theme.palette.text.disabled,
                      }}
                    >
                      {row.featured ? (
                        <StarIcon sx={{ fontSize: 18 }} />
                      ) : (
                        <StarBorderIcon sx={{ fontSize: 18 }} />
                      )}
                    </IconButton>
                  </Tooltip>

                  {/* Expand */}
                  <IconButton
                    size="small"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : row.agentId)
                    }
                  >
                    {isExpanded ? (
                      <ExpandLessIcon sx={{ fontSize: 18 }} />
                    ) : (
                      <ExpandMoreIcon sx={{ fontSize: 18 }} />
                    )}
                  </IconButton>
                </CardContent>

                <Collapse in={isExpanded} unmountOnExit>
                  <Box
                    sx={{
                      px: 2,
                      pb: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    {/* Display overrides */}
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 1.5,
                      }}
                    >
                      <TextField
                        label="Display Name"
                        size="small"
                        value={row.displayName || ''}
                        onChange={e =>
                          updateRow(row.agentId, {
                            displayName: e.target.value || undefined,
                          })
                        }
                        placeholder={
                          agent?.agentCard?.name || agent?.name || ''
                        }
                      />
                      <TextField
                        label="Accent Color"
                        size="small"
                        value={row.accentColor || ''}
                        onChange={e =>
                          updateRow(row.agentId, {
                            accentColor: e.target.value || undefined,
                          })
                        }
                        placeholder="#1e40af"
                      />
                    </Box>
                    <TextField
                      label="Description"
                      size="small"
                      multiline
                      minRows={2}
                      value={row.description || ''}
                      onChange={e =>
                        updateRow(row.agentId, {
                          description: e.target.value || undefined,
                        })
                      }
                      placeholder={
                        agent?.agentCard?.description ||
                        agent?.description ||
                        ''
                      }
                    />
                    <TextField
                      label="Avatar URL"
                      size="small"
                      value={row.avatarUrl || ''}
                      onChange={e =>
                        updateRow(row.agentId, {
                          avatarUrl: e.target.value || undefined,
                        })
                      }
                      placeholder="https://example.com/avatar.png"
                    />
                    <TextField
                      label="Greeting Message"
                      size="small"
                      multiline
                      minRows={2}
                      value={row.greeting || ''}
                      onChange={e =>
                        updateRow(row.agentId, {
                          greeting: e.target.value || undefined,
                        })
                      }
                      placeholder="Hi! I'm your weather assistant. Ask me about any city's forecast."
                      helperText="Shown as the first bot message when a user starts a new conversation"
                    />

                    {/* Conversation starters */}
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          mb: 0.5,
                          display: 'block',
                        }}
                      >
                        Conversation Starters
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.disabled,
                          fontSize: '0.7rem',
                          mb: 1,
                          display: 'block',
                        }}
                      >
                        Suggested prompts shown on the featured agent card and
                        below the chat input
                      </Typography>
                      {(row.conversationStarters || []).map((starter, si) => (
                        <Box
                          key={si}
                          sx={{
                            display: 'flex',
                            gap: 0.5,
                            mb: 0.75,
                            alignItems: 'center',
                          }}
                        >
                          <Chip
                            label={si + 1}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              minWidth: 24,
                            }}
                          />
                          <TextField
                            size="small"
                            fullWidth
                            value={starter}
                            onChange={e =>
                              handleUpdateStarter(
                                row.agentId,
                                si,
                                e.target.value,
                              )
                            }
                            placeholder="What's the weather in London?"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                fontSize: '0.8rem',
                              },
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveStarter(row.agentId, si)}
                            sx={{ color: theme.palette.text.disabled }}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      ))}
                      <Button
                        size="small"
                        startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                        onClick={() => handleAddStarter(row.agentId)}
                        disabled={
                          (row.conversationStarters || []).length >=
                          MAX_STARTERS
                        }
                        sx={{
                          textTransform: 'none',
                          fontSize: '0.75rem',
                          mt: 0.5,
                        }}
                      >
                        Add starter
                      </Button>
                    </Box>
                  </Box>
                </Collapse>
              </Card>
            );
          })}
        </Box>
      )}

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};
