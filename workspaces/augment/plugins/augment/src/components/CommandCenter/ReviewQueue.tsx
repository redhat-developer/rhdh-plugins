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

import { useEffect, useState, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useTheme, alpha } from '@mui/material/styles';
import { useApi } from '@backstage/core-plugin-api';
import type { ChatAgent } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { augmentApiRef } from '../../api';
import {
  pageTitleSx,
  pageSubtitleSx,
  reviewCardSx,
} from './commandcenter.styles';
import { LIFECYCLE_COLORS, STATUS_COLORS } from './commandcenter.constants';

/**
 * Dedicated Review Queue -- shows agents in 'pending' stage pending approval.
 * Approve promotes to 'published', Reject demotes to 'draft'.
 */
export function ReviewQueue() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const api = useApi(augmentApiRef);

  const [agents, setAgents] = useState<ChatAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectAgentId, setRejectAgentId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const initialLoadDone = useRef(false);

  const loadAgents = useCallback(() => {
    if (!initialLoadDone.current) {
      setLoading(true);
    }
    api
      .listAgents()
      .then(result =>
        setAgents(result.filter(a => a.lifecycleStage === 'pending')),
      )
      .catch(() => {})
      .finally(() => {
        initialLoadDone.current = true;
        setLoading(false);
      });
  }, [api]);

  useEffect(() => {
    loadAgents();
    const interval = setInterval(loadAgents, 30_000);
    return () => clearInterval(interval);
  }, [loadAgents]);

  const handleApprove = useCallback(
    async (agentId: string) => {
      setActing(agentId);
      try {
        await api.promoteAgent(agentId, 'pending');
        setToast(`Approved to staging: ${agentId}`);
        loadAgents();
      } catch (err) {
        setToast(`Failed: ${err instanceof Error ? err.message : 'Unknown'}`);
      } finally {
        setActing(null);
      }
    },
    [api, loadAgents],
  );

  const handleFastTrack = useCallback(
    async (agentId: string) => {
      setActing(agentId);
      try {
        await api.promoteAgent(agentId, 'pending');
        await api.promoteAgent(agentId, 'published');
        setToast(`Fast-tracked to production: ${agentId}`);
        loadAgents();
      } catch (err) {
        setToast(`Failed: ${err instanceof Error ? err.message : 'Unknown'}`);
      } finally {
        setActing(null);
      }
    },
    [api, loadAgents],
  );

  const handleOpenRejectDialog = useCallback((agentId: string) => {
    setRejectAgentId(agentId);
    setRejectReason('');
    setRejectDialogOpen(true);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectAgentId) return;
    setRejectDialogOpen(false);
    setActing(rejectAgentId);
    try {
      await api.demoteAgent(rejectAgentId, 'draft', rejectReason || undefined);
      setToast(`Rejected: ${rejectAgentId} returned to draft`);
      loadAgents();
    } catch (err) {
      setToast(`Failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setActing(null);
      setRejectAgentId(null);
      setRejectReason('');
    }
  }, [api, rejectAgentId, rejectReason, loadAgents]);

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}
    >
      <Box>
        <Typography sx={pageTitleSx(theme)}>Review Queue</Typography>
        <Typography sx={pageSubtitleSx(theme)}>
          Agents submitted for review. Approve to move to staging, or fast-track
          to production.
        </Typography>
      </Box>

      {/* Empty state */}
      {!loading && agents.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
            gap: 2,
          }}
        >
          <CheckCircleOutlineIcon
            sx={{
              fontSize: 56,
              color: STATUS_COLORS.healthy,
              filter: `drop-shadow(0 0 12px ${alpha(STATUS_COLORS.healthy, 0.5)})`,
            }}
          />
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: 'text.primary' }}
          >
            All Clear
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No agents pending review. The queue is empty.
          </Typography>
        </Box>
      )}

      {/* Review cards */}
      {!loading && agents.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {agents.map(agent => (
            <Box key={agent.id} sx={reviewCardSx(theme, isDark)}>
              {/* Agent info */}
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: alpha(LIFECYCLE_COLORS.review, isDark ? 0.2 : 0.1),
                  color: LIFECYCLE_COLORS.review,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  flexShrink: 0,
                }}
              >
                {agent.name.charAt(0).toUpperCase()}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: 'text.primary',
                  }}
                >
                  {agent.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
                >
                  {agent.namespace}{' '}
                  {agent.framework ? `• ${agent.framework}` : ''}
                  {agent.promotedAt
                    ? ` • Submitted ${new Date(agent.promotedAt).toLocaleDateString()}`
                    : ''}
                </Typography>
              </Box>

              {/* Actions */}
              <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  disabled={acting === agent.id}
                  onClick={() => handleApprove(agent.id)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 1.5,
                    boxShadow: 'none',
                    '&:hover': {
                      boxShadow: `0 0 12px ${alpha(STATUS_COLORS.healthy, 0.4)}`,
                    },
                  }}
                >
                  Approve to Staging
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  disabled={acting === agent.id}
                  onClick={() => handleFastTrack(agent.id)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 1.5,
                    '&:hover': {
                      boxShadow: `0 0 12px ${alpha(STATUS_COLORS.warning, 0.3)}`,
                    },
                  }}
                >
                  Fast-track to Production
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  disabled={acting === agent.id}
                  onClick={() => handleOpenRejectDialog(agent.id)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 1.5,
                    '&:hover': {
                      boxShadow: `0 0 12px ${alpha(STATUS_COLORS.critical, 0.3)}`,
                    },
                  }}
                >
                  Reject
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Reject reason dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Agent</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Provide a reason for rejecting this agent. The creator will see this
            feedback when their agent is returned to draft.
          </Typography>
          <TextField
            label="Rejection reason"
            multiline
            minRows={3}
            fullWidth
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Describe what needs to be fixed or improved..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmReject}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast(null)}
          severity="info"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  );
}
