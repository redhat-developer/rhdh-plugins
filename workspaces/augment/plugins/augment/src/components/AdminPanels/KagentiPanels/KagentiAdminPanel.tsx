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
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTheme, alpha } from '@mui/material/styles';
import type {
  KagentiBuildStrategy,
  KagentiMigratableAgent,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { augmentApiRef } from '../../../api';
import { getErrorMessage } from '../../../utils';

export interface KagentiAdminPanelProps {
  namespace?: string;
}

export function KagentiAdminPanel({
  namespace: _namespace,
}: KagentiAdminPanelProps) {
  const theme = useTheme();
  const api = useApi(augmentApiRef);

  const [dashboardConfig, setDashboardConfig] = useState<{
    keycloakConsole?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [nsLoading, setNsLoading] = useState(false);

  const [migratableAgents, setMigratableAgents] = useState<
    KagentiMigratableAgent[]
  >([]);
  const [migLoading, setMigLoading] = useState(false);
  const [migrating, setMigrating] = useState<string | null>(null);

  const [strategies, setStrategies] = useState<KagentiBuildStrategy[]>([]);
  const [bsLoading, setBsLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getKagentiDashboards()
      .then(d => setDashboardConfig(d))
      .catch(() => setError('Failed to load dashboard configuration.'))
      .finally(() => setLoading(false));
  }, [api]);

  const loadNamespaces = useCallback(() => {
    setNsLoading(true);
    api
      .listKagentiNamespaces(true)
      .then(r => setNamespaces(r.namespaces ?? []))
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setNsLoading(false));
  }, [api]);

  const loadMigratable = useCallback(() => {
    setMigLoading(true);
    api
      .listKagentiMigratableAgents()
      .then(r => setMigratableAgents(r.agents ?? []))
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setMigLoading(false));
  }, [api]);

  const loadStrategies = useCallback(() => {
    setBsLoading(true);
    api
      .listKagentiBuildStrategies()
      .then(r => setStrategies(r.strategies ?? []))
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setBsLoading(false));
  }, [api]);

  useEffect(() => {
    loadNamespaces();
    loadMigratable();
    loadStrategies();
  }, [loadNamespaces, loadMigratable, loadStrategies]);

  const handleMigrate = async (ns: string, name: string) => {
    setMigrating(`${ns}/${name}`);
    setError(null);
    try {
      await api.migrateKagentiAgent(ns, name, false);
      loadMigratable();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setMigrating(null);
    }
  };

  const handleMigrateAll = async () => {
    setMigrating('__all__');
    setError(null);
    try {
      await api.migrateAllKagentiAgents({ dryRun: false });
      loadMigratable();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setMigrating(null);
    }
  };

  function loadingOrContent(
    isLoading: boolean,
    isEmpty: boolean,
    emptyText: string,
    content: ReactNode,
  ): ReactNode {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={22} />
        </Box>
      );
    }
    if (isEmpty) {
      return (
        <Typography variant="body2" sx={{ color: theme.palette.text.disabled }}>
          {emptyText}
        </Typography>
      );
    }
    return content;
  }

  const sectionShell = (
    title: string,
    subtitle: string | undefined,
    actions: ReactNode | undefined,
    children: ReactNode,
  ) => (
    <Card
      variant="outlined"
      sx={{
        mb: 3,
        p: 2.5,
        bgcolor: alpha(theme.palette.background.paper, 0.4),
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions}
      </Box>
      {children}
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          Administration
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary }}
        >
          Identity management, namespace oversight, agent migration, and build
          configuration.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {sectionShell(
        'Identity Management',
        'Manage users, roles, and authentication policies via the Keycloak console.',
        undefined,
        <Box>
          <Button
            variant="contained"
            size="small"
            href={dashboardConfig?.keycloakConsole || '#'}
            target="_blank"
            rel="noopener noreferrer"
            disabled={!dashboardConfig?.keycloakConsole}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Open Keycloak Console
          </Button>
          {!dashboardConfig?.keycloakConsole && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 1,
                color: theme.palette.text.disabled,
              }}
            >
              Keycloak console URL not configured.
            </Typography>
          )}
        </Box>,
      )}

      {sectionShell(
        'Namespace Management',
        `${namespaces.length} enabled namespace${namespaces.length !== 1 ? 's' : ''}`,
        <Tooltip title="Refresh namespaces">
          <IconButton
            size="small"
            onClick={loadNamespaces}
            disabled={nsLoading}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>,
        loadingOrContent(
          nsLoading,
          namespaces.length === 0,
          'No enabled namespaces found.',
          <TableContainer
            sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Namespace</TableCell>
                  <TableCell align="right">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {namespaces.map(ns => (
                  <TableRow key={ns}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {ns}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label="Enabled"
                        size="small"
                        color="success"
                        sx={{ height: 22 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>,
        ),
      )}

      {sectionShell(
        'Agent Migration',
        'Migrate agents from Agent CRD to Deployment workload type.',
        <Box sx={{ display: 'flex', gap: 1 }}>
          {migratableAgents.length > 0 && (
            <Button
              size="small"
              variant="outlined"
              onClick={handleMigrateAll}
              disabled={!!migrating}
              sx={{ textTransform: 'none' }}
            >
              {migrating === '__all__' ? (
                <CircularProgress size={16} sx={{ mr: 0.5 }} />
              ) : null}
              Migrate All
            </Button>
          )}
          <Tooltip title="Refresh">
            <IconButton
              size="small"
              onClick={loadMigratable}
              disabled={migLoading}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>,
        loadingOrContent(
          migLoading,
          migratableAgents.length === 0,
          'No agents require migration.',
          <TableContainer
            sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Agent</TableCell>
                  <TableCell>Namespace</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Has Deployment</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {migratableAgents.map(ma => {
                  const key = `${ma.namespace}/${ma.name}`;
                  return (
                    <TableRow key={key}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {ma.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{ma.namespace}</TableCell>
                      <TableCell>
                        <Chip
                          label={ma.status}
                          size="small"
                          sx={{ height: 22 }}
                        />
                      </TableCell>
                      <TableCell>
                        {ma.has_deployment ? (
                          <Chip
                            label="Yes"
                            size="small"
                            color="success"
                            sx={{ height: 22 }}
                          />
                        ) : (
                          <Chip
                            label="No"
                            size="small"
                            color="default"
                            sx={{ height: 22 }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleMigrate(ma.namespace, ma.name)}
                          disabled={!!migrating}
                          sx={{ textTransform: 'none' }}
                        >
                          {migrating === key ? (
                            <CircularProgress size={14} sx={{ mr: 0.5 }} />
                          ) : null}
                          Migrate
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>,
        ),
      )}

      {sectionShell(
        'Build Strategies',
        'Available ClusterBuildStrategies for source-to-image agent builds.',
        <Tooltip title="Refresh">
          <IconButton
            size="small"
            onClick={loadStrategies}
            disabled={bsLoading}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>,
        loadingOrContent(
          bsLoading,
          strategies.length === 0,
          'No build strategies available.',
          <TableContainer
            sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Strategy Name</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {strategies.map(bs => (
                  <TableRow key={bs.name}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {bs.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ color: theme.palette.text.secondary }}
                      >
                        {bs.description || '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>,
        ),
      )}

      {sectionShell(
        'Platform Configuration',
        'Model selection, RAG pipelines, tool registries, MCP servers, and safety guardrails.',
        undefined,
        <Alert severity="info" variant="outlined" sx={{ mb: 0 }}>
          Platform-level settings (LLM model, RAG, MCP, safety) are managed in
          the <strong>Platform Config</strong> section of the sidebar navigation.
        </Alert>,
      )}
    </Box>
  );
}
