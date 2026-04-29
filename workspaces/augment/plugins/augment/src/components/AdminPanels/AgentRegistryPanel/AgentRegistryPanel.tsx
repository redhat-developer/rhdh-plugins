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
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type FC,
} from 'react';
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
import InputAdornment from '@mui/material/InputAdornment';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import { useTheme, alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import StorefrontIcon from '@mui/icons-material/Storefront';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import HubIcon from '@mui/icons-material/Hub';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import VerifiedIcon from '@mui/icons-material/Verified';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import StreamIcon from '@mui/icons-material/Stream';
import DnsIcon from '@mui/icons-material/Dns';
import PsychologyIcon from '@mui/icons-material/Psychology';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useApi } from '@backstage/core-plugin-api';
import { augmentApiRef } from '../../../api';
import type {
  ChatAgent,
  ChatAgentConfig,
  AgentLifecycleStage,
  KagentiAgentCard,
  KagentiAgentDetail,
  KagentiRouteStatus,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { useChatAgentConfig } from '../../../hooks/useChatAgentConfig';

const MAX_FEATURED = 4;
const MAX_STARTERS = 6;

type SourceFilter = 'all' | 'kagenti' | 'orchestration';
type StageFilter = 'all' | 'draft' | 'registered' | 'deployed';

interface RegistryRow {
  agent: ChatAgent;
  config: ChatAgentConfig;
  dirty: boolean;
}

interface EnrichmentData {
  agentCard?: KagentiAgentCard;
  routeStatus?: KagentiRouteStatus;
  detail?: KagentiAgentDetail;
  error?: string;
}

function parseKagentiId(agentId: string): { namespace: string; name: string } | null {
  const slash = agentId.indexOf('/');
  if (slash <= 0 || slash === agentId.length - 1) return null;
  return { namespace: agentId.slice(0, slash), name: agentId.slice(slash + 1) };
}

const LIFECYCLE_STAGES: { key: AgentLifecycleStage; label: string; description: string }[] = [
  { key: 'draft', label: 'Draft', description: 'Discovered, not yet reviewed' },
  { key: 'registered', label: 'Registered', description: 'Vetted as enterprise asset' },
  { key: 'deployed', label: 'Deployed', description: 'Live in end-user catalog' },
];

function getStatusColor(status: string): string {
  const s = status?.toLowerCase();
  if (s === 'ready' || s === 'running') return '#22c55e';
  if (s === 'pending' || s === 'building') return '#f59e0b';
  if (s === 'config') return '#8b5cf6';
  if (s === 'error' || s === 'failed') return '#ef4444';
  return '#94a3b8';
}

function getStageColor(stage: AgentLifecycleStage, isDark: boolean): string {
  if (stage === 'deployed') return isDark ? '#86efac' : '#15803d';
  if (stage === 'registered') return isDark ? '#93c5fd' : '#1d4ed8';
  return isDark ? '#94a3b8' : '#64748b';
}

function getStageIcon(stage: AgentLifecycleStage) {
  if (stage === 'deployed') return <RocketLaunchIcon sx={{ fontSize: 14 }} />;
  if (stage === 'registered') return <VerifiedIcon sx={{ fontSize: 14 }} />;
  return <EditNoteIcon sx={{ fontSize: 14 }} />;
}

function getStageBg(stage: AgentLifecycleStage, isDark: boolean): string {
  if (stage === 'deployed') return isDark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)';
  if (stage === 'registered') return isDark ? 'rgba(37,99,235,0.12)' : 'rgba(37,99,235,0.08)';
  return isDark ? 'rgba(148,163,184,0.1)' : 'rgba(148,163,184,0.07)';
}

function getSourceLabel(source?: string): string {
  if (source === 'orchestration') return 'Orchestration';
  return 'Kagenti';
}

function getSourceColor(source?: string, isDark = false): string {
  if (source === 'orchestration') return isDark ? '#a78bfa' : '#7c3aed';
  return isDark ? '#60a5fa' : '#2563eb';
}

function getAvatarColor(name: string): string {
  const colors = [
    '#2563eb', '#7c3aed', '#059669', '#d97706',
    '#dc2626', '#0891b2', '#4f46e5', '#b91c1c',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 0) return 'just now';
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export const AgentRegistryPanel: FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const api = useApi(augmentApiRef);
  const {
    configs,
    loading: configLoading,
    saving,
    save: saveConfigs,
    refresh: refreshConfigs,
  } = useChatAgentConfig();

  const [agents, setAgents] = useState<ChatAgent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [rows, setRows] = useState<RegistryRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [promoting, setPromoting] = useState<string | null>(null);
  const [promoteDialog, setPromoteDialog] = useState<{ agentId: string; action: 'promote' | 'demote'; fromStage: AgentLifecycleStage; toStage: AgentLifecycleStage } | null>(null);
  const enrichmentCacheRef = useRef<Map<string, EnrichmentData>>(new Map());
  const [enrichmentLoading, setEnrichmentLoading] = useState<Set<string>>(new Set());
  const [, setEnrichmentVersion] = useState(0);

  const fetchEnrichment = useCallback(
    async (agentId: string) => {
      if (enrichmentCacheRef.current.has(agentId)) return;
      const parsed = parseKagentiId(agentId);
      if (!parsed) return;

      setEnrichmentLoading(prev => new Set(prev).add(agentId));
      try {
        const [detailResult, routeResult] = await Promise.allSettled([
          api.getKagentiAgent(parsed.namespace, parsed.name),
          api.getKagentiAgentRouteStatus(parsed.namespace, parsed.name),
        ]);

        const data: EnrichmentData = {};
        if (detailResult.status === 'fulfilled') {
          const { agentCard, ...detail } = detailResult.value as (KagentiAgentDetail & { agentCard?: KagentiAgentCard });
          data.detail = detail;
          data.agentCard = agentCard;
        }
        if (routeResult.status === 'fulfilled') {
          data.routeStatus = routeResult.value;
        }
        if (detailResult.status === 'rejected' && routeResult.status === 'rejected') {
          data.error = 'Failed to fetch runtime info';
        }
        enrichmentCacheRef.current.set(agentId, data);
      } catch {
        enrichmentCacheRef.current.set(agentId, { error: 'Failed to fetch runtime info' });
      } finally {
        setEnrichmentLoading(prev => {
          const next = new Set(prev);
          next.delete(agentId);
          return next;
        });
        setEnrichmentVersion(v => v + 1);
      }
    },
    [api],
  );

  useEffect(() => {
    if (!expandedId) return;
    const row = rows.find(r => r.agent.id === expandedId);
    if (row?.agent.source === 'kagenti') {
      fetchEnrichment(expandedId);
    }
  }, [expandedId, rows, fetchEnrichment]);

  const fetchAgents = useCallback(async () => {
    try {
      setAgentsLoading(true);
      const result = await api.listAgents();
      setAgents(result);
    } catch (err) {
      setToast(`Failed to load agents: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setAgentsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    if (agentsLoading || configLoading) return;

    const configMap = new Map(configs.map(c => [c.agentId, c]));
    const newRows: RegistryRow[] = agents.map(agent => {
      const existing = configMap.get(agent.id);
      const stage = existing?.lifecycleStage ?? agent.lifecycleStage ?? 'draft';
      return {
        agent: { ...agent, lifecycleStage: stage },
        config: existing ?? {
          agentId: agent.id,
          published: false,
          visible: false,
          featured: false,
          lifecycleStage: stage,
        },
        dirty: false,
      };
    });

    const stageOrder: Record<string, number> = { deployed: 0, registered: 1, draft: 2 };
    newRows.sort((a, b) => {
      const sa = stageOrder[a.config.lifecycleStage ?? 'draft'] ?? 3;
      const sb = stageOrder[b.config.lifecycleStage ?? 'draft'] ?? 3;
      if (sa !== sb) return sa - sb;
      if (a.config.featured !== b.config.featured) return a.config.featured ? -1 : 1;
      return (a.agent.name || '').localeCompare(b.agent.name || '');
    });

    setRows(newRows);
  }, [agents, configs, agentsLoading, configLoading]);

  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      if (search) {
        const q = search.toLowerCase();
        const matchesName = r.agent.name?.toLowerCase().includes(q);
        const matchesDesc = r.agent.description?.toLowerCase().includes(q);
        const matchesId = r.agent.id.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesId) return false;
      }
      if (sourceFilter !== 'all') {
        const src = r.agent.source || 'kagenti';
        if (sourceFilter !== src) return false;
      }
      if (stageFilter !== 'all') {
        const stage = r.config.lifecycleStage ?? 'draft';
        if (stageFilter !== stage) return false;
      }
      return true;
    });
  }, [rows, search, sourceFilter, stageFilter]);

  const stats = useMemo(() => {
    const draft = rows.filter(r => (r.config.lifecycleStage ?? 'draft') === 'draft').length;
    const registered = rows.filter(r => r.config.lifecycleStage === 'registered').length;
    const deployed = rows.filter(r => r.config.lifecycleStage === 'deployed').length;
    const kagenti = rows.filter(r => (r.agent.source || 'kagenti') === 'kagenti').length;
    const orchestration = rows.filter(r => r.agent.source === 'orchestration').length;
    const featured = rows.filter(r => r.config.featured).length;
    return { total: rows.length, draft, registered, deployed, kagenti, orchestration, featured };
  }, [rows]);

  const updateRowConfig = useCallback(
    (agentId: string, patch: Partial<ChatAgentConfig>) => {
      setRows(prev =>
        prev.map(r =>
          r.agent.id === agentId
            ? { ...r, config: { ...r.config, ...patch }, dirty: true }
            : r,
        ),
      );
      setDirty(true);
    },
    [],
  );

  const handlePromote = useCallback(
    async (agentId: string, targetStage: AgentLifecycleStage) => {
      setPromoting(agentId);
      try {
        const result = await api.promoteAgent(agentId, targetStage);
        updateRowConfig(agentId, {
          lifecycleStage: result.lifecycleStage as AgentLifecycleStage,
          published: result.lifecycleStage === 'deployed',
          visible: result.lifecycleStage === 'deployed',
          version: result.version,
          promotedAt: new Date().toISOString(),
        });
        await refreshConfigs();
        await fetchAgents();
        setToast(`Agent promoted to ${result.lifecycleStage} (v${result.version})`);
      } catch (err) {
        setToast(`Promotion failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setPromoting(null);
        setPromoteDialog(null);
      }
    },
    [api, updateRowConfig, refreshConfigs, fetchAgents],
  );

  const handleDemote = useCallback(
    async (agentId: string, targetStage: AgentLifecycleStage) => {
      setPromoting(agentId);
      try {
        const result = await api.demoteAgent(agentId, targetStage);
        updateRowConfig(agentId, {
          lifecycleStage: result.lifecycleStage as AgentLifecycleStage,
          published: result.lifecycleStage === 'deployed',
          visible: result.lifecycleStage === 'deployed',
          featured: result.lifecycleStage === 'deployed' ? undefined : false,
        });
        await refreshConfigs();
        await fetchAgents();
        setToast(`Agent moved to ${result.lifecycleStage}`);
      } catch (err) {
        setToast(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setPromoting(null);
        setPromoteDialog(null);
      }
    },
    [api, updateRowConfig, refreshConfigs, fetchAgents],
  );

  const handleBulkPublish = useCallback(
    async (publish: boolean) => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;
      setPromoting('bulk');
      try {
        await api.bulkPublishAgents(ids, publish);
        for (const id of ids) {
          updateRowConfig(id, {
            lifecycleStage: publish ? 'deployed' : 'registered',
            published: publish,
            visible: publish,
          });
        }
        await refreshConfigs();
        await fetchAgents();
        setSelectedIds(new Set());
        setToast(`${ids.length} agents ${publish ? 'deployed' : 'withdrawn'}`);
      } catch (err) {
        setToast(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setPromoting(null);
      }
    },
    [selectedIds, api, updateRowConfig, refreshConfigs, fetchAgents],
  );

  const handleToggleFeatured = useCallback(
    (agentId: string, featured: boolean) => {
      if (featured && stats.featured >= MAX_FEATURED) {
        setToast(`Maximum ${MAX_FEATURED} featured agents`);
        return;
      }
      updateRowConfig(agentId, { featured });
    },
    [updateRowConfig, stats.featured],
  );

  const handleSaveAll = useCallback(async () => {
    const allConfigs: ChatAgentConfig[] = rows
      .filter(
        r =>
          r.dirty ||
          r.config.published ||
          r.config.featured ||
          r.config.displayName ||
          r.config.description ||
          r.config.avatarUrl ||
          r.config.accentColor ||
          r.config.greeting ||
          (r.config.conversationStarters && r.config.conversationStarters.length > 0),
      )
      .map(r => ({
        ...r.config,
        conversationStarters: (r.config.conversationStarters || []).filter(
          s => s.trim() !== '',
        ),
      }));
    try {
      await saveConfigs(allConfigs);
      setDirty(false);
      setRows(prev => prev.map(r => ({ ...r, dirty: false })));
      setToast('Registry saved');
    } catch {
      setToast('Failed to save');
    }
  }, [rows, saveConfigs]);

  const handleSelectToggle = useCallback((agentId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(agentId)) next.delete(agentId);
      else next.add(agentId);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRows.map(r => r.agent.id)));
    }
  }, [selectedIds.size, filteredRows]);

  if (agentsLoading || configLoading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary">
          Loading agents...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxWidth: 1080,
        mx: 'auto',
        overflow: 'hidden',
      }}
    >
      {/* ── Header (fixed) ── */}
      <Box sx={{ flexShrink: 0, px: 3, pt: 2.5, pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDark
                  ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))'
                  : 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.08))',
              }}
            >
              <StorefrontIcon sx={{ fontSize: 18, color: isDark ? '#a5b4fc' : '#6366f1' }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, fontSize: '1rem', color: 'text.primary', letterSpacing: '-0.02em', lineHeight: 1.2 }}
              >
                Agent Registry
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontSize: '0.7rem', lineHeight: 1.3 }}
              >
                Lifecycle management from draft to production
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.75, flexShrink: 0 }}>
            <Tooltip title="Refresh agents">
              <IconButton
                size="small"
                onClick={() => { fetchAgents(); refreshConfigs(); }}
                sx={{
                  width: 32,
                  height: 32,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1.5,
                }}
              >
                <RefreshIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              size="small"
              startIcon={saving ? <CircularProgress size={14} /> : <SaveIcon sx={{ fontSize: 15 }} />}
              disabled={!dirty || saving}
              onClick={handleSaveAll}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                borderRadius: 1.5,
                px: 2,
                height: 32,
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none' },
              }}
            >
              Save Changes
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ── Lifecycle Pipeline (fixed) ── */}
      <Box sx={{ flexShrink: 0, px: 3, pb: 1.5 }}>
        <LifecyclePipeline stats={stats} isDark={isDark} onFilterStage={setStageFilter} activeFilter={stageFilter} />
      </Box>

      {/* ── Filters + Count (sticky) ── */}
      <Box
        sx={{
          flexShrink: 0,
          px: 3,
          pb: 1,
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <TextField
          size="small"
          placeholder="Search agents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            minWidth: 200,
            '& .MuiOutlinedInput-root': {
              fontSize: '0.8rem',
              borderRadius: 1.5,
              height: 32,
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value as SourceFilter)}
            sx={{ fontSize: '0.8rem', borderRadius: 1.5, height: 32 }}
          >
            <MenuItem value="all">All Sources</MenuItem>
            <MenuItem value="kagenti">Kagenti</MenuItem>
            <MenuItem value="orchestration">Orchestration</MenuItem>
          </Select>
        </FormControl>

        {selectedIds.size > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto', alignItems: 'center' }}>
            <Chip
              size="small"
              label={`${selectedIds.size} selected`}
              sx={{ height: 22, fontSize: '0.675rem', fontWeight: 600 }}
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={<RocketLaunchIcon sx={{ fontSize: 13 }} />}
              onClick={() => handleBulkPublish(true)}
              disabled={promoting === 'bulk'}
              sx={{ textTransform: 'none', fontSize: '0.7rem', borderRadius: 1.5, height: 28 }}
            >
              Deploy All
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<CloudOffIcon sx={{ fontSize: 13 }} />}
              onClick={() => handleBulkPublish(false)}
              disabled={promoting === 'bulk'}
              sx={{ textTransform: 'none', fontSize: '0.7rem', borderRadius: 1.5, height: 28 }}
            >
              Withdraw All
            </Button>
          </Box>
        )}
      </Box>

      {/* ── Select All bar ── */}
      {filteredRows.length > 0 && (
        <Box
          sx={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 3.5,
            pb: 0.75,
          }}
        >
          <Checkbox
            size="small"
            checked={selectedIds.size === filteredRows.length && filteredRows.length > 0}
            indeterminate={selectedIds.size > 0 && selectedIds.size < filteredRows.length}
            onChange={handleSelectAll}
            sx={{ p: 0.25 }}
          />
          <Typography
            variant="caption"
            sx={{
              color: 'text.disabled',
              fontSize: '0.65rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Select all ({filteredRows.length})
          </Typography>
        </Box>
      )}

      {/* ── Agent List (scrollable) ── */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 3,
          pb: 2,
          '&::-webkit-scrollbar': { width: 5 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: alpha(theme.palette.text.primary, 0.15),
            borderRadius: 3,
          },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
        }}
      >
        {filteredRows.length === 0 ? (
          <Alert
            severity="info"
            sx={{ mt: 2, borderRadius: 2, fontSize: '0.8rem' }}
          >
            {rows.length === 0
              ? 'No agents found. Deploy agents via the Agents panel or configure orchestration to get started.'
              : 'No agents match the current filters.'}
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {filteredRows.map(row => (
              <AgentRow
                key={row.agent.id}
                row={row}
                isDark={isDark}
                isExpanded={expandedId === row.agent.id}
                isSelected={selectedIds.has(row.agent.id)}
                isPromoting={promoting === row.agent.id}
                featuredCount={stats.featured}
                enrichment={enrichmentCacheRef.current.get(row.agent.id)}
                enrichmentLoading={enrichmentLoading.has(row.agent.id)}
                onToggleExpand={() => setExpandedId(expandedId === row.agent.id ? null : row.agent.id)}
                onToggleSelect={() => handleSelectToggle(row.agent.id)}
                onRequestPromote={(action, from, to) => setPromoteDialog({ agentId: row.agent.id, action, fromStage: from, toStage: to })}
                onToggleFeatured={handleToggleFeatured}
                onUpdateConfig={updateRowConfig}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Promotion Confirmation Dialog */}
      <PromoteConfirmDialog
        dialog={promoteDialog}
        isPromoting={!!promoting}
        onConfirm={() => {
          if (!promoteDialog) return;
          if (promoteDialog.action === 'promote') {
            handlePromote(promoteDialog.agentId, promoteDialog.toStage);
          } else {
            handleDemote(promoteDialog.agentId, promoteDialog.toStage);
          }
        }}
        onCancel={() => setPromoteDialog(null)}
        agentName={promoteDialog ? (rows.find(r => r.agent.id === promoteDialog.agentId)?.agent.name ?? promoteDialog.agentId) : ''}
        isDark={isDark}
      />

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

// ---------------------------------------------------------------------------
// Lifecycle Pipeline Visualization
// ---------------------------------------------------------------------------

interface LifecyclePipelineProps {
  stats: { total: number; draft: number; registered: number; deployed: number; featured: number };
  isDark: boolean;
  onFilterStage: (stage: StageFilter) => void;
  activeFilter: StageFilter;
}

const LifecyclePipeline: FC<LifecyclePipelineProps> = ({ stats, isDark, onFilterStage, activeFilter }) => {
  const theme = useTheme();

  const stages = [
    { key: 'draft' as StageFilter, label: 'Draft', count: stats.draft, icon: <EditNoteIcon sx={{ fontSize: 16 }} />, color: isDark ? '#94a3b8' : '#64748b' },
    { key: 'registered' as StageFilter, label: 'Registered', count: stats.registered, icon: <VerifiedIcon sx={{ fontSize: 16 }} />, color: isDark ? '#93c5fd' : '#2563eb' },
    { key: 'deployed' as StageFilter, label: 'Deployed', count: stats.deployed, icon: <RocketLaunchIcon sx={{ fontSize: 16 }} />, color: isDark ? '#86efac' : '#15803d' },
  ];

  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {stages.map((stage, i) => {
          const isActive = activeFilter === stage.key;
          return (
            <Box key={stage.key} sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <Box
                role="button"
                tabIndex={0}
                onClick={() => onFilterStage(isActive ? 'all' : stage.key)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFilterStage(isActive ? 'all' : stage.key); } }}
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 1.75,
                  py: 1.25,
                  borderRadius: 2,
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  border: `1px solid ${isActive ? alpha(stage.color, 0.5) : theme.palette.divider}`,
                  bgcolor: isActive
                    ? alpha(stage.color, isDark ? 0.12 : 0.06)
                    : isDark ? alpha(theme.palette.background.paper, 0.4) : theme.palette.background.paper,
                  boxShadow: isActive
                    ? `0 0 0 1px ${alpha(stage.color, 0.15)}`
                    : isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                  '&:hover': {
                    bgcolor: alpha(stage.color, isDark ? 0.1 : 0.05),
                    borderColor: alpha(stage.color, 0.35),
                    transform: 'translateY(-1px)',
                    boxShadow: `0 2px 8px ${alpha(stage.color, 0.12)}`,
                  },
                  '&::before': isActive ? {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: `linear-gradient(90deg, ${stage.color}, ${alpha(stage.color, 0.3)})`,
                    borderRadius: '2px 2px 0 0',
                  } : {},
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 1.25,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(stage.color, isDark ? 0.2 : 0.12),
                    color: stage.color,
                    flexShrink: 0,
                  }}
                >
                  {stage.icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      display: 'block',
                      lineHeight: 1.2,
                    }}
                  >
                    {stage.label}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      fontSize: '1.35rem',
                      lineHeight: 1.1,
                      color: stage.color,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {stage.count}
                  </Typography>
                </Box>
              </Box>
              {i < stages.length - 1 && (
                <ArrowForwardIcon sx={{ fontSize: 14, color: alpha(theme.palette.text.disabled, 0.5), mx: 0.5, flexShrink: 0 }} />
              )}
            </Box>
          );
        })}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1, flexWrap: 'wrap' }}>
        <Chip
          size="small"
          label={`${stats.total} Total`}
          sx={{
            height: 20,
            fontWeight: 600,
            fontSize: '0.65rem',
            bgcolor: alpha(theme.palette.text.primary, isDark ? 0.08 : 0.05),
            color: 'text.secondary',
          }}
        />
        <Chip
          size="small"
          icon={<StarIcon sx={{ fontSize: '11px !important' }} />}
          label={`${stats.featured}/${MAX_FEATURED} Featured`}
          sx={{
            height: 20,
            fontWeight: 600,
            fontSize: '0.65rem',
            bgcolor: alpha('#f59e0b', isDark ? 0.15 : 0.1),
            color: isDark ? '#fcd34d' : '#b45309',
          }}
        />
        {activeFilter !== 'all' && (
          <Chip
            size="small"
            label={`Filtered: ${activeFilter}`}
            onDelete={() => onFilterStage('all')}
            sx={{ height: 20, fontWeight: 600, fontSize: '0.65rem' }}
          />
        )}
      </Box>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Promotion Confirmation Dialog
// ---------------------------------------------------------------------------

interface PromoteConfirmDialogProps {
  dialog: { agentId: string; action: 'promote' | 'demote'; fromStage: AgentLifecycleStage; toStage: AgentLifecycleStage } | null;
  isPromoting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  agentName: string;
  isDark: boolean;
}

const PromoteConfirmDialog: FC<PromoteConfirmDialogProps> = ({ dialog, isPromoting, onConfirm, onCancel, agentName, isDark }) => {
  if (!dialog) return null;

  const isPromoteAction = dialog.action === 'promote';
  const fromLabel = LIFECYCLE_STAGES.find(s => s.key === dialog.fromStage)?.label ?? dialog.fromStage;
  const toLabel = LIFECYCLE_STAGES.find(s => s.key === dialog.toStage)?.label ?? dialog.toStage;
  const toColor = getStageColor(dialog.toStage, isDark);

  return (
    <Dialog open maxWidth="xs" fullWidth onClose={onCancel}>
      <DialogTitle sx={{ pb: 1, fontWeight: 700, fontSize: '1rem' }}>
        {isPromoteAction ? 'Promote Agent' : 'Withdraw Agent'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Chip
            size="small"
            label={fromLabel}
            icon={getStageIcon(dialog.fromStage)}
            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
          />
          <ArrowForwardIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
          <Chip
            size="small"
            label={toLabel}
            icon={getStageIcon(dialog.toStage)}
            sx={{ fontWeight: 600, fontSize: '0.75rem', color: toColor, bgcolor: getStageBg(dialog.toStage, isDark) }}
          />
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
          {isPromoteAction && dialog.toStage === 'registered' && (
            <>Register <strong>{agentName}</strong> as a vetted enterprise asset. It will not be visible to end users until deployed.</>
          )}
          {isPromoteAction && dialog.toStage === 'deployed' && (
            <>Deploy <strong>{agentName}</strong> to the end-user catalog. Users will be able to discover and chat with this agent.</>
          )}
          {!isPromoteAction && dialog.toStage === 'registered' && (
            <>Withdraw <strong>{agentName}</strong> from the end-user catalog. It will remain registered but no longer visible to users.</>
          )}
          {!isPromoteAction && dialog.toStage === 'draft' && (
            <>Move <strong>{agentName}</strong> back to draft status. This removes its registered status.</>
          )}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} size="small" sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          size="small"
          disabled={isPromoting}
          color={isPromoteAction ? 'primary' : 'inherit'}
          startIcon={isPromoting ? <CircularProgress size={14} /> : (isPromoteAction ? <ArrowForwardIcon /> : <ArrowBackIcon />)}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          {isPromoteAction ? `Promote to ${toLabel}` : `Move to ${toLabel}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// AgentRow sub-component
// ---------------------------------------------------------------------------

interface AgentRowProps {
  row: RegistryRow;
  isDark: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  isPromoting: boolean;
  featuredCount: number;
  enrichment?: EnrichmentData;
  enrichmentLoading?: boolean;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
  onRequestPromote: (action: 'promote' | 'demote', from: AgentLifecycleStage, to: AgentLifecycleStage) => void;
  onToggleFeatured: (agentId: string, featured: boolean) => void;
  onUpdateConfig: (agentId: string, patch: Partial<ChatAgentConfig>) => void;
}

const AgentRow: FC<AgentRowProps> = ({
  row,
  isDark,
  isExpanded,
  isSelected,
  isPromoting,
  enrichment,
  enrichmentLoading,
  onToggleExpand,
  onToggleSelect,
  onRequestPromote,
  onToggleFeatured,
  onUpdateConfig,
}) => {
  const theme = useTheme();
  const { agent, config } = row;
  const stage = config.lifecycleStage ?? 'draft';
  const displayName = config.displayName || agent.name || agent.id;
  const avatarColor = config.accentColor || getAvatarColor(displayName);
  const sourceColor = getSourceColor(agent.source, isDark);
  const statusColor = getStatusColor(agent.status);
  const stageColor = getStageColor(stage, isDark);
  const nextStage = stage === 'draft' ? 'registered' : stage === 'registered' ? 'deployed' : undefined;
  const prevStage = stage === 'deployed' ? 'registered' : stage === 'registered' ? 'draft' : undefined;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        opacity: stage === 'draft' ? 0.75 : 1,
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        borderColor: isSelected
          ? theme.palette.primary.main
          : stage === 'deployed'
            ? alpha(theme.palette.success.main, 0.25)
            : stage === 'registered'
              ? alpha(theme.palette.info.main, 0.15)
              : theme.palette.divider,
        borderLeft: `3px solid ${stageColor}`,
        '&:hover': {
          borderColor: isSelected
            ? theme.palette.primary.main
            : alpha(stageColor, 0.4),
          boxShadow: `0 2px 8px ${alpha(stageColor, isDark ? 0.12 : 0.08)}`,
        },
      }}
    >
      <CardContent sx={{ p: '10px 12px !important', display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Checkbox size="small" checked={isSelected} onChange={onToggleSelect} sx={{ p: 0.25, flexShrink: 0 }} />

        {/* Avatar */}
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.8rem',
            bgcolor: alpha(avatarColor, isDark ? 0.2 : 0.12),
            color: avatarColor,
            flexShrink: 0,
            border: `1.5px solid ${alpha(avatarColor, 0.2)}`,
          }}
        >
          {displayName.charAt(0).toUpperCase()}
        </Box>

        {/* Name + meta */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600, fontSize: '0.8rem', color: 'text.primary', letterSpacing: '-0.01em' }}>
              {displayName}
            </Typography>
            <Chip
              size="small"
              label={LIFECYCLE_STAGES.find(s => s.key === stage)?.label ?? stage}
              icon={getStageIcon(stage)}
              sx={{
                height: 18,
                fontSize: '0.6rem',
                fontWeight: 600,
                bgcolor: getStageBg(stage, isDark),
                color: stageColor,
                '& .MuiChip-icon': { color: stageColor, ml: '3px' },
                '& .MuiChip-label': { px: '5px' },
              }}
            />
            <Chip
              size="small"
              label={getSourceLabel(agent.source)}
              icon={agent.source === 'orchestration' ? <HubIcon sx={{ fontSize: '10px !important' }} /> : <SmartToyIcon sx={{ fontSize: '10px !important' }} />}
              sx={{
                height: 18,
                fontSize: '0.6rem',
                fontWeight: 600,
                bgcolor: alpha(sourceColor, isDark ? 0.12 : 0.08),
                color: sourceColor,
                '& .MuiChip-icon': { color: sourceColor, ml: '3px' },
                '& .MuiChip-label': { px: '5px' },
              }}
            />
            <Tooltip title={agent.status || 'Unknown'}>
              <FiberManualRecordIcon sx={{ fontSize: 8, color: statusColor }} />
            </Tooltip>
            {enrichment?.routeStatus && (
              <Tooltip title={enrichment.routeStatus.hasRoute ? `Routable${enrichment.routeStatus.url ? ` — ${enrichment.routeStatus.url}` : ''}` : 'No route'}>
                {enrichment.routeStatus.hasRoute
                  ? <LinkIcon sx={{ fontSize: 12, color: isDark ? '#86efac' : '#15803d' }} />
                  : <LinkOffIcon sx={{ fontSize: 12, color: 'text.disabled' }} />}
              </Tooltip>
            )}
            {(agent.version ?? 0) > 0 && (
              <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600, color: 'text.disabled' }}>
                v{agent.version}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.125 }}>
            <Typography variant="caption" noWrap sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
              {agent.id}
              {agent.framework ? ` · ${agent.framework}` : ''}
            </Typography>
            {agent.promotedAt && (
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.575rem', display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <HistoryIcon sx={{ fontSize: 9 }} />
                {timeAgo(agent.promotedAt)}
              </Typography>
            )}
            {agent.promotedBy && (
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.575rem', display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <PersonIcon sx={{ fontSize: 9 }} />
                {agent.promotedBy.replace(/^user:default\//, '')}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Promotion Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          {isPromoting ? (
            <CircularProgress size={18} />
          ) : (
            <>
              {prevStage && (
                <Tooltip title={`Withdraw to ${LIFECYCLE_STAGES.find(s => s.key === prevStage)?.label}`}>
                  <IconButton
                    size="small"
                    onClick={() => onRequestPromote('demote', stage, prevStage as AgentLifecycleStage)}
                    sx={{
                      color: 'text.disabled',
                      width: 26,
                      height: 26,
                      '&:hover': { color: 'text.secondary' },
                    }}
                  >
                    <ArrowBackIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              )}
              {nextStage && (
                <Tooltip title={`Promote to ${LIFECYCLE_STAGES.find(s => s.key === nextStage)?.label}`}>
                  <Button
                    size="small"
                    variant={nextStage === 'deployed' ? 'contained' : 'outlined'}
                    color={nextStage === 'deployed' ? 'success' : 'primary'}
                    onClick={() => onRequestPromote('promote', stage, nextStage as AgentLifecycleStage)}
                    startIcon={nextStage === 'deployed' ? <RocketLaunchIcon sx={{ fontSize: 13 }} /> : <VerifiedIcon sx={{ fontSize: 13 }} />}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.675rem',
                      minWidth: 0,
                      py: 0.25,
                      px: 1,
                      borderRadius: 1.25,
                      height: 26,
                      boxShadow: nextStage === 'deployed' ? `0 1px 4px ${alpha('#22c55e', 0.25)}` : 'none',
                    }}
                  >
                    {nextStage === 'deployed' ? 'Deploy' : 'Register'}
                  </Button>
                </Tooltip>
              )}
              {stage === 'deployed' && (
                <Chip
                  size="small"
                  icon={<CheckCircleIcon sx={{ fontSize: '12px !important' }} />}
                  label="Live"
                  sx={{
                    height: 22,
                    fontWeight: 600,
                    fontSize: '0.65rem',
                    bgcolor: alpha('#22c55e', isDark ? 0.15 : 0.1),
                    color: isDark ? '#86efac' : '#15803d',
                    '& .MuiChip-icon': { color: isDark ? '#86efac' : '#15803d' },
                    border: `1px solid ${alpha('#22c55e', isDark ? 0.2 : 0.15)}`,
                  }}
                />
              )}
            </>
          )}
        </Box>

        {/* Featured star */}
        <Tooltip title={config.featured ? 'Remove from featured' : 'Feature on welcome'}>
          <span>
            <IconButton
              size="small"
              disabled={stage !== 'deployed'}
              onClick={() => onToggleFeatured(agent.id, !config.featured)}
              sx={{
                width: 26,
                height: 26,
                color: config.featured ? '#f59e0b' : 'text.disabled',
                transition: 'color 0.15s ease',
              }}
            >
              {config.featured ? <StarIcon sx={{ fontSize: 16 }} /> : <StarBorderIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </span>
        </Tooltip>

        {/* Expand */}
        <IconButton
          size="small"
          onClick={onToggleExpand}
          sx={{
            width: 26,
            height: 26,
            transition: 'transform 0.2s ease',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <ExpandMoreIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </CardContent>

      {/* Expanded Detail */}
      <Collapse in={isExpanded} unmountOnExit>
        <Box sx={{ px: 2, pb: 2 }}>
          {/* Lifecycle Pipeline (mini for this agent) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2, py: 1, px: 1.5, bgcolor: alpha(theme.palette.text.primary, isDark ? 0.03 : 0.02), borderRadius: 1.5 }}>
            {LIFECYCLE_STAGES.map((s, i) => {
              const isActive = s.key === stage;
              const isPast = LIFECYCLE_STAGES.findIndex(ls => ls.key === stage) > i;
              const sc = getStageColor(s.key, isDark);
              return (
                <Box key={s.key} sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box
                      sx={{
                        width: 24, height: 24, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: (isActive || isPast) ? alpha(sc, isDark ? 0.2 : 0.15) : alpha(theme.palette.text.disabled, 0.1),
                        color: (isActive || isPast) ? sc : 'text.disabled',
                        border: isActive ? `2px solid ${sc}` : '2px solid transparent',
                      }}
                    >
                      {isPast ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : getStageIcon(s.key)}
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: isActive ? 700 : 500, fontSize: '0.6875rem', color: (isActive || isPast) ? sc : 'text.disabled', display: 'block', lineHeight: 1.2 }}>
                        {s.label}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled', display: 'block', lineHeight: 1.2 }}>
                        {s.description}
                      </Typography>
                    </Box>
                  </Box>
                  {i < LIFECYCLE_STAGES.length - 1 && (
                    <Box sx={{ flex: 1, height: 2, mx: 1, bgcolor: isPast ? alpha(sc, 0.3) : alpha(theme.palette.divider, 0.5), borderRadius: 1 }} />
                  )}
                </Box>
              );
            })}
          </Box>

          {/* Kagenti Runtime Info (lazy-loaded) */}
          {agent.source === 'kagenti' && (
            <KagentiRuntimeInfo
              enrichment={enrichment}
              loading={!!enrichmentLoading}
              isDark={isDark}
            />
          )}

          {/* Two-Column: Dev Info | Ops Info */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            {/* Development Info */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.6875rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1, display: 'block' }}>
                Development
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <DetailRow label="Source" value={getSourceLabel(agent.source)} />
                <DetailRow label="Framework" value={agent.framework || '—'} />
                <DetailRow label="Protocols" value={agent.protocols?.join(', ') || '—'} />
                <DetailRow label="Agent ID" value={agent.id} />
                {agent.namespace && <DetailRow label="Namespace" value={agent.namespace} />}
                <DetailRow label="Created" value={agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : '—'} />
              </Box>
            </Box>

            {/* Operations Info */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.6875rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1, display: 'block' }}>
                Operations
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <DetailRow label="Runtime Status" value={agent.status} chipColor={getStatusColor(agent.status)} />
                <DetailRow label="Lifecycle" value={LIFECYCLE_STAGES.find(s => s.key === stage)?.label ?? stage} chipColor={stageColor} />
                <DetailRow label="Version" value={`v${agent.version ?? 0}`} />
                <DetailRow label="Last Promoted" value={agent.promotedAt ? timeAgo(agent.promotedAt) : 'Never'} />
                <DetailRow label="Promoted By" value={agent.promotedBy ? agent.promotedBy.replace(/^user:default\//, '') : '—'} />
                <DetailRow label="Default Agent" value={agent.isDefault ? 'Yes' : 'No'} />
              </Box>
            </Box>
          </Box>

          {/* Description */}
          {agent.description && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontStyle: 'italic', lineHeight: 1.5, display: 'block', mb: 1.5 }}>
                {agent.description}
              </Typography>
            </>
          )}

          <Divider sx={{ my: 1.5 }} />

          {/* Display Overrides */}
          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.6875rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1, display: 'block' }}>
            Display Overrides
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 1.5 }}>
            <TextField
              label="Display Name" size="small"
              value={config.displayName || ''}
              onChange={e => onUpdateConfig(agent.id, { displayName: e.target.value || undefined })}
              placeholder={agent.name || ''} InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Accent Color" size="small"
              value={config.accentColor || ''}
              onChange={e => onUpdateConfig(agent.id, { accentColor: e.target.value || undefined })}
              placeholder="#1e40af" InputLabelProps={{ shrink: true }}
            />
          </Box>
          <TextField
            label="Description Override" size="small" multiline minRows={2} fullWidth
            value={config.description || ''}
            onChange={e => onUpdateConfig(agent.id, { description: e.target.value || undefined })}
            placeholder={agent.description || ''} InputLabelProps={{ shrink: true }}
            sx={{ mb: 1.5 }}
          />
          <TextField
            label="Avatar URL" size="small" fullWidth
            value={config.avatarUrl || ''}
            onChange={e => onUpdateConfig(agent.id, { avatarUrl: e.target.value || undefined })}
            placeholder="https://example.com/avatar.png" InputLabelProps={{ shrink: true }}
            sx={{ mb: 1.5 }}
          />
          <TextField
            label="Greeting Message" size="small" multiline minRows={2} fullWidth
            value={config.greeting || ''}
            onChange={e => onUpdateConfig(agent.id, { greeting: e.target.value || undefined })}
            placeholder="Hi! I'm here to help."
            helperText="First bot message when a user starts a new conversation"
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 1.5 }}
          />

          {/* Conversation starters */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem', mb: 0.5, display: 'block', color: 'text.primary' }}>
              Conversation Starters
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6875rem', mb: 1, display: 'block' }}>
              Suggested prompts shown on the welcome screen for this agent
            </Typography>
            {(config.conversationStarters || []).map((starter, si) => (
              <Box key={si} sx={{ display: 'flex', gap: 0.5, mb: 0.75, alignItems: 'center' }}>
                <Chip label={si + 1} size="small" sx={{ height: 20, fontSize: '0.65rem', minWidth: 24 }} />
                <TextField
                  size="small" fullWidth value={starter}
                  onChange={e => {
                    const starters = [...(config.conversationStarters || [])];
                    starters[si] = e.target.value;
                    onUpdateConfig(agent.id, { conversationStarters: starters });
                  }}
                  placeholder="Ask me about..."
                  sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.8rem' } }}
                />
                <IconButton
                  size="small"
                  onClick={() => {
                    const starters = [...(config.conversationStarters || [])];
                    starters.splice(si, 1);
                    onUpdateConfig(agent.id, { conversationStarters: starters });
                  }}
                  sx={{ color: 'text.disabled' }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            ))}
            <Button
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 14 }} />}
              onClick={() => {
                const starters = [...(config.conversationStarters || [])];
                if (starters.length >= MAX_STARTERS) return;
                starters.push('');
                onUpdateConfig(agent.id, { conversationStarters: starters });
              }}
              disabled={(config.conversationStarters || []).length >= MAX_STARTERS}
              sx={{ textTransform: 'none', fontSize: '0.75rem', mt: 0.5 }}
            >
              Add starter
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Kagenti Runtime Info (lazy-loaded enrichment)
// ---------------------------------------------------------------------------

interface KagentiRuntimeInfoProps {
  enrichment?: EnrichmentData;
  loading: boolean;
  isDark: boolean;
}

const KagentiRuntimeInfo: FC<KagentiRuntimeInfoProps> = ({ enrichment, loading, isDark }) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2,
          py: 1.25,
          px: 1.5,
          bgcolor: alpha(theme.palette.info.main, isDark ? 0.06 : 0.03),
          borderRadius: 1.5,
          border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
        }}
      >
        <CircularProgress size={14} />
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
          Loading runtime info from Kagenti...
        </Typography>
      </Box>
    );
  }

  if (!enrichment) return null;

  if (enrichment.error && !enrichment.agentCard && !enrichment.routeStatus && !enrichment.detail) {
    return (
      <Box
        sx={{
          mb: 2,
          py: 1,
          px: 1.5,
          bgcolor: alpha(theme.palette.warning.main, isDark ? 0.08 : 0.04),
          borderRadius: 1.5,
          border: `1px solid ${alpha(theme.palette.warning.main, 0.12)}`,
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
          {enrichment.error}
        </Typography>
      </Box>
    );
  }

  const { agentCard, routeStatus, detail } = enrichment;
  const workloadType = detail?.workloadType || 'Unknown';
  const readyStatus = detail?.readyStatus || 'Unknown';
  const replicas = (detail?.spec as Record<string, unknown>)?.replicas;
  const containers = (
    (detail?.spec as Record<string, unknown>)?.template as Record<string, unknown>
  )?.spec as Record<string, unknown> | undefined;
  const containerList = (containers?.containers ?? []) as Array<{ image?: string; name?: string }>;
  const containerImage = containerList[0]?.image;

  return (
    <Box
      sx={{
        mb: 2,
        py: 1.25,
        px: 1.5,
        bgcolor: alpha(theme.palette.info.main, isDark ? 0.05 : 0.025),
        borderRadius: 1.5,
        border: `1px solid ${alpha(theme.palette.info.main, isDark ? 0.12 : 0.08)}`,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          fontSize: '0.625rem',
          color: isDark ? '#93c5fd' : '#2563eb',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          display: 'block',
          mb: 1,
        }}
      >
        Kagenti Runtime
      </Typography>

      {/* Status badges row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
        {/* Route status */}
        {routeStatus && (
          <Chip
            size="small"
            icon={routeStatus.hasRoute
              ? <LinkIcon sx={{ fontSize: '12px !important' }} />
              : <LinkOffIcon sx={{ fontSize: '12px !important' }} />}
            label={routeStatus.hasRoute ? 'Routable' : 'No Route'}
            sx={{
              height: 20,
              fontSize: '0.6rem',
              fontWeight: 600,
              bgcolor: routeStatus.hasRoute
                ? alpha('#22c55e', isDark ? 0.15 : 0.1)
                : alpha(theme.palette.text.disabled, 0.08),
              color: routeStatus.hasRoute
                ? (isDark ? '#86efac' : '#15803d')
                : 'text.disabled',
              '& .MuiChip-icon': {
                color: routeStatus.hasRoute
                  ? (isDark ? '#86efac' : '#15803d')
                  : 'text.disabled',
              },
            }}
          />
        )}

        {/* Streaming */}
        {agentCard && (
          <Chip
            size="small"
            icon={<StreamIcon sx={{ fontSize: '12px !important' }} />}
            label={agentCard.streaming ? 'Streaming' : 'Request/Response'}
            sx={{
              height: 20,
              fontSize: '0.6rem',
              fontWeight: 600,
              bgcolor: agentCard.streaming
                ? alpha('#3b82f6', isDark ? 0.15 : 0.1)
                : alpha(theme.palette.text.disabled, 0.08),
              color: agentCard.streaming
                ? (isDark ? '#93c5fd' : '#1d4ed8')
                : 'text.disabled',
              '& .MuiChip-icon': {
                color: agentCard.streaming
                  ? (isDark ? '#93c5fd' : '#1d4ed8')
                  : 'text.disabled',
              },
            }}
          />
        )}

        {/* Workload type */}
        {detail && (
          <Chip
            size="small"
            icon={<DnsIcon sx={{ fontSize: '12px !important' }} />}
            label={workloadType}
            sx={{
              height: 20,
              fontSize: '0.6rem',
              fontWeight: 600,
              bgcolor: alpha(theme.palette.text.primary, isDark ? 0.08 : 0.05),
              color: 'text.secondary',
              '& .MuiChip-icon': { color: 'text.secondary' },
            }}
          />
        )}

        {/* Ready status */}
        {detail && (
          <Chip
            size="small"
            label={readyStatus}
            sx={{
              height: 20,
              fontSize: '0.6rem',
              fontWeight: 600,
              bgcolor: alpha(getStatusColor(readyStatus), isDark ? 0.15 : 0.1),
              color: getStatusColor(readyStatus),
            }}
          />
        )}

        {/* Replicas */}
        {replicas !== undefined && (
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem', fontWeight: 600 }}>
            {String(replicas)} replica{Number(replicas) !== 1 ? 's' : ''}
          </Typography>
        )}
      </Box>

      {/* Detail rows */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.375 }}>
        {agentCard?.url && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.625rem', minWidth: 70, flexShrink: 0 }}>
              A2A URL
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{ fontSize: '0.625rem', fontFamily: 'monospace', color: 'text.secondary' }}
            >
              {agentCard.url}
            </Typography>
          </Box>
        )}

        {routeStatus?.hasRoute && routeStatus.url && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.625rem', minWidth: 70, flexShrink: 0 }}>
              Route URL
            </Typography>
            <Typography
              variant="caption"
              noWrap
              component="a"
              href={routeStatus.url as string}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                fontSize: '0.625rem',
                fontFamily: 'monospace',
                color: isDark ? '#93c5fd' : '#2563eb',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
                display: 'flex',
                alignItems: 'center',
                gap: 0.25,
              }}
            >
              {routeStatus.url as string}
              <OpenInNewIcon sx={{ fontSize: 10 }} />
            </Typography>
          </Box>
        )}

        {containerImage && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.625rem', minWidth: 70, flexShrink: 0 }}>
              Image
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{ fontSize: '0.625rem', fontFamily: 'monospace', color: 'text.secondary' }}
            >
              {containerImage}
            </Typography>
          </Box>
        )}

        {agentCard?.version && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.625rem', minWidth: 70, flexShrink: 0 }}>
              Card Version
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.625rem', color: 'text.secondary' }}>
              {agentCard.version}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Skills */}
      {agentCard?.skills && agentCard.skills.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              fontSize: '0.6rem',
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'block',
              mb: 0.5,
            }}
          >
            Skills
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {agentCard.skills.map((skill, i) => (
              <Tooltip
                key={skill.id ?? i}
                title={skill.examples?.[0] ? `e.g. "${skill.examples[0]}"` : skill.description || ''}
                arrow
              >
                <Chip
                  size="small"
                  icon={<PsychologyIcon sx={{ fontSize: '11px !important' }} />}
                  label={skill.name || skill.id || `Skill ${i + 1}`}
                  sx={{
                    height: 18,
                    fontSize: '0.575rem',
                    fontWeight: 600,
                    bgcolor: alpha('#8b5cf6', isDark ? 0.12 : 0.08),
                    color: isDark ? '#c4b5fd' : '#6d28d9',
                    '& .MuiChip-icon': { color: isDark ? '#c4b5fd' : '#6d28d9' },
                  }}
                />
              </Tooltip>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// DetailRow helper
// ---------------------------------------------------------------------------

const DetailRow: FC<{ label: string; value: string; chipColor?: string }> = ({ label, value, chipColor }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6875rem', minWidth: 90, flexShrink: 0 }}>
      {label}
    </Typography>
    {chipColor ? (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <FiberManualRecordIcon sx={{ fontSize: 8, color: chipColor }} />
        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.6875rem', color: 'text.primary' }}>
          {value}
        </Typography>
      </Box>
    ) : (
      <Typography variant="caption" noWrap sx={{ fontWeight: 500, fontSize: '0.6875rem', color: 'text.primary' }}>
        {value}
      </Typography>
    )}
  </Box>
);
