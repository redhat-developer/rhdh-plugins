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
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import { ToggleSwitch } from '../shared/ToggleSwitch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import RefreshIcon from '@mui/icons-material/Refresh';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Snackbar from '@mui/material/Snackbar';
import { useTheme, alpha } from '@mui/material/styles';
import { Progress } from '@backstage/core-components';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HubIcon from '@mui/icons-material/Hub';
import BuildIcon from '@mui/icons-material/Build';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

import { useEffectiveConfig } from '../../../hooks/useEffectiveConfig';
import {
  useAdminConfig,
  useModels,
  useGeneratePrompt,
  useVectorStores,
} from '../../../hooks';
import { SELECT_MENU_PROPS } from '../shared/selectMenuProps';
import {
  type AgentFormData,
  type PublishAsRole,
  createDefaultAgent,
  agentFromConfig,
  agentToConfig,
  validateAgents,
  deriveAgentRole,
  buildAgentContext,
} from './agentValidation';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { AgentListItem } from './AgentListItem';
import { CreateAgentModal } from './CreateAgentModal';
import { InstructionsTab } from './InstructionsTab';

const LEFT_PANEL_WIDTH = 280;
const RIGHT_MAX_WIDTH = 780;
const SAVE_SUCCESS_TIMEOUT_MS = 3000;
const DEFAULT_MAX_TURNS = 10;
const MIN_TURNS = 1;
const MAX_TURNS = 50;

export interface AgentsPanelProps {
  focusAgentKey?: string;
  autoCreate?: boolean;
  createType?: 'single' | 'multi' | null;
  onSaved?: () => void;
}

export const AgentsPanel = ({ focusAgentKey, autoCreate, createType, onSaved }: AgentsPanelProps = {}) => {
  const theme = useTheme();
  const {
    config: effectiveConfig,
    loading: configLoading,
    error: configError,
    refresh: refreshConfig,
  } = useEffectiveConfig();

  const {
    source: agentsSource,
    saving: agentsSaving,
    error: agentsError,
    save: saveAgents,
    reset: resetAgents,
  } = useAdminConfig('agents');
  const { save: saveDefaultAgent } = useAdminConfig('defaultAgent');
  const { save: saveMaxTurns } = useAdminConfig('maxAgentTurns');
  const {
    models,
    loading: modelsLoading,
    refresh: refreshModels,
  } = useModels();
  const modelOptions = useMemo(
    () => models.map(m => m.id).filter(Boolean) as string[],
    [models],
  );
  const { generate, generating, error: generateError } = useGeneratePrompt();
  const { stores: vectorStores } = useVectorStores();

  // ── State ──────────────────────────────────────────────────────────────

  const [agents, setAgents] = useState<Record<string, AgentFormData>>({});
  const [selectedAgentKey, setSelectedAgentKey] = useState<string | null>(null);
  const [defaultAgentKey, setDefaultAgentKey] = useState('');
  const [maxTurns, setMaxTurns] = useState(DEFAULT_MAX_TURNS);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const [generateToast, setGenerateToast] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [confirmRemoveKey, setConfirmRemoveKey] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Effects ────────────────────────────────────────────────────────────

  const isSingleAgentMode = createType === 'single' && autoCreate;

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!effectiveConfig || initialized) return;
    if (isSingleAgentMode) {
      setAgents({});
      setDefaultAgentKey('');
    } else {
      const rawAgents =
        (effectiveConfig.agents as Record<string, Record<string, unknown>>) || {};
      const parsed: Record<string, AgentFormData> = {};
      for (const [key, cfg] of Object.entries(rawAgents))
        parsed[key] = agentFromConfig(cfg);
      setAgents(parsed);
      setDefaultAgentKey((effectiveConfig.defaultAgent as string) || '');
    }
    setMaxTurns((effectiveConfig.maxAgentTurns as number) || DEFAULT_MAX_TURNS);
    setInitialized(true);
  }, [effectiveConfig, initialized, isSingleAgentMode]);

  // Auto-select focused agent or first agent when agents load
  const focusAppliedRef = useRef(false);
  useEffect(() => {
    focusAppliedRef.current = false;
  }, [focusAgentKey]);
  useEffect(() => {
    if (!initialized) return;
    const keys = Object.keys(agents);
    if (keys.length === 0) {
      setSelectedAgentKey(null);
      return;
    }
    if (focusAgentKey && agents[focusAgentKey] && !focusAppliedRef.current) {
      focusAppliedRef.current = true;
      setSelectedAgentKey(focusAgentKey);
      return;
    }
    setSelectedAgentKey(prev => (!prev || !agents[prev] ? keys[0] : prev));
  }, [initialized, agents, focusAgentKey]);

  const autoCreateAppliedRef = useRef(false);
  useEffect(() => {
    if (autoCreate && initialized && !autoCreateAppliedRef.current) {
      autoCreateAppliedRef.current = true;
      if (isSingleAgentMode) {
        const key = 'agent';
        const agent = createDefaultAgent();
        agent.name = 'Agent';
        setAgents({ [key]: agent });
        setDefaultAgentKey(key);
        setSelectedAgentKey(key);
      } else {
        setCreateModalOpen(true);
      }
    }
  }, [autoCreate, initialized, isSingleAgentMode]);

  // ── Memos ──────────────────────────────────────────────────────────────

  const agentKeys = useMemo(() => Object.keys(agents), [agents]);
  const availableMcpServers = useMemo(() => {
    if (!effectiveConfig) return [];
    const servers =
      (effectiveConfig.mcpServers as Array<{ id: string; name: string }>) || [];
    return servers.map(s => ({ id: s.id, name: s.name || s.id }));
  }, [effectiveConfig]);
  const selectedAgent = selectedAgentKey
    ? (agents[selectedAgentKey] ?? null)
    : null;
  const selectedAgentRole: PublishAsRole = useMemo(
    () =>
      selectedAgentKey ? deriveAgentRole(selectedAgentKey, agents) : 'standalone',
    [selectedAgentKey, agents],
  );
  const showConnections = selectedAgentRole !== 'standalone';
  const validation = useMemo(
    () => validateAgents(agents, defaultAgentKey),
    [agents, defaultAgentKey],
  );

  const topologyEdges = useMemo(() => {
    const edges: Array<{
      from: string;
      to: string;
      type: 'handoff' | 'subtask';
    }> = [];
    for (const key of agentKeys) {
      const a = agents[key];
      for (const h of a.handoffs)
        if (agents[h]) edges.push({ from: key, to: h, type: 'handoff' });
      for (const t of a.asTools)
        if (agents[t]) edges.push({ from: key, to: t, type: 'subtask' });
    }
    return edges;
  }, [agents, agentKeys]);

  const agentRoles = useMemo(() => {
    const roles: Record<string, PublishAsRole> = {};
    for (const key of agentKeys) {
      roles[key] = deriveAgentRole(key, agents);
    }
    return roles;
  }, [agents, agentKeys]);

  const edgeCounts = useMemo(() => {
    const counts: Record<string, { in: number; out: number }> = {};
    for (const key of agentKeys) {
      const a = agents[key];
      counts[key] = {
        out:
          a.handoffs.filter(h => agents[h]).length +
          a.asTools.filter(t => agents[t]).length,
        in: 0,
      };
    }
    for (const key of agentKeys) {
      const a = agents[key];
      for (const h of a.handoffs) if (counts[h]) counts[h].in++;
      for (const t of a.asTools) if (counts[t]) counts[t].in++;
    }
    return counts;
  }, [agents, agentKeys]);

  // ── Callbacks ──────────────────────────────────────────────────────────

  const handleSelectAgent = useCallback((key: string) => {
    setSelectedAgentKey(key);
    setActiveTab(0);
  }, []);

  const handleCreateFromModal = useCallback(
    (name: string, key: string) => {
      if (!key || agents[key]) return;
      const agent = createDefaultAgent();
      agent.name = name || key.charAt(0).toUpperCase() + key.slice(1);
      setAgents(prev => ({ ...prev, [key]: agent }));
      if (agentKeys.length === 0) setDefaultAgentKey(key);
      setSelectedAgentKey(key);
      setCreateModalOpen(false);
    },
    [agents, agentKeys.length],
  );

  const executeRemoveAgent = useCallback((key: string) => {
    setAgents(prev => {
      const next: Record<string, AgentFormData> = {};
      for (const [k, a] of Object.entries(prev)) {
        if (k === key) continue;
        next[k] = {
          ...a,
          handoffs: a.handoffs.filter(h => h !== key),
          asTools: a.asTools.filter(t => t !== key),
        };
      }
      const remaining = Object.keys(next);
      setSelectedAgentKey(sel => (sel === key ? remaining[0] || null : sel));
      setDefaultAgentKey(def => (def === key ? '' : def));
      return next;
    });
  }, []);

  const handleRemoveAgent = useCallback((key: string) => {
    setConfirmRemoveKey(key);
  }, []);
  const handleConfirmRemove = useCallback(() => {
    if (confirmRemoveKey) {
      executeRemoveAgent(confirmRemoveKey);
      setConfirmRemoveKey(null);
    }
  }, [confirmRemoveKey, executeRemoveAgent]);

  const updateAgent = useCallback(
    (key: string, field: keyof AgentFormData, value: unknown) => {
      setAgents(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
    },
    [],
  );

  const handleSave = useCallback(async () => {
    if (validation.errors.length > 0) return;
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const newAgents: Record<string, Record<string, unknown>> = {};
      for (const [key, agent] of Object.entries(agents)) {
        newAgents[key] = agentToConfig(agent);
      }
      let payload = newAgents;
      if (isSingleAgentMode && effectiveConfig) {
        const existing =
          (effectiveConfig.agents as Record<string, Record<string, unknown>>) || {};
        payload = { ...existing, ...newAgents };
      }
      for (const step of [
        { label: 'agents', fn: () => saveAgents(payload) },
        { label: 'defaultAgent', fn: () => saveDefaultAgent(defaultAgentKey) },
        { label: 'maxAgentTurns', fn: () => saveMaxTurns(maxTurns) },
      ]) {
        try {
          await step.fn();
        } catch (e) {
          throw new Error(
            `Failed to save ${step.label}: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }
      setSaveSuccess(true);
      if (onSaved) {
        onSaved();
      } else {
        saveTimerRef.current = setTimeout(
          () => setSaveSuccess(false),
          SAVE_SUCCESS_TIMEOUT_MS,
        );
      }
    } catch (err) {
      let msg = 'Failed to save agent config';
      if (err instanceof Error) msg = err.message;
      const body = (err as Record<string, unknown>)?.body;
      if (
        body &&
        typeof body === 'object' &&
        typeof (body as Record<string, unknown>).message === 'string'
      ) {
        msg = (body as Record<string, unknown>).message as string;
      }
      setSaveError(msg);
    }
  }, [
    agents,
    defaultAgentKey,
    maxTurns,
    validation,
    saveAgents,
    saveDefaultAgent,
    saveMaxTurns,
    onSaved,
    isSingleAgentMode,
    effectiveConfig,
  ]);

  const executeReset = useCallback(async () => {
    setResetting(true);
    try {
      await resetAgents();
      await refreshConfig();
      setInitialized(false);
      setSelectedAgentKey(null);
    } catch {
      setSaveError('Failed to reset agents');
    } finally {
      setResetting(false);
    }
  }, [resetAgents, refreshConfig]);

  const handleConfirmReset = useCallback(async () => {
    try {
      await executeReset();
    } finally {
      setConfirmReset(false);
    }
  }, [executeReset]);

  const handleUpdateInstructions = useCallback(
    (value: string) => {
      if (selectedAgentKey)
        updateAgent(selectedAgentKey, 'instructions', value);
    },
    [selectedAgentKey, updateAgent],
  );

  const handleGenerateForTab = useCallback(
    async (description: string, model: string | undefined) => {
      if (!selectedAgentKey || !selectedAgent) return;
      const context = buildAgentContext(
        selectedAgent,
        agents,
        availableMcpServers,
      );
      const capabilities = {
        enableWebSearch: selectedAgent.enableWebSearch,
        enableCodeInterpreter: selectedAgent.enableCodeInterpreter,
        ragEnabled: selectedAgent.enableRAG,
      };
      const resolvedModel = model || selectedAgent.model || undefined;
      const prompt = await generate(
        `${description.trim()}\n\nAGENT CONTEXT:\n${context}`,
        resolvedModel,
        capabilities,
      );
      updateAgent(selectedAgentKey, 'instructions', prompt);
      setGenerateToast('Instructions generated — review and save when ready');
    },
    [
      selectedAgentKey,
      selectedAgent,
      agents,
      availableMcpServers,
      generate,
      updateAgent,
    ],
  );

  // ── Guards ─────────────────────────────────────────────────────────────

  if (configLoading) return <Progress />;
  if (configError)
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load: {configError}</Alert>
      </Box>
    );

  // ── JSX ────────────────────────────────────────────────────────────────

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}
    >
      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <Box
        data-tour="orch-toolbar"
        sx={{
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        {!isSingleAgentMode && agentKeys.length > 1 && (
          <>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel sx={{ fontSize: '0.8rem' }}>
                Starting Agent
              </InputLabel>
              <Select
                value={defaultAgentKey}
                label="Starting Agent"
                onChange={e => setDefaultAgentKey(e.target.value)}
                sx={{ fontSize: '0.8rem' }}
                MenuProps={SELECT_MENU_PROPS}
              >
                {agentKeys.map(k => (
                  <MenuItem key={k} value={k} sx={{ fontSize: '0.8rem' }}>
                    {agents[k].name || k}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              type="number"
              label="Max Turns"
              value={maxTurns}
              onChange={e =>
                setMaxTurns(
                  Math.max(
                    MIN_TURNS,
                    parseInt(e.target.value, 10) || MIN_TURNS,
                  ),
                )
              }
              inputProps={{ min: MIN_TURNS, max: MAX_TURNS }}
              sx={{ width: 85, '& input': { fontSize: '0.8rem' } }}
            />
          </>
        )}

        <Box sx={{ flex: 1 }} />

        {!isSingleAgentMode && agentsSource === 'database' && (
          <Button
            size="small"
            color="warning"
            onClick={() => setConfirmReset(true)}
            disabled={agentsSaving || resetting}
            sx={{ textTransform: 'none', fontSize: '0.75rem' }}
          >
            Reset
          </Button>
        )}
        {!isSingleAgentMode && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={() => setCreateModalOpen(true)}
            sx={{ textTransform: 'none', fontSize: '0.8rem' }}
          >
            New Agent
          </Button>
        )}
        <Button
          variant="contained"
          size="small"
          startIcon={
            agentsSaving ? (
              <CircularProgress size={14} />
            ) : (
              <SaveIcon sx={{ fontSize: 16 }} />
            )
          }
          onClick={handleSave}
          disabled={
            agentsSaving ||
            validation.errors.length > 0 ||
            agentKeys.length === 0
          }
          sx={{ textTransform: 'none', minWidth: 68, fontWeight: 600 }}
        >
          {saveSuccess ? 'Saved' : 'Save'}
        </Button>
      </Box>

      {/* ── Feedback ──────────────────────────────────────────────────── */}
      {saveSuccess && (
        <Alert severity="success" sx={{ borderRadius: 0, py: 0 }}>
          Configuration saved.
        </Alert>
      )}
      {(saveError || agentsError) && (
        <Alert
          severity="error"
          sx={{ borderRadius: 0, py: 0 }}
          onClose={saveError ? () => setSaveError(null) : undefined}
        >
          {saveError || agentsError}
        </Alert>
      )}

      {/* ── Main content ──────────────────────────────────────────────── */}
      {!isSingleAgentMode && agentKeys.length === 0 ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ textAlign: 'center', maxWidth: 420 }}>
            <Typography
              variant="h6"
              sx={{
                mb: 1,
                fontWeight: 500,
                color: theme.palette.text.secondary,
              }}
            >
              No agents yet
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mb: 3,
                color: theme.palette.text.disabled,
                lineHeight: 1.6,
              }}
            >
              Start by creating your first agent. Give it tools and instructions
              &mdash; a single well-configured agent can handle many tasks. Add
              more agents later when your workflow needs routing or
              specialization.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setCreateModalOpen(true)}
              sx={{ textTransform: 'none' }}
            >
              Create Agent
            </Button>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}
        >
          {/* ── Left panel: Agent list + Topology (hidden in single-agent mode) */}
          {!isSingleAgentMode && (
            <Box
              data-tour="orch-agent-list"
              sx={{
                width: LEFT_PANEL_WIDTH,
                flexShrink: 0,
                borderRight: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ flex: 1, overflow: 'auto', py: 0.5 }}>
                {agentKeys.map(key => (
                  <AgentListItem
                    key={key}
                    agentKey={key}
                    agent={agents[key]}
                    isSelected={key === selectedAgentKey}
                    isDefault={key === defaultAgentKey}
                    isSingleAgent={agentKeys.length === 1}
                    outCount={edgeCounts[key]?.out ?? 0}
                    inCount={edgeCounts[key]?.in ?? 0}
                    effectiveRole={agentRoles[key] ?? 'standalone'}
                    onSelect={handleSelectAgent}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* ── Right panel: Agent config form ─────────────────────────── */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
            {selectedAgentKey && selectedAgent ? (
              <Box
                sx={{
                  maxWidth: RIGHT_MAX_WIDTH,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                {/* Identity — always visible above tabs */}
                <Box data-tour="orch-identity" sx={{ flexShrink: 0, mb: 1.5 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      mb: 0.5,
                    }}
                  >
                    <TextField
                      value={selectedAgent.name}
                      onChange={e =>
                        updateAgent(selectedAgentKey, 'name', e.target.value)
                      }
                      variant="standard"
                      placeholder="Agent name"
                      InputProps={{
                        sx: { fontSize: '1.1rem', fontWeight: 600 },
                        disableUnderline: true,
                      }}
                      sx={{ flex: 1 }}
                    />
                    <Chip
                      label={selectedAgentKey}
                      size="small"
                      variant="outlined"
                      sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }}
                    />
                    {agentsSource === 'database' && (
                      <Chip label="Modified" size="small" color="info" />
                    )}
                    {!isSingleAgentMode && (
                      <Tooltip title="Delete agent">
                        <IconButton
                          size="small"
                          aria-label="Delete agent"
                          onClick={() => handleRemoveAgent(selectedAgentKey)}
                          sx={{
                            color: theme.palette.error.main,
                            opacity: 0.35,
                            '&:hover': { opacity: 1 },
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  {!isSingleAgentMode && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip
                        size="small"
                        icon={
                          selectedAgentRole === 'router' ? <HubIcon sx={{ fontSize: 14 }} /> :
                          selectedAgentRole === 'specialist' ? <BuildIcon sx={{ fontSize: 14 }} /> :
                          <RocketLaunchIcon sx={{ fontSize: 14 }} />
                        }
                        label={selectedAgentRole.charAt(0).toUpperCase() + selectedAgentRole.slice(1)}
                        color={
                          selectedAgentRole === 'router' ? 'primary' :
                          selectedAgentRole === 'specialist' ? 'default' :
                          'success'
                        }
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      />
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          color: theme.palette.text.secondary,
                        }}
                      >
                        {selectedAgentRole === 'router' && 'Visible in gallery — routes to other agents'}
                        {selectedAgentRole === 'specialist' && 'Hidden — only reachable via handoffs'}
                        {selectedAgentRole === 'standalone' && 'Visible in gallery — independent agent'}
                      </Typography>
                    </Box>
                  )}
                  {showConnections && (
                    <TextField
                      value={selectedAgent.handoffDescription}
                      onChange={e =>
                        updateAgent(
                          selectedAgentKey,
                          'handoffDescription',
                          e.target.value,
                        )
                      }
                      variant="standard"
                      fullWidth
                      placeholder="Add a description \u2014 other agents read this when deciding to route here"
                      InputProps={{
                        sx: {
                          fontSize: '0.8rem',
                          color: theme.palette.text.secondary,
                          borderBottom: `1px dashed ${alpha(theme.palette.text.secondary, 0.25)}`,
                          '&:hover': {
                            borderBottom: `1px dashed ${alpha(theme.palette.text.secondary, 0.5)}`,
                          },
                          '&.Mui-focused': {
                            borderBottom: `1px solid ${theme.palette.primary.main}`,
                          },
                        },
                        disableUnderline: true,
                      }}
                    />
                  )}
                </Box>

                {/* Validation — always visible above tabs */}
                {validation.errors.length > 0 && (
                  <Alert
                    severity="warning"
                    icon={<WarningAmberIcon />}
                    sx={{ mb: 1, py: 0.25, flexShrink: 0 }}
                  >
                    {validation.errors.map(err => (
                      <Typography
                        key={err}
                        variant="body2"
                        sx={{ fontSize: '0.75rem' }}
                      >
                        &bull; {err}
                      </Typography>
                    ))}
                  </Alert>
                )}
                {validation.warnings.length > 0 && (
                  <Alert
                    severity="info"
                    sx={{ mb: 1, py: 0.25, flexShrink: 0 }}
                  >
                    {validation.warnings.map(w => (
                      <Typography
                        key={w}
                        variant="body2"
                        sx={{ fontSize: '0.75rem' }}
                      >
                        &bull; {w}
                      </Typography>
                    ))}
                  </Alert>
                )}

                {/* Tabs */}
                <Box
                  data-tour="orch-tabs"
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    flexShrink: 0,
                  }}
                >
                  <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    aria-label="Agent configuration tabs"
                    sx={{
                      minHeight: 36,
                      '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: '0.8125rem',
                        minHeight: 36,
                        px: 2,
                      },
                    }}
                  >
                    <Tab label="Capabilities" data-tour="orch-tab-capabilities" />
                    {showConnections && (
                      <Tab label="Connections" data-tour="orch-tab-connections" />
                    )}
                    <Tab label="Advanced" data-tour="orch-tab-advanced" />
                    <Tab label="Instructions" data-tour="orch-tab-instructions" />
                  </Tabs>
                </Box>

                {/* Tab content — this area scrolls independently */}
                {(() => {
                  const connectionsTab = showConnections ? 1 : -1;
                  const advancedTab = showConnections ? 2 : 1;
                  const instructionsTab = showConnections ? 3 : 2;
                  return (
                <Box sx={{ flex: 1, overflow: 'auto', pt: 2 }}>
                  {/* Tab: Capabilities */}
                  {activeTab === 0 && (
                    <Box data-tour="orch-capabilities">
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 2,
                          mb: 2,
                          flexWrap: 'wrap',
                        }}
                      >
                        <Box
                          sx={{
                            flex: 1,
                            minWidth: 200,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 0.5,
                          }}
                        >
                          <Autocomplete
                            freeSolo
                            options={modelOptions}
                            value={selectedAgent.model || ''}
                            onInputChange={(_e, newValue) =>
                              updateAgent(selectedAgentKey, 'model', newValue)
                            }
                            getOptionLabel={opt =>
                              typeof opt === 'string' ? opt : ''
                            }
                            loading={modelsLoading}
                            renderInput={params => (
                              <TextField
                                {...params}
                                label="Model Override"
                                size="small"
                                placeholder="Leave empty for global model"
                                helperText="Select from available models or leave empty for global default"
                                InputProps={{
                                  ...params.InputProps,
                                  endAdornment: (
                                    <>
                                      {modelsLoading ? (
                                        <CircularProgress size={16} />
                                      ) : null}
                                      {params.InputProps.endAdornment}
                                    </>
                                  ),
                                }}
                              />
                            )}
                            sx={{ flex: 1 }}
                          />
                          <Tooltip title="Refresh model list">
                            <IconButton
                              size="small"
                              onClick={refreshModels}
                              disabled={modelsLoading}
                              sx={{ mt: 0.5 }}
                            >
                              <RefreshIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        {availableMcpServers.length > 0 && (
                          <FormControl
                            size="small"
                            sx={{ flex: 1, minWidth: 200 }}
                          >
                            <InputLabel>MCP Servers</InputLabel>
                            <Select
                              multiple
                              value={selectedAgent.mcpServers}
                              label="MCP Servers"
                              onChange={e =>
                                updateAgent(
                                  selectedAgentKey,
                                  'mcpServers',
                                  e.target.value as string[],
                                )
                              }
                              MenuProps={SELECT_MENU_PROPS}
                              renderValue={vals => (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 0.5,
                                  }}
                                >
                                  {(vals as string[]).map(v => (
                                    <Chip
                                      key={v}
                                      label={
                                        availableMcpServers.find(
                                          s => s.id === v,
                                        )?.name || v
                                      }
                                      size="small"
                                      sx={{
                                        height: 22,
                                        fontSize: '0.75rem',
                                      }}
                                    />
                                  ))}
                                </Box>
                              )}
                            >
                              {availableMcpServers.map(s => (
                                <MenuItem key={s.id} value={s.id}>
                                  {s.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      </Box>
                      <Typography
                        sx={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: theme.palette.text.secondary,
                          mb: 1.5,
                        }}
                      >
                        Built-in Tools
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                        }}
                      >
                        <FormControlLabel
                          control={
                            <ToggleSwitch
                              checked={selectedAgent.enableRAG}
                              onChange={e =>
                                updateAgent(
                                  selectedAgentKey,
                                  'enableRAG',
                                  e.target.checked,
                                )
                              }
                            />
                          }
                          label={
                            <Box>
                              <Typography sx={{ fontSize: '0.8rem' }}>
                                Knowledge Base
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '0.7rem',
                                  color: theme.palette.text.secondary,
                                }}
                              >
                                Search uploaded documents for context
                              </Typography>
                            </Box>
                          }
                        />
                        {selectedAgent.enableRAG && vectorStores.length > 0 && (
                          <FormControl
                            size="small"
                            sx={{ ml: 4, mt: 0.5, mb: 0.5 }}
                          >
                            <InputLabel
                              sx={{ fontSize: '0.8rem' }}
                              id={`vs-label-${selectedAgentKey}`}
                            >
                              Vector Stores
                            </InputLabel>
                            <Select
                              multiple
                              labelId={`vs-label-${selectedAgentKey}`}
                              value={selectedAgent.vectorStoreIds}
                              label="Vector Stores"
                              onChange={e =>
                                updateAgent(
                                  selectedAgentKey,
                                  'vectorStoreIds',
                                  e.target.value as string[],
                                )
                              }
                              MenuProps={SELECT_MENU_PROPS}
                              renderValue={vals => (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 0.5,
                                  }}
                                >
                                  {(vals as string[]).map(v => (
                                    <Chip
                                      key={v}
                                      label={
                                        vectorStores.find(s => s.id === v)
                                          ?.name || v
                                      }
                                      size="small"
                                      sx={{
                                        height: 22,
                                        fontSize: '0.75rem',
                                      }}
                                    />
                                  ))}
                                </Box>
                              )}
                            >
                              {vectorStores.map(s => (
                                <MenuItem key={s.id} value={s.id}>
                                  {s.name || s.id}
                                </MenuItem>
                              ))}
                            </Select>
                            <Typography
                              sx={{
                                fontSize: '0.65rem',
                                color: theme.palette.text.secondary,
                                mt: 0.5,
                                ml: 0.5,
                              }}
                            >
                              Leave empty to use global vector stores
                            </Typography>
                          </FormControl>
                        )}
                        <FormControlLabel
                          control={
                            <ToggleSwitch
                              checked={selectedAgent.enableWebSearch}
                              onChange={e =>
                                updateAgent(
                                  selectedAgentKey,
                                  'enableWebSearch',
                                  e.target.checked,
                                )
                              }
                            />
                          }
                          label={
                            <Box>
                              <Typography sx={{ fontSize: '0.8rem' }}>
                                Web Search
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '0.7rem',
                                  color: theme.palette.text.secondary,
                                }}
                              >
                                Search the web for current information
                              </Typography>
                            </Box>
                          }
                        />
                        <FormControlLabel
                          control={
                            <ToggleSwitch
                              checked={selectedAgent.enableCodeInterpreter}
                              onChange={e =>
                                updateAgent(
                                  selectedAgentKey,
                                  'enableCodeInterpreter',
                                  e.target.checked,
                                )
                              }
                            />
                          }
                          label={
                            <Box>
                              <Typography sx={{ fontSize: '0.8rem' }}>
                                Code Interpreter
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '0.7rem',
                                  color: theme.palette.text.secondary,
                                }}
                              >
                                Execute code to answer questions
                              </Typography>
                            </Box>
                          }
                        />
                      </Box>
                      <Alert
                        severity="info"
                        variant="outlined"
                        sx={{ mt: 3, fontSize: '0.8rem' }}
                      >
                        Global models, MCP servers, and RAG settings are managed
                        in{' '}
                        <strong>Platform Config</strong> from the sidebar.
                      </Alert>
                    </Box>
                  )}

                  {/* Tab: Connections (team mode only) */}
                  {activeTab === connectionsTab && (
                    <Box data-tour="orch-connections">
                      {agentKeys.length <= 1 ? (
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                          <Typography
                            variant="body2"
                            sx={{ color: theme.palette.text.secondary, mb: 1 }}
                          >
                            No other agents to connect to yet.
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: theme.palette.text.disabled,
                              lineHeight: 1.6,
                            }}
                          >
                            Create additional agents to enable handoffs
                            (transfer conversation control) and delegation (run
                            as sub-tasks).
                          </Typography>
                        </Box>
                      ) : (
                        <>
                          <FormControl fullWidth size="small" sx={{ mb: 0.5 }}>
                            <InputLabel>Can Transfer To</InputLabel>
                            <Select
                              multiple
                              value={selectedAgent.handoffs}
                              label="Can Transfer To"
                              onChange={e =>
                                updateAgent(
                                  selectedAgentKey,
                                  'handoffs',
                                  e.target.value as string[],
                                )
                              }
                              MenuProps={SELECT_MENU_PROPS}
                              renderValue={vals => (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 0.5,
                                  }}
                                >
                                  {(vals as string[]).map(v => (
                                    <Chip
                                      key={v}
                                      label={agents[v]?.name || v}
                                      size="small"
                                      sx={{
                                        height: 22,
                                        fontSize: '0.75rem',
                                      }}
                                    />
                                  ))}
                                </Box>
                              )}
                            >
                              {agentKeys
                                .filter(k => k !== selectedAgentKey)
                                .map(k => (
                                  <MenuItem key={k} value={k}>
                                    {agents[k].name || k}
                                  </MenuItem>
                                ))}
                            </Select>
                          </FormControl>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              mb: 2.5,
                              color: theme.palette.text.secondary,
                              fontSize: '0.7rem',
                            }}
                          >
                            Target agent takes over the conversation. This agent
                            stops responding.
                          </Typography>

                          <FormControl fullWidth size="small" sx={{ mb: 0.5 }}>
                            <InputLabel>Can Delegate To</InputLabel>
                            <Select
                              multiple
                              value={selectedAgent.asTools}
                              label="Can Delegate To"
                              onChange={e =>
                                updateAgent(
                                  selectedAgentKey,
                                  'asTools',
                                  e.target.value as string[],
                                )
                              }
                              MenuProps={SELECT_MENU_PROPS}
                              renderValue={vals => (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 0.5,
                                  }}
                                >
                                  {(vals as string[]).map(v => (
                                    <Chip
                                      key={v}
                                      label={agents[v]?.name || v}
                                      size="small"
                                      sx={{
                                        height: 22,
                                        fontSize: '0.75rem',
                                      }}
                                    />
                                  ))}
                                </Box>
                              )}
                            >
                              {agentKeys
                                .filter(k => k !== selectedAgentKey)
                                .map(k => (
                                  <MenuItem key={k} value={k}>
                                    {agents[k].name || k}
                                  </MenuItem>
                                ))}
                            </Select>
                          </FormControl>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              mb: 2.5,
                              color: theme.palette.text.secondary,
                              fontSize: '0.7rem',
                            }}
                          >
                            Sub-agent runs in the background and returns
                            results. This agent stays in control.
                          </Typography>

                          {/* Topology for this agent */}
                          {topologyEdges.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography
                                sx={{
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.06em',
                                  color: theme.palette.text.secondary,
                                  mb: 1,
                                }}
                              >
                                Agent Topology
                              </Typography>
                              <Box
                                sx={{
                                  p: 1.5,
                                  borderRadius: 1,
                                  backgroundColor: alpha(
                                    theme.palette.background.default,
                                    0.5,
                                  ),
                                  fontFamily: 'monospace',
                                  fontSize: '0.7rem',
                                  lineHeight: 1.8,
                                  color: theme.palette.text.secondary,
                                }}
                              >
                                {topologyEdges.map(edge => {
                                  const isCurrent =
                                    edge.from === selectedAgentKey ||
                                    edge.to === selectedAgentKey;
                                  return (
                                    <Box
                                      key={`${edge.from}-${edge.to}-${edge.type}`}
                                      sx={{
                                        fontWeight: isCurrent ? 600 : 400,
                                        color: isCurrent
                                          ? theme.palette.text.primary
                                          : undefined,
                                      }}
                                    >
                                      {agents[edge.from]?.name || edge.from}{' '}
                                      {edge.type === 'handoff'
                                        ? '\u2192'
                                        : '\u21E2'}{' '}
                                      {agents[edge.to]?.name || edge.to}
                                      <Typography
                                        component="span"
                                        sx={{
                                          fontSize: '0.6rem',
                                          ml: 0.5,
                                          color:
                                            edge.type === 'handoff'
                                              ? theme.palette.info.main
                                              : theme.palette.secondary.main,
                                        }}
                                      >
                                        {edge.type === 'handoff'
                                          ? 'transfers'
                                          : 'delegates'}
                                      </Typography>
                                    </Box>
                                  );
                                })}
                              </Box>
                            </Box>
                          )}
                        </>
                      )}
                    </Box>
                  )}

                  {/* Tab: Advanced */}
                  {activeTab === advancedTab && (
                    <Box data-tour="orch-advanced">
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                          gap: 2,
                        }}
                      >
                        <FormControl fullWidth size="small">
                          <InputLabel>Tool Choice</InputLabel>
                          <Select
                            value={selectedAgent.toolChoice ?? ''}
                            label="Tool Choice"
                            onChange={e =>
                              updateAgent(
                                selectedAgentKey,
                                'toolChoice',
                                (e.target.value as string) || undefined,
                              )
                            }
                            MenuProps={SELECT_MENU_PROPS}
                          >
                            <MenuItem value="">
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 500 }}
                                >
                                  <em>Default</em>
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="textSecondary"
                                >
                                  Inherit from platform settings
                                </Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem value="auto">
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 500 }}
                                >
                                  auto
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="textSecondary"
                                >
                                  Model decides when to call tools
                                </Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem value="required">
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 500 }}
                                >
                                  required
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="textSecondary"
                                >
                                  Always call tools
                                </Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem value="none">
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 500 }}
                                >
                                  none
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="textSecondary"
                                >
                                  Never call tools
                                </Typography>
                              </Box>
                            </MenuItem>
                          </Select>
                        </FormControl>
                        <FormControl fullWidth size="small">
                          <InputLabel>Reasoning</InputLabel>
                          <Select
                            value={selectedAgent.reasoning?.effort ?? ''}
                            label="Reasoning"
                            onChange={e => {
                              const v = e.target.value as string;
                              updateAgent(
                                selectedAgentKey,
                                'reasoning',
                                v
                                  ? { effort: v as 'low' | 'medium' | 'high' }
                                  : undefined,
                              );
                            }}
                            MenuProps={SELECT_MENU_PROPS}
                          >
                            <MenuItem value="">
                              <em>Default</em>
                            </MenuItem>
                            <MenuItem value="low">Low</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="high">High</MenuItem>
                          </Select>
                        </FormControl>
                        <TextField
                          size="small"
                          type="number"
                          label="Temperature"
                          value={selectedAgent.temperature ?? ''}
                          fullWidth
                          onChange={e => {
                            const v = parseFloat(e.target.value);
                            updateAgent(
                              selectedAgentKey,
                              'temperature',
                              e.target.value === '' || isNaN(v) ? undefined : v,
                            );
                          }}
                          inputProps={{ min: 0, max: 2, step: 0.1 }}
                        />
                        <TextField
                          size="small"
                          type="number"
                          label="Max Output Tokens"
                          value={selectedAgent.maxOutputTokens ?? ''}
                          fullWidth
                          onChange={e => {
                            const v = parseInt(e.target.value, 10);
                            updateAgent(
                              selectedAgentKey,
                              'maxOutputTokens',
                              e.target.value === '' || isNaN(v) ? undefined : v,
                            );
                          }}
                          inputProps={{ min: 1 }}
                        />
                        <TextField
                          size="small"
                          type="number"
                          label="Max Tool Calls"
                          value={selectedAgent.maxToolCalls ?? ''}
                          fullWidth
                          onChange={e => {
                            const v = parseInt(e.target.value, 10);
                            updateAgent(
                              selectedAgentKey,
                              'maxToolCalls',
                              e.target.value === '' || isNaN(v) ? undefined : v,
                            );
                          }}
                          inputProps={{ min: 1 }}
                        />
                        <TextField
                          size="small"
                          label="Guardrails"
                          value={(selectedAgent.guardrails ?? []).join(', ')}
                          fullWidth
                          onChange={e => {
                            const v = e.target.value;
                            updateAgent(
                              selectedAgentKey,
                              'guardrails',
                              v
                                ? v
                                    .split(',')
                                    .map(s => s.trim())
                                    .filter(Boolean)
                                : undefined,
                            );
                          }}
                          placeholder="shield-id-1, shield-id-2"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 3, mt: 2.5 }}>
                        <FormControlLabel
                          control={
                            <ToggleSwitch
                              checked={selectedAgent.resetToolChoice ?? false}
                              onChange={e =>
                                updateAgent(
                                  selectedAgentKey,
                                  'resetToolChoice',
                                  e.target.checked || undefined,
                                )
                              }
                            />
                          }
                          label={
                            <Box>
                              <Typography sx={{ fontSize: '0.8rem' }}>
                                Reset Tool Choice After Use
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '0.7rem',
                                  color: theme.palette.text.secondary,
                                }}
                              >
                                After a tool call, reset to &quot;auto&quot;
                              </Typography>
                            </Box>
                          }
                        />
                        <FormControlLabel
                          control={
                            <ToggleSwitch
                              checked={
                                selectedAgent.nestHandoffHistory ?? false
                              }
                              onChange={e =>
                                updateAgent(
                                  selectedAgentKey,
                                  'nestHandoffHistory',
                                  e.target.checked || undefined,
                                )
                              }
                            />
                          }
                          label={
                            <Box>
                              <Typography sx={{ fontSize: '0.8rem' }}>
                                Summarize History on Handoff
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '0.7rem',
                                  color: theme.palette.text.secondary,
                                }}
                              >
                                Compress conversation on transfer
                              </Typography>
                            </Box>
                          }
                        />
                      </Box>
                    </Box>
                  )}

                  {/* Tab: Instructions */}
                  {activeTab === instructionsTab && (
                    <Box data-tour="orch-instructions">
                      <InstructionsTab
                        agent={selectedAgent}
                        agents={agents}
                        availableMcpServers={availableMcpServers}
                        modelOptions={modelOptions}
                        modelsLoading={modelsLoading}
                        effectiveModel={
                          selectedAgent.model ||
                          (effectiveConfig?.model as string) ||
                          ''
                        }
                        generating={generating}
                        generateError={generateError}
                        onUpdateInstructions={handleUpdateInstructions}
                        onGenerate={handleGenerateForTab}
                        onRefreshModels={refreshModels}
                      />
                    </Box>
                  )}
                </Box>
                  );
                })()}
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: theme.palette.text.disabled,
                }}
              >
                <Typography>Select an agent from the list</Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* ── Create Agent modal ────────────────────────────────────────── */}
      <CreateAgentModal
        open={createModalOpen}
        agents={agents}
        isFirstAgent={agentKeys.length === 0}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateFromModal}
      />

      {/* ── Confirm dialogs ───────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmRemoveKey !== null}
        title={`Remove ${confirmRemoveKey ? agents[confirmRemoveKey]?.name || confirmRemoveKey : ''}?`}
        message="This agent will be removed. Other agents referencing it will have those references cleared. Not saved until you click Save."
        confirmLabel="Remove"
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmRemoveKey(null)}
      />
      <ConfirmDialog
        open={confirmReset}
        title="Reset to defaults?"
        message="This will discard all admin customizations and restore defaults. This cannot be undone."
        confirmLabel="Reset"
        confirmColor="warning"
        onConfirm={handleConfirmReset}
        onCancel={() => setConfirmReset(false)}
      />

      <Snackbar
        open={!!generateToast}
        autoHideDuration={4000}
        onClose={() => setGenerateToast(null)}
        message={generateToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};
