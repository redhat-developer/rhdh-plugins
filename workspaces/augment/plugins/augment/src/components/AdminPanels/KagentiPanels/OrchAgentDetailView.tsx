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
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Divider from '@mui/material/Divider';
import { useTheme, alpha } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PublishIcon from '@mui/icons-material/Publish';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import DeleteIcon from '@mui/icons-material/Delete';
import ChatIcon from '@mui/icons-material/Chat';
import { useApi } from '@backstage/core-plugin-api';
import type { ChatAgent } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { augmentApiRef } from '../../../api';
import { useAdminConfig } from '../../../hooks';
import { useEffectiveConfig } from '../../../hooks/useEffectiveConfig';
import { agentFromConfig } from '../AgentsPanel/agentValidation';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { CONTENT_MAX_WIDTH, PAGE_TITLE_SX } from '../shared/commandCenterStyles';

export interface OrchAgentDetailViewProps {
  agent: ChatAgent;
  onBack: () => void;
  onEditConfig: (agentKey: string) => void;
  onChatWithAgent?: (agentId: string) => void;
}

function roleChipColor(role?: string) {
  switch (role) {
    case 'router':
      return 'primary' as const;
    case 'specialist':
      return 'secondary' as const;
    default:
      return 'default' as const;
  }
}

function lifecycleColor(stage?: string) {
  switch (stage) {
    case 'deployed':
      return 'success' as const;
    case 'registered':
      return 'info' as const;
    default:
      return 'default' as const;
  }
}

export function OrchAgentDetailView({
  agent,
  onBack,
  onEditConfig,
  onChatWithAgent,
}: OrchAgentDetailViewProps) {
  const theme = useTheme();
  const api = useApi(augmentApiRef);

  const { entry: agentsEntry, save: saveAgents } = useAdminConfig('agents');
  const { config: effectiveConfig } = useEffectiveConfig();

  const [lifecycleStage, setLifecycleStage] = useState<string>(
    agent.lifecycleStage ?? 'draft',
  );
  const isPublished = lifecycleStage === 'deployed';
  const [publishLoading, setPublishLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' | 'warning' } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .listAgents()
      .then(agents => {
        if (cancelled) return;
        const match = agents.find(a => a.id === agent.id);
        if (match?.lifecycleStage) {
          setLifecycleStage(match.lifecycleStage);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setToast({ message: 'Could not refresh lifecycle status — showing last known state', severity: 'warning' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [api, agent.id]);

  const agentConfig = useMemo(() => {
    if (!effectiveConfig) return null;
    const agents = effectiveConfig.agents as
      | Record<string, Record<string, unknown>>
      | undefined;
    if (!agents || !agents[agent.id]) return null;
    return agentFromConfig(agents[agent.id]);
  }, [effectiveConfig, agent.id]);

  const availableMcpServers = useMemo(() => {
    if (!effectiveConfig) return [];
    const servers =
      (effectiveConfig.mcpServers as Array<{ id: string; name: string }>) || [];
    return servers.map(s => ({ id: s.id, name: s.name || s.id }));
  }, [effectiveConfig]);

  const handleTogglePublish = useCallback(async () => {
    setPublishLoading(true);
    try {
      if (isPublished) {
        const result = await api.demoteAgent(agent.id, 'registered');
        setLifecycleStage(result.lifecycleStage);
        setToast({ message: 'Agent withdrawn from catalog', severity: 'success' });
      } else {
        const result = await api.promoteAgent(agent.id, 'deployed');
        setLifecycleStage(result.lifecycleStage);
        setToast({ message: `Agent deployed to catalog (v${result.version})`, severity: 'success' });
      }
    } catch (err) {
      setToast({
        message: `Failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        severity: 'error',
      });
    } finally {
      setPublishLoading(false);
    }
  }, [api, agent.id, isPublished]);

  const handleDelete = useCallback(async () => {
    setError(null);
    try {
      if (!agentsEntry?.configValue || typeof agentsEntry.configValue !== 'object') {
        throw new Error('Unable to load current agent configuration');
      }
      const existing = {
        ...(agentsEntry.configValue as Record<string, unknown>),
      };
      delete existing[agent.id];
      await saveAgents(existing);
      setToast({ message: 'Agent deleted', severity: 'success' });
      onBack();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete agent',
      );
    } finally {
      setDeleteOpen(false);
    }
  }, [agentsEntry, agent.id, saveAgents, onBack]);

  const roleLabel = agent.agentRole
    ? agent.agentRole.charAt(0).toUpperCase() + agent.agentRole.slice(1)
    : 'Standalone';

  return (
    <Box sx={{ maxWidth: CONTENT_MAX_WIDTH, width: '100%', minWidth: 0 }}>
      <Button
        size="small"
        startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
        onClick={onBack}
        sx={{
          textTransform: 'none',
          mb: 1,
          color: theme.palette.primary.main,
          '&:hover': { color: theme.palette.primary.dark },
        }}
      >
        Agents &rsaquo; {agent.name}
      </Button>

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 2,
          mb: 3,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}
          >
            <Typography
              variant="h5"
              sx={PAGE_TITLE_SX}
            >
              {agent.name}
            </Typography>
            <Chip
              label={roleLabel}
              size="small"
              color={roleChipColor(agent.agentRole)}
            />
            <Chip
              label={lifecycleStage}
              size="small"
              color={lifecycleColor(lifecycleStage)}
              variant="outlined"
            />
          </Box>
          {agent.description && (
            <Typography variant="body2" color="text.secondary">
              {agent.description}
            </Typography>
          )}
          <Box
            sx={{
              display: 'flex',
              gap: 0.75,
              alignItems: 'center',
              flexWrap: 'wrap',
              mt: 0.5,
            }}
          >
            <Chip
              label="Responses API"
              size="small"
              variant="outlined"
              sx={{
                height: 24,
                fontSize: '0.75rem',
                borderColor: alpha(theme.palette.info.main, 0.5),
                color: theme.palette.info.main,
              }}
            />
          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', pt: 0.5 }}>
          <Button
            size="small"
            variant={isPublished ? 'outlined' : 'contained'}
            color={isPublished ? 'inherit' : 'success'}
            startIcon={
              publishLoading ? (
                <CircularProgress size={14} />
              ) : isPublished ? (
                <CloudOffIcon />
              ) : (
                <PublishIcon />
              )
            }
            disabled={publishLoading}
            onClick={handleTogglePublish}
            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
          >
            {isPublished ? 'Withdraw' : 'Deploy to Catalog'}
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => onEditConfig(agent.id)}
            sx={{ textTransform: 'none' }}
          >
            Edit Configuration
          </Button>
          {onChatWithAgent && (
            <Button
              size="small"
              variant="contained"
              startIcon={<ChatIcon />}
              onClick={() => onChatWithAgent(agent.id)}
              sx={{ textTransform: 'none' }}
            >
              Chat
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Delete
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Agent Configuration Details */}
      {agentConfig && (
        <Box
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.background.paper, 0.5),
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Configuration
          </Typography>

          <DetailRow label="Agent Key" value={agent.id} />
          <DetailRow
            label="Model"
            value={agentConfig.model || 'Default (global)'}
          />

          <Divider sx={{ my: 1.5 }} />

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Instructions
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              whiteSpace: 'pre-wrap',
              maxHeight: 200,
              overflow: 'auto',
              p: 1.5,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.background.default, 0.5),
              border: `1px solid ${theme.palette.divider}`,
              fontSize: '0.8125rem',
              fontFamily: 'monospace',
            }}
          >
            {agentConfig.instructions || '(none)'}
          </Typography>

          <Divider sx={{ my: 1.5 }} />

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Capabilities
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
            {agentConfig.enableRAG && (
              <Chip label="Knowledge Base (RAG)" size="small" color="primary" />
            )}
            {agentConfig.enableWebSearch && (
              <Chip label="Web Search" size="small" color="primary" />
            )}
            {agentConfig.enableCodeInterpreter && (
              <Chip label="Code Interpreter" size="small" color="primary" />
            )}
            {agentConfig.mcpServers.length > 0 &&
              agentConfig.mcpServers.map(id => (
                <Chip
                  key={id}
                  label={
                    availableMcpServers.find(s => s.id === id)?.name || id
                  }
                  size="small"
                  color="info"
                />
              ))}
            {!agentConfig.enableRAG &&
              !agentConfig.enableWebSearch &&
              !agentConfig.enableCodeInterpreter &&
              agentConfig.mcpServers.length === 0 && (
                <Typography variant="body2" color="text.disabled">
                  No capabilities configured
                </Typography>
              )}
          </Box>

          {(agentConfig.handoffs.length > 0 ||
            agentConfig.asTools.length > 0) && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Connections
              </Typography>
              {agentConfig.handoffs.length > 0 && (
                <DetailRow
                  label="Handoffs"
                  value={agentConfig.handoffs.join(', ')}
                />
              )}
              {agentConfig.asTools.length > 0 && (
                <DetailRow
                  label="As Tools"
                  value={agentConfig.asTools.join(', ')}
                />
              )}
            </>
          )}
        </Box>
      )}

      {!agentConfig && !error && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Agent configuration not found. It may have been deleted or the
          config is still loading.
        </Alert>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Agent"
        message={`Delete agent "${agent.name}" (${agent.id})? This will remove the agent configuration and its catalog entry.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert
            onClose={() => setToast(null)}
            severity={toast.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 0.75 }}>
      <Typography
        variant="body2"
        sx={{ fontWeight: 600, minWidth: 120, color: 'text.secondary' }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: 'text.primary', wordBreak: 'break-word' }}
      >
        {value}
      </Typography>
    </Box>
  );
}
