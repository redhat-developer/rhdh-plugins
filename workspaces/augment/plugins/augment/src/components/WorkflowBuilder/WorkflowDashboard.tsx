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

import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Skeleton from '@mui/material/Skeleton';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SearchIcon from '@mui/icons-material/Search';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import { useTheme, alpha } from '@mui/material/styles';
import { useApi, configApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import type { WorkflowDefinition } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { createDefaultWorkflow, WORKFLOW_TEMPLATES } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { elevationShadow, TYPE_SCALE } from './theme/tokens';

interface WorkflowDashboardProps {
  onOpenWorkflow: (workflow: WorkflowDefinition) => void;
  onCreateWorkflow: (workflow: WorkflowDefinition) => void;
}

interface TemplateItem {
  id: string;
  name: string;
  description: string;
  workflow?: WorkflowDefinition;
}

type SortBy = 'updated' | 'name' | 'nodes';

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const TEMPLATES: TemplateItem[] = WORKFLOW_TEMPLATES.map(wf => ({
  id: wf.id,
  name: wf.name,
  description: wf.description,
  workflow: wf,
}));

function sortWorkflows(list: WorkflowDefinition[], sortBy: SortBy): WorkflowDefinition[] {
  return [...list].sort((a, b) => {
    switch (sortBy) {
      case 'name': return a.name.localeCompare(b.name);
      case 'nodes': return (b.nodes?.length || 0) - (a.nodes?.length || 0);
      case 'updated':
      default: return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    }
  });
}

export function WorkflowDashboard({ onOpenWorkflow, onCreateWorkflow }: WorkflowDashboardProps) {
  const theme = useTheme();
  const configApi = useApi(configApiRef);
  const { fetch: authFetch } = useApi(fetchApiRef);
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuWorkflow, setMenuWorkflow] = useState<WorkflowDefinition | null>(null);
  const [renameDialog, setRenameDialog] = useState<WorkflowDefinition | null>(null);
  const [renameName, setRenameName] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<WorkflowDefinition | null>(null);
  const [dashTab, setDashTab] = useState<'drafts' | 'templates'>('drafts');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('updated');

  const backendUrl = configApi.getString('backend.baseUrl');

  const loadWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${backendUrl}/api/augment/workflows`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setWorkflows(data.workflows || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  }, [backendUrl, authFetch]);

  useEffect(() => { loadWorkflows(); }, [loadWorkflows]);

  const handleCreate = () => {
    const wf = createDefaultWorkflow(`wf-${Date.now()}`, 'New Agent Workflow');
    onCreateWorkflow(wf);
  };

  const handleTemplateClick = (template: TemplateItem) => {
    if (template.workflow) {
      const wf: WorkflowDefinition = {
        ...template.workflow,
        id: `wf-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onCreateWorkflow(wf);
    } else {
      const wf = createDefaultWorkflow(`wf-${Date.now()}`, template.name);
      wf.description = template.description;
      onCreateWorkflow(wf);
    }
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, wf: WorkflowDefinition) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setMenuWorkflow(wf);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuWorkflow(null);
  };

  const handleRename = async () => {
    if (!renameDialog || !renameName.trim()) return;
    try {
      await authFetch(`${backendUrl}/api/augment/workflows/${renameDialog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...renameDialog, name: renameName.trim() }),
      });
      setRenameDialog(null);
      loadWorkflows();
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await authFetch(`${backendUrl}/api/augment/workflows/${deleteDialog.id}`, { method: 'DELETE' });
      setDeleteDialog(null);
      loadWorkflows();
    } catch {
      /* ignore */
    }
  };

  const handleDuplicate = async (wf: WorkflowDefinition) => {
    const dup = {
      ...wf,
      id: `wf-${Date.now()}`,
      name: `${wf.name} (copy)`,
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 0,
    };
    try {
      await authFetch(`${backendUrl}/api/augment/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dup),
      });
      loadWorkflows();
    } catch {
      /* ignore */
    }
  };

  const allDrafts = workflows.filter(w => w.status === 'draft' || !w.status);
  const allPublished = workflows.filter(w => w.status === 'published');

  const filteredDrafts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const list = q ? allDrafts.filter(w => w.name.toLowerCase().includes(q) || w.description?.toLowerCase().includes(q)) : allDrafts;
    return sortWorkflows(list, sortBy);
  }, [allDrafts, searchQuery, sortBy]);

  const filteredPublished = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const list = q ? allPublished.filter(w => w.name.toLowerCase().includes(q) || w.description?.toLowerCase().includes(q)) : allPublished;
    return sortWorkflows(list, sortBy);
  }, [allPublished, searchQuery, sortBy]);

  const hasNoWorkflows = !loading && allDrafts.length === 0 && allPublished.length === 0;
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return localStorage.getItem('wf-onboarding-dismissed') !== 'true'; } catch { return true; }
  });
  const dismissOnboarding = () => {
    setShowOnboarding(false);
    try { localStorage.setItem('wf-onboarding-dismissed', 'true'); } catch { /* */ }
  };

  const renderWorkflowCard = (wf: WorkflowDefinition, statusLabel: string, accentColor: string) => (
    <Card
      key={wf.id}
      variant="outlined"
      sx={{
        borderRadius: 2,
        borderLeft: `3px solid ${accentColor}`,
        position: 'relative',
        transition: 'border-color 0.2s, transform 0.15s, box-shadow 0.15s',
        '&:hover': {
          borderColor: accentColor,
          transform: 'translateY(-2px)',
          boxShadow: elevationShadow(theme, 2),
        },
      }}
    >
      <CardActionArea onClick={() => onOpenWorkflow(wf)}>
        <CardContent sx={{ pb: '12px !important', pr: 5 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={600} noWrap sx={{ color: 'text.primary' }}>{wf.name}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {wf.nodes?.length || 0} nodes &middot; v{wf.version} &middot; {formatRelativeTime(wf.updatedAt)}
            </Typography>
          </Box>
          <Box sx={{ mt: 1 }}>
            <Chip
              label={statusLabel}
              size="small"
              sx={{
                height: 20,
                fontSize: TYPE_SCALE.microLabel.size,
                bgcolor: alpha(accentColor, 0.15),
                color: accentColor,
              }}
            />
          </Box>
        </CardContent>
      </CardActionArea>
      <IconButton
        size="small"
        onClick={e => handleMenuOpen(e, wf)}
        aria-label={`Actions for ${wf.name}`}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          color: 'text.secondary',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          p: 0.25,
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
    </Card>
  );

  return (
    <Box sx={{ maxWidth: 1200, py: 3, px: { xs: 2, sm: 3, md: 4 }, overflowX: 'hidden' }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5, color: 'text.primary' }}>
        Agent Builder
      </Typography>

      {/* Onboarding banner */}
      {showOnboarding && !hasNoWorkflows && (
        <Alert
          severity="info"
          variant="outlined"
          onClose={dismissOnboarding}
          sx={{ mb: 2, borderRadius: 2, '& .MuiAlert-message': { flex: 1 } }}
        >
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>Getting started</Typography>
          <Typography variant="caption" color="text.secondary" component="div">
            1. Create a workflow from scratch or pick a template &middot;
            2. Add nodes from the left palette &middot;
            3. Configure each node in the right panel &middot;
            4. Preview with sample input &middot;
            5. Publish when ready
          </Typography>
        </Alert>
      )}


      {/* Tabs + search + sort */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <Box role="tablist" aria-label="Dashboard tabs" sx={{ display: 'flex', gap: 0.5 }}>
          <Chip
            label="Drafts"
            role="tab"
            aria-selected={dashTab === 'drafts'}
            onClick={() => setDashTab('drafts')}
            variant={dashTab === 'drafts' ? 'filled' : 'outlined'}
            sx={{
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.82rem',
              color: 'text.primary',
              borderColor: theme.palette.divider,
            }}
          />
          <Chip
            label="Templates"
            role="tab"
            aria-selected={dashTab === 'templates'}
            onClick={() => setDashTab('templates')}
            variant={dashTab === 'templates' ? 'filled' : 'outlined'}
            sx={{
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.82rem',
              color: 'text.primary',
              borderColor: theme.palette.divider,
            }}
          />
        </Box>

        <Box sx={{ flex: 1 }} />

        {dashTab === 'drafts' && (
          <>
            <TextField
              size="small"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 220, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <Select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortBy)}
                sx={{ borderRadius: 2, fontSize: '0.8rem' }}
              >
                <MenuItem value="updated">Last modified</MenuItem>
                <MenuItem value="name">Name A-Z</MenuItem>
                <MenuItem value="nodes">Most nodes</MenuItem>
              </Select>
            </FormControl>
          </>
        )}
      </Box>

      {/* Templates tab */}
      {dashTab === 'templates' && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))',
            gap: 2,
          }}>
            {TEMPLATES.map(t => (
              <Card
                key={t.id}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  transition: 'border-color 0.2s, transform 0.15s, box-shadow 0.15s',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    transform: 'translateY(-2px)',
                    boxShadow: elevationShadow(theme, 2),
                  },
                }}
              >
                <CardActionArea onClick={() => handleTemplateClick(t)} sx={{ height: '100%' }}>
                  <CardContent>
                    <SmartToyIcon sx={{ color: 'warning.main', mb: 1, fontSize: 28 }} />
                    <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'text.primary' }}>{t.name}</Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
                      {t.description}
                    </Typography>
                    <Chip label="Template" size="small" sx={{ mt: 1.5, height: 20, fontSize: TYPE_SCALE.microLabel.size, color: 'text.secondary' }} />
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Skeleton loading */}
      {loading && (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 2,
        }}>
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} variant="rounded" height={100} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      )}

      {/* Empty state */}
      {dashTab === 'drafts' && hasNoWorkflows && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 2 }}>
          <AccountTreeOutlinedIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
          <Typography variant="h6" fontWeight={600} color="text.primary">
            No workflows yet
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 360 }}>
            Create your first agent workflow from scratch, or pick a template to get started quickly.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate} sx={{ textTransform: 'none', borderRadius: 2 }}>
              Create blank
            </Button>
            <Button variant="outlined" onClick={() => setDashTab('templates')} sx={{ textTransform: 'none', borderRadius: 2 }}>
              Browse templates
            </Button>
          </Box>
        </Box>
      )}

      {/* Drafts */}
      {dashTab === 'drafts' && !loading && filteredDrafts.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="overline" sx={{ mb: 1, display: 'block', color: 'text.secondary' }}>
            Drafts ({filteredDrafts.length})
          </Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))',
            gap: 2,
          }}>
            {filteredDrafts.map(wf => renderWorkflowCard(wf, 'Draft', theme.palette.warning.main))}
          </Box>
        </Box>
      )}

      {/* Published */}
      {dashTab === 'drafts' && !loading && filteredPublished.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="overline" sx={{ mb: 1, display: 'block', color: 'text.secondary' }}>
            Published ({filteredPublished.length})
          </Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))',
            gap: 2,
          }}>
            {filteredPublished.map(wf => renderWorkflowCard(wf, 'Published', theme.palette.success.main))}
          </Box>
        </Box>
      )}

      {/* No search results */}
      {dashTab === 'drafts' && !loading && !hasNoWorkflows && searchQuery && filteredDrafts.length === 0 && filteredPublished.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No workflows matching "{searchQuery}"
          </Typography>
        </Box>
      )}

      {/* Context menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem onClick={() => {
          if (menuWorkflow) { setRenameName(menuWorkflow.name); setRenameDialog(menuWorkflow); }
          handleMenuClose();
        }}>Rename</MenuItem>
        <MenuItem onClick={() => {
          if (menuWorkflow) handleDuplicate(menuWorkflow);
          handleMenuClose();
        }}>Duplicate</MenuItem>
        <MenuItem onClick={() => {
          if (menuWorkflow) setDeleteDialog(menuWorkflow);
          handleMenuClose();
        }} sx={{ color: 'error.main' }}>Delete</MenuItem>
      </Menu>

      {/* Rename dialog */}
      <Dialog open={Boolean(renameDialog)} onClose={() => setRenameDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Rename workflow</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            value={renameName}
            onChange={e => setRenameName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleRename(); }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleRename}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={Boolean(deleteDialog)} onClose={() => setDeleteDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete workflow</DialogTitle>
        <DialogContent>
          <Typography>Delete &quot;{deleteDialog?.name}&quot;? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
