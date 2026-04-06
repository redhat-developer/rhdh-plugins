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
import { useCallback, useEffect, useState } from 'react';
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
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTheme, alpha } from '@mui/material/styles';
import type {
  KagentiBuildListItem,
  KagentiBuildStrategy,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { augmentApiRef } from '../../../api';
import { getErrorMessage } from '../../../utils';

export interface KagentiBuildPipelinePanelProps {
  namespace?: string;
}

export function KagentiBuildPipelinePanel({
  namespace,
}: KagentiBuildPipelinePanelProps) {
  const theme = useTheme();
  const api = useApi(augmentApiRef);
  const [builds, setBuilds] = useState<KagentiBuildListItem[]>([]);
  const [strategies, setStrategies] = useState<KagentiBuildStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggerKey, setTriggerKey] = useState<string | null>(null);

  const loadAll = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.listKagentiShipwrightBuilds({
        namespace: namespace || undefined,
        allNamespaces: !namespace,
      }),
      api.listKagentiBuildStrategies(),
    ])
      .then(([b, s]) => {
        setBuilds(b.builds ?? []);
        setStrategies(s.strategies ?? []);
      })
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [api, namespace]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const buildRowKey = (b: KagentiBuildListItem) =>
    `${b.namespace}/${b.name}`;

  const handleTrigger = async (b: KagentiBuildListItem) => {
    const key = buildRowKey(b);
    setTriggerKey(key);
    setError(null);
    try {
      await api.triggerKagentiBuild(b.namespace, b.name);
      await loadAll();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setTriggerKey(null);
    }
  };

  const statusLabel = (b: KagentiBuildListItem) => {
    if (b.registered) return 'Registered';
    return b.resourceType ? `Unregistered (${b.resourceType})` : 'Unregistered';
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography variant="h6" sx={{ fontSize: '1rem' }}>
            Shipwright builds
          </Typography>
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
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
          Build strategies
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {strategies.length === 0 && !loading ? (
            <Typography variant="body2" color="textSecondary">
              No build strategies available
            </Typography>
          ) : (
            strategies.map(s => (
              <Chip
                key={s.name}
                label={s.description ? `${s.name}: ${s.description}` : s.name}
                size="small"
                variant="outlined"
              />
            ))
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <TableContainer
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: alpha(theme.palette.background.paper, 0.5),
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Namespace</TableCell>
                  <TableCell>Strategy</TableCell>
                  <TableCell>Git URL</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {builds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography variant="body2" color="textSecondary">
                        No builds found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  builds.map(b => {
                    const key = buildRowKey(b);
                    return (
                      <TableRow key={key}>
                        <TableCell>{b.name}</TableCell>
                        <TableCell>{b.namespace}</TableCell>
                        <TableCell>{b.strategy ?? '—'}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 240 }}>
                            {b.gitUrl ?? '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={statusLabel(b)} size="small" />
                        </TableCell>
                        <TableCell>
                          {b.creationTimestamp
                            ? new Date(b.creationTimestamp).toLocaleString()
                            : '—'}
                        </TableCell>
                        <TableCell align="right">
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
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}
