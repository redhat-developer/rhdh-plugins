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
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useApi } from '@backstage/core-plugin-api';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTheme, alpha } from '@mui/material/styles';
import type {
  KagentiBuildStrategy,
  KagentiMigratableAgent,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { augmentApiRef } from '../../../api';
import * as kagentiEndpoints from '../../../api/kagentiEndpoints';
import type { KagentiApiDeps } from '../../../api/kagentiEndpoints';
import { getErrorMessage } from '../../../utils';
import { useAdminConfig } from '../../../hooks';
import {
  CONTENT_MAX_WIDTH,
  PAGE_TITLE_SX,
  PAGE_SUBTITLE_SX,
  sectionCardSx,
} from '../shared/commandCenterStyles';

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

  const kagentiDeps: KagentiApiDeps = useMemo(
    () => ({
      fetchJson: (
        api as unknown as { fetchJson: KagentiApiDeps['fetchJson'] }
      ).fetchJson.bind(api),
    }),
    [api],
  );

  // LLM models/teams/keys state
  const [llmModels, setLlmModels] = useState<Record<string, unknown> | null>(
    null,
  );
  const [llmTeams, setLlmTeams] = useState<Array<Record<string, unknown>>>([]);
  const [llmKeys, setLlmKeys] = useState<Array<Record<string, unknown>>>([]);
  const [llmLoading, setLlmLoading] = useState(false);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [createTeamNs, setCreateTeamNs] = useState('');
  const [createTeamName, setCreateTeamName] = useState('');
  const [createKeyOpen, setCreateKeyOpen] = useState(false);
  const [createKeyNs, setCreateKeyNs] = useState('');
  const [createKeyAgent, setCreateKeyAgent] = useState('');
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  // Integrations state
  const [integrations, setIntegrations] = useState<
    Array<Record<string, unknown>>
  >([]);
  const [intLoading, setIntLoading] = useState(false);
  const [createIntOpen, setCreateIntOpen] = useState(false);
  const [intFormNs, setIntFormNs] = useState('');
  const [intFormName, setIntFormName] = useState('');
  const [intFormType, setIntFormType] = useState('');
  const [intFormConfig, setIntFormConfig] = useState('{}');

  // Sandbox trigger state
  const [triggerNs, setTriggerNs] = useState('');
  const [triggerAgent, setTriggerAgent] = useState('');
  const [triggerMessage, setTriggerMessage] = useState('');
  const [triggerType, setTriggerType] = useState<'cron' | 'webhook' | 'alert'>(
    'webhook',
  );
  const [triggerResult, setTriggerResult] = useState<Record<
    string,
    unknown
  > | null>(null);

  const devSpacesConfig = useAdminConfig('devSpacesApiUrl');
  const devSpacesTokenConfig = useAdminConfig('devSpacesToken');
  const [devSpacesUrl, setDevSpacesUrl] = useState('');
  const [devSpacesToken, setDevSpacesToken] = useState('');
  const [devSpacesInitialized, setDevSpacesInitialized] = useState(false);
  const [devSpacesToast, setDevSpacesToast] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    if (
      !devSpacesInitialized &&
      !devSpacesConfig.loading &&
      !devSpacesTokenConfig.loading
    ) {
      setDevSpacesUrl(
        (devSpacesConfig.entry?.configValue as string | undefined) ?? '',
      );
      setDevSpacesToken(
        (devSpacesTokenConfig.entry?.configValue as string | undefined) ?? '',
      );
      setDevSpacesInitialized(true);
    }
  }, [
    devSpacesInitialized,
    devSpacesConfig.loading,
    devSpacesConfig.entry,
    devSpacesTokenConfig.loading,
    devSpacesTokenConfig.entry,
  ]);

  const handleSaveDevSpaces = useCallback(async () => {
    const trimmedUrl = devSpacesUrl.trim();
    if (trimmedUrl && !/^https?:\/\/.+/.test(trimmedUrl)) {
      setDevSpacesToast({
        message: 'URL must start with http:// or https://',
        severity: 'error',
      });
      return;
    }
    try {
      await devSpacesConfig.save(trimmedUrl || '');
      await devSpacesTokenConfig.save(devSpacesToken.trim() || '');
      setDevSpacesToast({
        message: 'Dev Spaces configuration saved',
        severity: 'success',
      });
    } catch {
      setDevSpacesToast({
        message:
          devSpacesConfig.error ||
          devSpacesTokenConfig.error ||
          'Failed to save',
        severity: 'error',
      });
    }
  }, [devSpacesUrl, devSpacesToken, devSpacesConfig, devSpacesTokenConfig]);

  const handleResetDevSpaces = useCallback(async () => {
    try {
      await devSpacesConfig.reset();
      await devSpacesTokenConfig.reset();
      setDevSpacesUrl('');
      setDevSpacesToken('');
      setDevSpacesToast({
        message: 'Dev Spaces configuration reset to defaults',
        severity: 'success',
      });
    } catch {
      setDevSpacesToast({
        message:
          devSpacesConfig.error ||
          devSpacesTokenConfig.error ||
          'Failed to reset',
        severity: 'error',
      });
    }
  }, [devSpacesConfig, devSpacesTokenConfig]);

  useEffect(() => {
    setLoading(true);
    api
      .getKagentiDashboards()
      .then(d => setDashboardConfig(d))
      .catch(() => {
        // Dashboard config endpoint may not exist on all Kagenti deployments;
        // silently fall back to empty config instead of alarming the user.
        setDashboardConfig({});
      })
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
      .catch(() => {
        // Build strategies endpoint may not be available; not critical.
        setStrategies([]);
      })
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

  // ---- LLM helpers ----
  const loadLlmData = useCallback(async () => {
    setLlmLoading(true);
    try {
      const [models, teams, keys] = await Promise.allSettled([
        kagentiEndpoints.listLlmModels(kagentiDeps),
        kagentiEndpoints.listLlmTeams(kagentiDeps),
        kagentiEndpoints.listLlmKeys(kagentiDeps),
      ]);
      setLlmModels(models.status === 'fulfilled' ? models.value : null);
      setLlmTeams(
        teams.status === 'fulfilled'
          ? ((teams.value as { teams?: Array<Record<string, unknown>> })
              .teams ?? [])
          : [],
      );
      setLlmKeys(
        keys.status === 'fulfilled'
          ? ((keys.value as { keys?: Array<Record<string, unknown>> }).keys ??
              [])
          : [],
      );
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLlmLoading(false);
    }
  }, [kagentiDeps]);

  const handleCreateTeam = async () => {
    if (!createTeamNs) return;
    setActionBusy('create-team');
    try {
      await kagentiEndpoints.createLlmTeam(kagentiDeps, {
        namespace: createTeamNs,
        name: createTeamName || undefined,
      } as import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiCreateTeamRequest);
      setCreateTeamOpen(false);
      setCreateTeamNs('');
      setCreateTeamName('');
      loadLlmData();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionBusy(null);
    }
  };

  const handleCreateKey = async () => {
    if (!createKeyNs || !createKeyAgent) return;
    setActionBusy('create-key');
    try {
      await kagentiEndpoints.createLlmKey(kagentiDeps, {
        namespace: createKeyNs,
        agentName: createKeyAgent,
      } as import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiCreateKeyRequest);
      setCreateKeyOpen(false);
      setCreateKeyNs('');
      setCreateKeyAgent('');
      loadLlmData();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionBusy(null);
    }
  };

  const handleDeleteKey = async (ns: string, agent: string) => {
    setActionBusy(`del-key:${ns}/${agent}`);
    try {
      await kagentiEndpoints.deleteLlmKey(kagentiDeps, ns, agent);
      loadLlmData();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionBusy(null);
    }
  };

  // ---- Integrations helpers ----
  const loadIntegrations = useCallback(async () => {
    setIntLoading(true);
    try {
      const res = await kagentiEndpoints.listIntegrations(kagentiDeps);
      setIntegrations(
        (res.integrations ?? []) as Array<Record<string, unknown>>,
      );
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIntLoading(false);
    }
  }, [kagentiDeps]);

  const handleCreateIntegration = async () => {
    if (!intFormNs || !intFormName || !intFormType) return;
    setActionBusy('create-int');
    try {
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(intFormConfig);
      } catch {
        /* use empty */
      }
      await kagentiEndpoints.createIntegration(kagentiDeps, {
        namespace: intFormNs,
        name: intFormName,
        type: intFormType,
        config: parsed,
      } as import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiCreateIntegrationRequest);
      setCreateIntOpen(false);
      setIntFormNs('');
      setIntFormName('');
      setIntFormType('');
      setIntFormConfig('{}');
      loadIntegrations();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionBusy(null);
    }
  };

  const handleDeleteIntegration = async (ns: string, name: string) => {
    setActionBusy(`del-int:${ns}/${name}`);
    try {
      await kagentiEndpoints.deleteIntegration(kagentiDeps, ns, name);
      loadIntegrations();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionBusy(null);
    }
  };

  const handleTestIntegration = async (ns: string, name: string) => {
    setActionBusy(`test-int:${ns}/${name}`);
    try {
      await kagentiEndpoints.testIntegration(kagentiDeps, ns, name);
      setError(null);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionBusy(null);
    }
  };

  // ---- Trigger helper ----
  const handleTrigger = async () => {
    if (!triggerNs || !triggerMessage) return;
    setActionBusy('trigger');
    try {
      const result = await kagentiEndpoints.createTrigger(kagentiDeps, {
        type: triggerType,
        namespace: triggerNs,
        agentName: triggerAgent || undefined,
        message: triggerMessage,
      });
      setTriggerResult(result);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionBusy(null);
    }
  };

  useEffect(() => {
    loadLlmData();
    loadIntegrations();
  }, [loadLlmData, loadIntegrations]);

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
    <Box sx={{ ...sectionCardSx(theme), mb: 3 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
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
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: CONTENT_MAX_WIDTH, width: '100%', minWidth: 0 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={PAGE_TITLE_SX}>
          Administration
        </Typography>
        <Typography variant="body2" sx={PAGE_SUBTITLE_SX}>
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
                        sx={{ height: 24 }}
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
                          sx={{ height: 24 }}
                        />
                      </TableCell>
                      <TableCell>
                        {ma.has_deployment ? (
                          <Chip
                            label="Yes"
                            size="small"
                            color="success"
                            sx={{ height: 24 }}
                          />
                        ) : (
                          <Chip
                            label="No"
                            size="small"
                            color="default"
                            sx={{ height: 24 }}
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
        'Dev Spaces',
        'Configure the Dev Spaces API endpoint used to provision cloud IDE workspaces for agent development.',
        undefined,
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Dev Spaces API URL"
            placeholder="https://devspaces-api.example.com"
            value={devSpacesUrl}
            onChange={e => setDevSpacesUrl(e.target.value)}
            size="small"
            fullWidth
            helperText={
              devSpacesConfig.source === 'database'
                ? 'Configured via admin settings'
                : 'Not configured — the Dev Spaces integration will be unavailable until a URL is set.'
            }
            disabled={devSpacesConfig.saving}
          />
          <TextField
            label="OpenShift Token"
            placeholder="sha256~..."
            value={devSpacesToken}
            onChange={e => setDevSpacesToken(e.target.value)}
            size="small"
            fullWidth
            type="password"
            helperText={
              devSpacesToken.trim()
                ? 'An OpenShift bearer token will be used to authenticate with the Kubernetes API when creating workspaces.'
                : 'Optional — if not set, the platform Keycloak token is used. Set this if the cluster does not use Keycloak as an identity provider.'
            }
            disabled={devSpacesTokenConfig.saving}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              onClick={handleSaveDevSpaces}
              disabled={
                devSpacesConfig.saving ||
                devSpacesTokenConfig.saving ||
                !devSpacesUrl.trim()
              }
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {devSpacesConfig.saving || devSpacesTokenConfig.saving ? (
                <CircularProgress size={16} sx={{ mr: 0.5 }} />
              ) : null}
              Save
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={handleResetDevSpaces}
              disabled={
                devSpacesConfig.saving ||
                devSpacesTokenConfig.saving ||
                (devSpacesConfig.source !== 'database' &&
                  devSpacesTokenConfig.source !== 'database')
              }
              sx={{ textTransform: 'none' }}
            >
              Reset to Default
            </Button>
          </Box>
        </Box>,
      )}

      {sectionShell(
        'LLM Models',
        'Available LLM models from the Kagenti platform.',
        <Tooltip title="Refresh">
          <IconButton size="small" onClick={loadLlmData} disabled={llmLoading}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>,
        // eslint-disable-next-line no-nested-ternary
        llmLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={22} />
          </Box>
        ) : llmModels ? (
          <Box
            component="pre"
            sx={{
              p: 1.5,
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
              bgcolor: alpha(theme.palette.background.default, 0.5),
              fontSize: '0.75rem',
              overflow: 'auto',
              maxHeight: 300,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {JSON.stringify(llmModels, null, 2)}
          </Box>
        ) : (
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.disabled }}
          >
            No model data available.
          </Typography>
        ),
      )}

      {sectionShell(
        'LLM Teams',
        `${llmTeams.length} team${llmTeams.length !== 1 ? 's' : ''}`,
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setCreateTeamOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Create Team
          </Button>
          <Tooltip title="Refresh">
            <IconButton
              size="small"
              onClick={loadLlmData}
              disabled={llmLoading}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>,
        loadingOrContent(
          llmLoading,
          llmTeams.length === 0,
          'No LLM teams configured.',
          <TableContainer
            sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Namespace</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {llmTeams.map((t, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {String(t.namespace ?? '—')}
                      </Typography>
                    </TableCell>
                    <TableCell>{String(t.name ?? '—')}</TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary' }}
                      >
                        {JSON.stringify(t).substring(0, 100)}
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
        'LLM API Keys',
        `${llmKeys.length} key${llmKeys.length !== 1 ? 's' : ''}`,
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setCreateKeyOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Create Key
          </Button>
          <Tooltip title="Refresh">
            <IconButton
              size="small"
              onClick={loadLlmData}
              disabled={llmLoading}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>,
        loadingOrContent(
          llmLoading,
          llmKeys.length === 0,
          'No API keys configured.',
          <TableContainer
            sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Namespace</TableCell>
                  <TableCell>Agent</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {llmKeys.map((k, i) => {
                  const ns = String(k.namespace ?? '—');
                  const agent = String(k.agentName ?? k.agent_name ?? '—');
                  return (
                    <TableRow key={i}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {ns}
                        </Typography>
                      </TableCell>
                      <TableCell>{agent}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Delete key">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteKey(ns, agent)}
                            disabled={actionBusy === `del-key:${ns}/${agent}`}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
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
        'Integrations',
        `${integrations.length} integration${integrations.length !== 1 ? 's' : ''}`,
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setCreateIntOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Create
          </Button>
          <Tooltip title="Refresh">
            <IconButton
              size="small"
              onClick={loadIntegrations}
              disabled={intLoading}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>,
        // eslint-disable-next-line no-nested-ternary
        intLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={22} />
          </Box>
        ) : integrations.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.disabled }}
          >
            No integrations configured.
          </Typography>
        ) : (
          <TableContainer
            sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Namespace</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {integrations.map((int, i) => {
                  const ns = String(int.namespace ?? '—');
                  const name = String(int.name ?? '—');
                  return (
                    <TableRow key={i}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {ns}
                        </Typography>
                      </TableCell>
                      <TableCell>{name}</TableCell>
                      <TableCell>
                        <Chip label={String(int.type ?? '—')} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          onClick={() => handleTestIntegration(ns, name)}
                          disabled={actionBusy === `test-int:${ns}/${name}`}
                          sx={{ textTransform: 'none' }}
                        >
                          {actionBusy === `test-int:${ns}/${name}` ? (
                            <CircularProgress size={14} />
                          ) : (
                            'Test'
                          )}
                        </Button>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteIntegration(ns, name)}
                            disabled={actionBusy === `del-int:${ns}/${name}`}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ),
      )}

      {sectionShell(
        'Sandbox Trigger',
        'Manually trigger a sandbox session for an agent.',
        undefined,
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Namespace"
              size="small"
              value={triggerNs}
              onChange={e => setTriggerNs(e.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Agent Name (optional)"
              size="small"
              value={triggerAgent}
              onChange={e => setTriggerAgent(e.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Type"
              size="small"
              select
              value={triggerType}
              onChange={e =>
                setTriggerType(e.target.value as 'cron' | 'webhook' | 'alert')
              }
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="webhook">webhook</MenuItem>
              <MenuItem value="cron">cron</MenuItem>
              <MenuItem value="alert">alert</MenuItem>
            </TextField>
          </Box>
          <TextField
            label="Message"
            size="small"
            fullWidth
            multiline
            rows={2}
            value={triggerMessage}
            onChange={e => setTriggerMessage(e.target.value)}
          />
          <Button
            size="small"
            variant="contained"
            onClick={handleTrigger}
            disabled={!triggerNs || !triggerMessage || actionBusy === 'trigger'}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              alignSelf: 'flex-start',
            }}
          >
            {actionBusy === 'trigger' ? (
              <CircularProgress size={16} sx={{ mr: 0.5 }} />
            ) : null}
            Trigger
          </Button>
          {triggerResult && (
            <Box
              component="pre"
              sx={{
                p: 1.5,
                borderRadius: 1,
                border: 1,
                borderColor: 'divider',
                bgcolor: alpha(theme.palette.background.default, 0.5),
                fontSize: '0.75rem',
                overflow: 'auto',
                maxHeight: 200,
                whiteSpace: 'pre-wrap',
              }}
            >
              {JSON.stringify(triggerResult, null, 2)}
            </Box>
          )}
        </Box>,
      )}

      {/* Create Team Dialog */}
      <Dialog
        open={createTeamOpen}
        onClose={() => setCreateTeamOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Create LLM Team</DialogTitle>
        <DialogContent>
          <TextField
            label="Namespace"
            fullWidth
            size="small"
            value={createTeamNs}
            onChange={e => setCreateTeamNs(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            label="Team Name (optional)"
            fullWidth
            size="small"
            value={createTeamName}
            onChange={e => setCreateTeamName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCreateTeamOpen(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateTeam}
            disabled={!createTeamNs || actionBusy === 'create-team'}
            sx={{ textTransform: 'none' }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Key Dialog */}
      <Dialog
        open={createKeyOpen}
        onClose={() => setCreateKeyOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Create LLM API Key</DialogTitle>
        <DialogContent>
          <TextField
            label="Namespace"
            fullWidth
            size="small"
            value={createKeyNs}
            onChange={e => setCreateKeyNs(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            label="Agent Name"
            fullWidth
            size="small"
            value={createKeyAgent}
            onChange={e => setCreateKeyAgent(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCreateKeyOpen(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateKey}
            disabled={
              !createKeyNs || !createKeyAgent || actionBusy === 'create-key'
            }
            sx={{ textTransform: 'none' }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Integration Dialog */}
      <Dialog
        open={createIntOpen}
        onClose={() => setCreateIntOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Create Integration</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 2 }}>
            <TextField
              label="Namespace"
              size="small"
              value={intFormNs}
              onChange={e => setIntFormNs(e.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Name"
              size="small"
              value={intFormName}
              onChange={e => setIntFormName(e.target.value)}
              sx={{ flex: 1 }}
            />
          </Box>
          <TextField
            label="Type"
            fullWidth
            size="small"
            value={intFormType}
            onChange={e => setIntFormType(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Config (JSON)"
            fullWidth
            size="small"
            multiline
            rows={4}
            value={intFormConfig}
            onChange={e => setIntFormConfig(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCreateIntOpen(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateIntegration}
            disabled={
              !intFormNs ||
              !intFormName ||
              !intFormType ||
              actionBusy === 'create-int'
            }
            sx={{ textTransform: 'none' }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!devSpacesToast}
        autoHideDuration={4000}
        onClose={() => setDevSpacesToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {devSpacesToast ? (
          <Alert
            severity={devSpacesToast.severity}
            onClose={() => setDevSpacesToast(null)}
            variant="filled"
          >
            {devSpacesToast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
