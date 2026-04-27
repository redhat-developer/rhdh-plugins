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
import { useApi } from '@backstage/core-plugin-api';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTheme, alpha } from '@mui/material/styles';
import type {
  KagentiBuildListItem,
  KagentiBuildInfo,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { augmentApiRef } from '../../../api';
import { getErrorMessage } from '../../../utils';
import {
  CONTENT_MAX_WIDTH,
  TABLE_HEADER_CELL_SX,
  tableContainerSx,
} from '../shared/commandCenterStyles';

export interface KagentiBuildPipelinePanelProps {
  namespace?: string;
}

const MAX_BUILD_INFO_FETCH = 20;

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '--';
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

function phaseColor(
  phase: string | undefined,
  palette: {
    success: { main: string };
    warning: { main: string };
    error: { main: string };
    info: { main: string };
    text: { secondary: string };
  },
): string {
  const p = (phase ?? '').toLowerCase();
  if (p === 'succeeded') return palette.success.main;
  if (p === 'running' || p === 'pending') return palette.info.main;
  if (p === 'failed') return palette.error.main;
  return palette.text.secondary;
}

function isTool(b: KagentiBuildListItem): boolean {
  return (b.resourceType ?? '').toLowerCase() === 'tool';
}

export function KagentiBuildPipelinePanel({
  namespace,
}: KagentiBuildPipelinePanelProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const api = useApi(augmentApiRef);
  const [builds, setBuilds] = useState<KagentiBuildListItem[]>([]);
  const [buildInfoMap, setBuildInfoMap] = useState<
    Map<string, KagentiBuildInfo>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggerKey, setTriggerKey] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const paginatedBuilds = useMemo(
    () => builds.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [builds, page, rowsPerPage],
  );

  const buildRowKey = useCallback(
    (b: KagentiBuildListItem) => `${b.namespace}/${b.name}`,
    [],
  );

  const fetchBuildInfos = useCallback(
    async (items: KagentiBuildListItem[]) => {
      const slice = items.slice(0, MAX_BUILD_INFO_FETCH);
      const results = await Promise.allSettled(
        slice.map(b =>
          isTool(b)
            ? api.getToolBuildInfo(b.namespace, b.name)
            : api.getKagentiBuildInfo(b.namespace, b.name),
        ),
      );
      const map = new Map<string, KagentiBuildInfo>();
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          map.set(`${slice[i].namespace}/${slice[i].name}`, r.value);
        }
      });
      return map;
    },
    [api],
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listKagentiShipwrightBuilds({
        namespace: namespace || undefined,
        allNamespaces: !namespace,
      });
      const items = res.builds ?? [];
      setBuilds(items);
      const infos = await fetchBuildInfos(items);
      setBuildInfoMap(infos);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [api, namespace, fetchBuildInfos]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleTrigger = async (b: KagentiBuildListItem) => {
    const key = buildRowKey(b);
    setTriggerKey(key);
    setError(null);
    try {
      if (isTool(b)) {
        await api.triggerToolBuild(b.namespace, b.name);
      } else {
        await api.triggerKagentiBuild(b.namespace, b.name);
      }
      await loadAll();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setTriggerKey(null);
    }
  };

  const thStyle = TABLE_HEADER_CELL_SX;

  function renderTableContent() {
    if (builds.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={8}>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ py: 2, textAlign: 'center' }}
            >
              No builds found.
            </Typography>
          </TableCell>
        </TableRow>
      );
    }
    return paginatedBuilds.map(b => {
      const key = buildRowKey(b);
      const info = buildInfoMap.get(key);
      const typeLabel = isTool(b) ? 'Tool' : 'Agent';
      const typeColor = isTool(b)
        ? theme.palette.info.main
        : theme.palette.primary.main;

      const regColor = b.registered
        ? theme.palette.success.main
        : theme.palette.warning.main;

      const runPhase = info?.buildRunPhase;
      const runColor = phaseColor(runPhase, theme.palette);
      let runLabel = '...';
      if (info) {
        runLabel = info.hasBuildRun ? runPhase || 'Unknown' : 'No runs';
      }

      const failMsg = info?.buildRunFailureMessage;

      return (
        <TableRow key={key} hover>
          <TableCell>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, fontSize: '0.875rem' }}
            >
              {b.name}
            </Typography>
          </TableCell>
          <TableCell>
            <Chip
              label={typeLabel}
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.75rem',
                height: 24,
                borderColor: alpha(typeColor, 0.4),
                color: typeColor,
              }}
            />
          </TableCell>
          <TableCell>
            <Typography variant="caption" color="textSecondary">
              {b.namespace}
            </Typography>
          </TableCell>
          <TableCell>
            <Typography variant="caption" color="textSecondary">
              {b.strategy ?? '--'}
            </Typography>
          </TableCell>
          <TableCell>
            <Tooltip title={b.gitUrl || '--'} arrow placement="top">
              <Typography
                variant="body2"
                noWrap
                sx={{ maxWidth: 200, fontSize: '0.875rem', cursor: 'default' }}
              >
                {b.gitUrl ?? '--'}
              </Typography>
            </Tooltip>
          </TableCell>
          <TableCell>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Chip
                label={b.registered ? 'Registered' : 'Unregistered'}
                size="small"
                sx={{
                  fontSize: '0.75rem',
                  height: 24,
                  fontWeight: 600,
                  bgcolor: alpha(regColor, isDark ? 0.15 : 0.1),
                  color: regColor,
                  border: 'none',
                }}
              />
              <Tooltip title={failMsg || ''} arrow placement="top">
                <Chip
                  label={runLabel}
                  size="small"
                  sx={{
                    fontSize: '0.75rem',
                    height: 24,
                    fontWeight: 600,
                    bgcolor: alpha(runColor, isDark ? 0.15 : 0.1),
                    color: runColor,
                    border: 'none',
                  }}
                />
              </Tooltip>
            </Box>
          </TableCell>
          <TableCell>
            <Typography variant="caption" color="textSecondary">
              {timeAgo(b.creationTimestamp)}
            </Typography>
          </TableCell>
          <TableCell align="right">
            <Tooltip title="Trigger build run" arrow>
              <Box component="span">
                <IconButton
                  size="small"
                  aria-label="Trigger build"
                  onClick={() => handleTrigger(b)}
                  disabled={triggerKey === key}
                >
                  {triggerKey === key ? (
                    <CircularProgress size={18} />
                  ) : (
                    <PlayArrowIcon fontSize="small" />
                  )}
                </IconButton>
              </Box>
            </Tooltip>
          </TableCell>
        </TableRow>
      );
    });
  }

  return (
    <Box sx={{ maxWidth: CONTENT_MAX_WIDTH }}>
      <Card variant="outlined">
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              mb: 3,
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Build Pipelines
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary, mt: 0.25 }}
              >
                View and trigger container image builds for your agents and
                tools.
              </Typography>
            </Box>
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={loadAll}
              disabled={loading}
              sx={{ textTransform: 'none' }}
            >
              Refresh
            </Button>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <>
              <TableContainer sx={tableContainerSx(theme)}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={thStyle}>Name</TableCell>
                      <TableCell sx={thStyle}>Type</TableCell>
                      <TableCell sx={thStyle}>Workspace</TableCell>
                      <TableCell sx={thStyle}>Strategy</TableCell>
                      <TableCell sx={thStyle}>Git URL</TableCell>
                      <TableCell sx={thStyle}>Status</TableCell>
                      <TableCell sx={thStyle}>Created</TableCell>
                      <TableCell sx={thStyle} align="right">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>{renderTableContent()}</TableBody>
                </Table>
              </TableContainer>
              {builds.length > rowsPerPage && (
                <TablePagination
                  component="div"
                  count={builds.length}
                  page={page}
                  onPageChange={(_e, p) => setPage(p)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={e => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[5, 10, 25]}
                  sx={{ borderTop: 1, borderColor: 'divider' }}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
