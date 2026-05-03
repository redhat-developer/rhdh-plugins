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

import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useTheme, alpha } from '@mui/material/styles';
import { useApi } from '@backstage/core-plugin-api';
import type { KagentiToolSummary, AgentLifecycleStage } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { augmentApiRef } from '../../api';
import { pageTitleSx, pageSubtitleSx, reviewCardSx } from './commandcenter.styles';
import { LIFECYCLE_COLORS, STATUS_COLORS } from './commandcenter.constants';

type ToolWithLifecycle = KagentiToolSummary & { published?: boolean; lifecycleStage?: AgentLifecycleStage; version?: number };

/**
 * Tool Review Queue -- shows tools pending approval (lifecycleStage === 'registered').
 * Approve promotes to 'deployed' (published), Reject demotes to 'draft'.
 */
export function ToolReviewQueue() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const api = useApi(augmentApiRef);

  const [tools, setTools] = useState<ToolWithLifecycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const loadTools = useCallback(() => {
    setLoading(true);
    api.listToolsWithLifecycle()
      .then(result => setTools(result.filter(t => t.lifecycleStage === 'registered')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [api]);

  useEffect(() => { loadTools(); }, [loadTools]);

  const handleApprove = useCallback(async (toolId: string) => {
    setActing(toolId);
    try {
      await api.promoteToolLifecycle(toolId, 'deployed');
      setToast(`Approved and published: ${toolId}`);
      loadTools();
    } catch (err) {
      setToast(`Failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setActing(null);
    }
  }, [api, loadTools]);

  const handleReject = useCallback(async (toolId: string) => {
    setActing(toolId);
    try {
      await api.demoteToolLifecycle(toolId, 'draft');
      setToast(`Rejected: ${toolId} returned to draft`);
      loadTools();
    } catch (err) {
      setToast(`Failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setActing(null);
    }
  }, [api, loadTools]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
      <Box>
        <Typography sx={pageTitleSx(theme)}>Tool Review Queue</Typography>
        <Typography sx={pageSubtitleSx(theme)}>
          Tools submitted for approval. Approve to publish to the marketplace.
        </Typography>
      </Box>

      {!loading && tools.length === 0 && (
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
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
            All Clear
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No tools pending review. The queue is empty.
          </Typography>
        </Box>
      )}

      {!loading && tools.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tools.map(tool => {
            const toolId = `${tool.namespace}/${tool.name}`;
            return (
              <Box key={toolId} sx={reviewCardSx(theme, isDark)}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: alpha(LIFECYCLE_COLORS.registered, isDark ? 0.2 : 0.1),
                    color: LIFECYCLE_COLORS.registered,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ExtensionOutlinedIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '0.9rem', color: 'text.primary' }}>
                    {tool.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                    {tool.namespace} {tool.labels?.framework ? `• ${tool.labels.framework}` : ''}
                    {tool.description ? ` • ${tool.description}` : ''}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    disabled={acting === toolId}
                    onClick={() => handleApprove(toolId)}
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
                    Approve
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    disabled={acting === toolId}
                    onClick={() => handleReject(toolId)}
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
            );
          })}
        </Box>
      )}

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setToast(null)} severity="info" variant="filled" sx={{ width: '100%' }}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  );
}
