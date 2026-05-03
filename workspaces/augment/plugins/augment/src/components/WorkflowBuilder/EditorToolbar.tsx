import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CodeIcon from '@mui/icons-material/Code';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SettingsIcon from '@mui/icons-material/Settings';
import ScienceIcon from '@mui/icons-material/Science';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTheme } from '@mui/material/styles';
import type { WorkflowStatus } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { elevationShadow, TYPE_SCALE } from './theme/tokens';

export type EditorMode = 'edit' | 'preview';

interface EditorToolbarProps {
  workflowName: string;
  status: WorkflowStatus;
  version: number;
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  onBack?: () => void;
  onCodeExport?: () => void;
  onPublish?: () => void;
  onSettings?: () => void;
  onEvaluate?: () => void;
  onRename?: (newName: string) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  saveStatus?: 'saved' | 'saving' | 'unsaved';
}

const statusColors: Record<WorkflowStatus, 'default' | 'success' | 'warning'> = {
  draft: 'default',
  published: 'success',
  archived: 'warning',
};

export function EditorToolbar({
  workflowName,
  status,
  version,
  mode,
  onModeChange,
  onBack,
  onCodeExport,
  onPublish,
  onSettings,
  onEvaluate,
  onRename,
  onDuplicate,
  onDelete,
  saveStatus,
}: EditorToolbarProps) {
  const theme = useTheme();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(workflowName);

  const handleMenuClose = useCallback(() => setMenuAnchor(null), []);
  const handleRenameSubmit = useCallback(() => {
    if (renameValue.trim() && onRename) onRename(renameValue.trim());
    setRenameOpen(false);
  }, [renameValue, onRename]);

  const activeToggleShadow = elevationShadow(theme, 1);

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 0.75,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          flexShrink: 0,
          minHeight: 44,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        {/* Left: breadcrumb-style back + name + status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flexShrink: 1 }}>
          {onBack && (
            <Tooltip title="Back to dashboard">
              <IconButton
                size="small"
                onClick={onBack}
                aria-label="Back to dashboard"
                sx={{
                  flexShrink: 0,
                  color: 'text.primary',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 0.5,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <ArrowBackIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
          {onBack && (
            <Typography
              variant="caption"
              noWrap
              sx={{ color: 'text.secondary', cursor: 'pointer', fontSize: TYPE_SCALE.microLabel.size, flexShrink: 0, '&:hover': { textDecoration: 'underline' } }}
              onClick={onBack}
            >
              Agent Builder
            </Typography>
          )}
          {onBack && (
            <Typography variant="caption" sx={{ color: 'text.disabled', mx: -0.5, fontSize: TYPE_SCALE.microLabel.size, flexShrink: 0 }}>/</Typography>
          )}
          <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ minWidth: 0, color: 'text.primary' }}>
            {workflowName}
          </Typography>
          <Tooltip title={`Status: ${status}`}>
            <Chip label={status} size="small" color={statusColors[status]} variant="outlined" sx={{ fontSize: TYPE_SCALE.microLabel.size, height: 20, flexShrink: 0 }} />
          </Tooltip>
          {version > 1 && (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: TYPE_SCALE.microLabel.size, flexShrink: 0 }}>
              v{version}
            </Typography>
          )}
          {saveStatus === 'saving' && (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: TYPE_SCALE.microLabel.size, flexShrink: 0 }}>Saving...</Typography>
          )}
          {saveStatus === 'saved' && (
            <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main', flexShrink: 0 }} />
          )}
        </Box>

        {/* Center spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Center: Edit/Preview mode toggle */}
        <Box
          role="tablist"
          aria-label="Editor mode"
          sx={{
            display: 'flex',
            bgcolor: 'action.hover',
            borderRadius: 1.5,
            p: 0.25,
            flexShrink: 0,
          }}
        >
          <Tooltip title="Edit mode">
            <IconButton
              size="small"
              role="tab"
              aria-selected={mode === 'edit'}
              aria-label="Edit mode"
              onClick={() => onModeChange('edit')}
              sx={{
                p: 0.5,
                borderRadius: 1,
                color: 'text.primary',
                bgcolor: mode === 'edit' ? 'background.paper' : 'transparent',
                boxShadow: mode === 'edit' ? activeToggleShadow : 'none',
              }}
            >
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Preview mode">
            <IconButton
              size="small"
              role="tab"
              aria-selected={mode === 'preview'}
              aria-label="Preview mode"
              onClick={() => onModeChange('preview')}
              sx={{
                p: 0.5,
                borderRadius: 1,
                color: 'text.primary',
                bgcolor: mode === 'preview' ? 'background.paper' : 'transparent',
                boxShadow: mode === 'preview' ? activeToggleShadow : 'none',
              }}
            >
              <PlayArrowIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Right spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Right actions — icon-only to stay compact */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
          <Tooltip title="More actions">
            <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)} aria-label="More actions" sx={{ color: 'text.primary' }}>
              <MoreHorizIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          {onSettings && (
            <Tooltip title="Workflow settings">
              <IconButton size="small" onClick={onSettings} aria-label="Workflow settings" sx={{ color: 'text.primary' }}>
                <SettingsIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
          {onEvaluate && (
            <Tooltip title="Run evaluations (Cmd+E)">
              <IconButton size="small" onClick={onEvaluate} aria-label="Evaluate workflow" sx={{ color: 'text.secondary' }}>
                <ScienceIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Export as code">
            <IconButton size="small" onClick={onCodeExport} aria-label="Export code" sx={{ color: 'text.primary' }}>
              <CodeIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Publish this workflow">
            <Button
              size="small"
              variant="contained"
              disableElevation
              onClick={onPublish}
              sx={{ textTransform: 'none', fontSize: '0.78rem', borderRadius: 1.5, ml: 0.5 }}
            >
              Publish
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* More menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem onClick={() => { handleMenuClose(); setRenameOpen(true); setRenameValue(workflowName); }}>Rename</MenuItem>
        {onDuplicate && <MenuItem onClick={() => { handleMenuClose(); onDuplicate(); }}>Duplicate</MenuItem>}
        {onDelete && <MenuItem onClick={() => { handleMenuClose(); onDelete(); }}>Delete</MenuItem>}
      </Menu>

      {/* Rename dialog */}
      <Dialog open={renameOpen} onClose={() => setRenameOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Rename workflow</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleRenameSubmit(); }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameOpen(false)}>Cancel</Button>
          <Button onClick={handleRenameSubmit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
