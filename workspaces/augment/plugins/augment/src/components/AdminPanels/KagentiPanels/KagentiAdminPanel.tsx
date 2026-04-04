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
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import ScienceIcon from '@mui/icons-material/Science';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTheme, alpha } from '@mui/material/styles';
import type {
  KagentiCreateIntegrationRequest,
  KagentiCreateKeyRequest,
  KagentiCreateTeamRequest,
  KagentiIntegration,
  KagentiLlmKey,
  KagentiLlmTeam,
  KagentiTriggerRequest,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { augmentApiRef } from '../../../api';
import * as kagentiEndpoints from '../../../api/kagentiEndpoints';
import { getErrorMessage } from '../../../utils';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { SELECT_MENU_PROPS } from '../shared/selectMenuProps';

export interface KagentiAdminPanelProps {
  namespace?: string;
}

type KagentiFetchJson = (path: string, init?: RequestInit) => Promise<unknown>;

export function KagentiAdminPanel({ namespace: namespaceProp }: KagentiAdminPanelProps) {
  const theme = useTheme();
  const api = useApi(augmentApiRef);
  const kagentiDeps = useMemo(
    () => ({
      fetchJson: (api as unknown as { fetchJson: KagentiFetchJson }).fetchJson.bind(
        api,
      ),
    }),
    [api],
  );

  const [flags, setFlags] = useState<{
    sandbox: boolean;
    integrations: boolean;
    triggers: boolean;
  } | null>(null);
  const [flagsError, setFlagsError] = useState<string | null>(null);
  const [busyOps, setBusyOps] = useState<Set<string>>(new Set());
  const addBusy = useCallback((op: string) => setBusyOps(prev => new Set(prev).add(op)), []);
  const removeBusy = useCallback((op: string) => setBusyOps(prev => {
    const next = new Set(prev);
    next.delete(op);
    return next;
  }), []);
  const isBusy = useCallback((op: string) => busyOps.has(op), [busyOps]);
  const [error, setError] = useState<string | null>(null);

  const [modelsJson, setModelsJson] = useState('');
  const [teams, setTeams] = useState<KagentiLlmTeam[]>([]);
  const [keys, setKeys] = useState<KagentiLlmKey[]>([]);
  const [integrations, setIntegrations] = useState<KagentiIntegration[]>([]);
  const [intFilter, setIntFilter] = useState(namespaceProp ?? '');

  const [teamNs, setTeamNs] = useState('');
  const [teamOpen, setTeamOpen] = useState(false);

  const [keyNs, setKeyNs] = useState('');
  const [keyAgent, setKeyAgent] = useState('');
  const [keyOpen, setKeyOpen] = useState(false);

  const [intName, setIntName] = useState('');
  const [intNs, setIntNs] = useState('');
  const [intOpen, setIntOpen] = useState(false);
  const [deleteInt, setDeleteInt] = useState<KagentiIntegration | null>(null);
  const [deleteKey, setDeleteKey] = useState<KagentiLlmKey | null>(null);

  const [triggerType, setTriggerType] =
    useState<KagentiTriggerRequest['type']>('cron');
  const [triggerNs, setTriggerNs] = useState('');
  const [triggerSkill, setTriggerSkill] = useState('');
  const [triggerSchedule, setTriggerSchedule] = useState('');
  const [triggerTtl, setTriggerTtl] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    if (namespaceProp !== undefined) setIntFilter(namespaceProp);
  }, [namespaceProp]);

  useEffect(() => {
    api
      .getKagentiFeatureFlags()
      .then(setFlags)
      .catch(e => setFlagsError(getErrorMessage(e)));
  }, [api]);

  const loadModels = useCallback(async () => {
    addBusy('loadModels');
    setError(null);
    try {
      const data = await kagentiEndpoints.listLlmModels(kagentiDeps);
      setModelsJson(JSON.stringify(data, null, 2));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      removeBusy('loadModels');
    }
  }, [addBusy, kagentiDeps, removeBusy]);

  const loadTeams = useCallback(async () => {
    addBusy('loadTeams');
    setError(null);
    try {
      const res = await kagentiEndpoints.listLlmTeams(kagentiDeps);
      setTeams(res.teams ?? []);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      removeBusy('loadTeams');
    }
  }, [addBusy, kagentiDeps, removeBusy]);

  const loadKeys = useCallback(async () => {
    addBusy('loadKeys');
    setError(null);
    try {
      const res = await kagentiEndpoints.listLlmKeys(kagentiDeps);
      setKeys(res.keys ?? []);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      removeBusy('loadKeys');
    }
  }, [addBusy, kagentiDeps, removeBusy]);

  const loadIntegrations = useCallback(async () => {
    addBusy('loadIntegrations');
    setError(null);
    try {
      const res = await kagentiEndpoints.listIntegrations(
        kagentiDeps,
        intFilter || undefined,
      );
      setIntegrations(res.integrations ?? []);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      removeBusy('loadIntegrations');
    }
  }, [addBusy, intFilter, kagentiDeps, removeBusy]);

  useEffect(() => {
    if (!flags) return;
    if (flags.sandbox) {
      loadModels();
      loadTeams();
      loadKeys();
    }
  }, [flags, loadModels, loadTeams, loadKeys]);

  useEffect(() => {
    if (flags?.integrations) loadIntegrations();
  }, [flags?.integrations, intFilter, loadIntegrations]);

  const createTeam = async () => {
    if (!teamNs.trim()) return;
    const body: KagentiCreateTeamRequest = { namespace: teamNs.trim() };
    addBusy('createTeam');
    setError(null);
    try {
      await kagentiEndpoints.createLlmTeam(kagentiDeps, body);
      setTeamOpen(false);
      setTeamNs('');
      loadTeams();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      removeBusy('createTeam');
    }
  };

  const createKey = async () => {
    if (!keyNs.trim() || !keyAgent.trim()) return;
    const body: KagentiCreateKeyRequest = {
      namespace: keyNs.trim(),
      agentName: keyAgent.trim(),
    };
    addBusy('createKey');
    setError(null);
    try {
      await kagentiEndpoints.createLlmKey(kagentiDeps, body);
      setKeyOpen(false);
      setKeyNs('');
      setKeyAgent('');
      loadKeys();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      removeBusy('createKey');
    }
  };

  const removeKey = async () => {
    if (!deleteKey) return;
    const ns = deleteKey.namespace ?? '';
    const agent = deleteKey.agent ?? '';
    if (!ns || !agent) return;
    addBusy('removeKey');
    try {
      await kagentiEndpoints.deleteLlmKey(kagentiDeps, ns, agent);
      setDeleteKey(null);
      loadKeys();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      removeBusy('removeKey');
    }
  };

  const createIntegration = async () => {
    if (!intName.trim() || !intNs.trim()) return;
    const body: KagentiCreateIntegrationRequest = {
      name: intName.trim(),
      namespace: intNs.trim(),
    };
    addBusy('createIntegration');
    setError(null);
    try {
      await kagentiEndpoints.createIntegration(kagentiDeps, body);
      setIntOpen(false);
      setIntName('');
      setIntNs('');
      loadIntegrations();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      removeBusy('createIntegration');
    }
  };

  const removeIntegration = async () => {
    if (!deleteInt) return;
    addBusy('removeIntegration');
    try {
      await kagentiEndpoints.deleteIntegration(
        kagentiDeps,
        deleteInt.namespace,
        deleteInt.name,
      );
      setDeleteInt(null);
      loadIntegrations();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      removeBusy('removeIntegration');
    }
  };

  const testIntegration = async (i: KagentiIntegration) => {
    addBusy('testIntegration');
    setError(null);
    try {
      const res = await kagentiEndpoints.testIntegration(
        kagentiDeps,
        i.namespace,
        i.name,
      );
      setError(null);
      setTestResult(JSON.stringify(res, null, 2));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      removeBusy('testIntegration');
    }
  };

  const submitTrigger = async () => {
    if (!triggerNs.trim()) return;
    const ttlNum = triggerTtl ? Number(triggerTtl) : undefined;
    const body: KagentiTriggerRequest = {
      type: triggerType,
      namespace: triggerNs.trim(),
      skill: triggerSkill || undefined,
      schedule: triggerSchedule || undefined,
      ttl_hours: ttlNum !== undefined && !Number.isNaN(ttlNum) ? ttlNum : undefined,
    };
    addBusy('submitTrigger');
    setError(null);
    try {
      await kagentiEndpoints.createTrigger(kagentiDeps, body);
      setTriggerSkill('');
      setTriggerSchedule('');
      setTriggerTtl('');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      removeBusy('submitTrigger');
    }
  };

  const sectionShell = (title: string, children: ReactNode) => (
    <Card
      variant="outlined"
      sx={{ mb: 2, bgcolor: alpha(theme.palette.background.paper, 0.4) }}
    >
      <CardContent>
        <Typography variant="h6" sx={{ fontSize: '1rem', mb: 1.5 }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );

  if (flagsError) {
    return <Alert severity="error">{flagsError}</Alert>;
  }

  if (!flags) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box>
      {testResult && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          onClose={() => setTestResult(null)}
        >
          <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
            {testResult}
          </Typography>
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {flags.sandbox &&
        sectionShell(
          'LLM models',
          <Box>
            <Button
              size="small"
              startIcon={isBusy('loadModels') ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={loadModels}
              disabled={isBusy('loadModels')}
              sx={{ textTransform: 'none', mb: 1 }}
            >
              Refresh
            </Button>
            <TextField
              fullWidth
              multiline
              minRows={6}
              value={modelsJson}
              InputProps={{ readOnly: true }}
              size="small"
            />
          </Box>,
        )}

      {flags.sandbox &&
        sectionShell(
          'LLM teams',
          <Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Button
                size="small"
                variant="contained"
                onClick={() => setTeamOpen(true)}
                sx={{ textTransform: 'none' }}
              >
                Create team
              </Button>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={loadTeams}
                disabled={isBusy('loadTeams')}
                sx={{ textTransform: 'none' }}
              >
                Refresh
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Team ID</TableCell>
                    <TableCell>Namespace</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teams.length === 0 && !isBusy('loadTeams') ? (
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Typography variant="body2" color="textSecondary">
                          No teams
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    teams.map(t => (
                      <TableRow key={`${t.teamId}-${t.namespace}`}>
                        <TableCell>{t.teamId}</TableCell>
                        <TableCell>{t.namespace}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>,
        )}

      {flags.sandbox &&
        sectionShell(
          'API keys',
          <Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Button
                size="small"
                variant="contained"
                onClick={() => setKeyOpen(true)}
                sx={{ textTransform: 'none' }}
              >
                Create key
              </Button>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={loadKeys}
                disabled={isBusy('loadKeys')}
                sx={{ textTransform: 'none' }}
              >
                Refresh
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Alias</TableCell>
                    <TableCell>Agent</TableCell>
                    <TableCell>Namespace</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {keys.length === 0 && !isBusy('loadKeys') ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography variant="body2" color="textSecondary">
                          No API keys
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    keys.map((k, idx) => (
                      <TableRow key={`${k.namespace}-${k.agent}-${idx}`}>
                        <TableCell>{k.alias ?? '—'}</TableCell>
                        <TableCell>{k.agent ?? '—'}</TableCell>
                        <TableCell>{k.namespace ?? '—'}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Delete key">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                aria-label="Delete key"
                                onClick={() => setDeleteKey(k)}
                                disabled={!k.namespace || !k.agent || isBusy('removeKey')}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>,
        )}

      {flags.integrations &&
        sectionShell(
          'Integrations',
          <Box>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                mb: 1,
                alignItems: 'center',
              }}
            >
              <TextField
                size="small"
                label="Namespace filter"
                value={intFilter}
                onChange={e => setIntFilter(e.target.value)}
              />
              <Button
                size="small"
                variant="contained"
                onClick={() => setIntOpen(true)}
                sx={{ textTransform: 'none' }}
              >
                Create
              </Button>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={loadIntegrations}
                disabled={isBusy('loadIntegrations')}
                sx={{ textTransform: 'none' }}
              >
                Refresh
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Namespace</TableCell>
                    <TableCell>Conditions</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {integrations.length === 0 && !isBusy('loadIntegrations') ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography variant="body2" color="textSecondary">
                          No integrations
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    integrations.map(i => (
                      <TableRow key={`${i.namespace}/${i.name}`}>
                        <TableCell>{i.name}</TableCell>
                        <TableCell>{i.namespace}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(i.conditions ?? []).map((c, cIdx) => (
                              <Chip
                                key={`${c.type}-${cIdx}`}
                                size="small"
                                label={`${c.type}: ${c.status}`}
                              />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Test integration">
                            <IconButton
                              size="small"
                              aria-label="Test integration"
                              onClick={() => testIntegration(i)}
                              disabled={isBusy('testIntegration')}
                            >
                              <ScienceIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete integration">
                            <IconButton
                              size="small"
                              color="error"
                              aria-label="Delete integration"
                              onClick={() => setDeleteInt(i)}
                              disabled={isBusy('removeIntegration')}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
            </Table>
            </TableContainer>
          </Box>,
        )}

      {flags.triggers &&
        sectionShell(
          'Triggers',
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 480 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                label="Type"
                value={triggerType}
                onChange={e =>
                  setTriggerType(e.target.value as KagentiTriggerRequest['type'])
                }
                MenuProps={SELECT_MENU_PROPS}
              >
                <MenuItem value="cron">cron</MenuItem>
                <MenuItem value="webhook">webhook</MenuItem>
                <MenuItem value="alert">alert</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Namespace"
              size="small"
              value={triggerNs}
              onChange={e => setTriggerNs(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Skill"
              size="small"
              value={triggerSkill}
              onChange={e => setTriggerSkill(e.target.value)}
              fullWidth
            />
            <TextField
              label="Schedule"
              size="small"
              value={triggerSchedule}
              onChange={e => setTriggerSchedule(e.target.value)}
              fullWidth
            />
            <TextField
              label="TTL (hours)"
              size="small"
              type="number"
              value={triggerTtl}
              onChange={e => setTriggerTtl(e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              size="small"
              onClick={submitTrigger}
              disabled={isBusy('submitTrigger') || !triggerNs.trim()}
              sx={{ textTransform: 'none', alignSelf: 'flex-start' }}
            >
              Create trigger
            </Button>
          </Box>,
        )}

      <Dialog open={teamOpen} onClose={() => !isBusy('createTeam') && setTeamOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Create team</DialogTitle>
        <DialogContent>
          <TextField
            label="Namespace"
            fullWidth
            size="small"
            value={teamNs}
            onChange={e => setTeamNs(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeamOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={createTeam} sx={{ textTransform: 'none' }}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={keyOpen} onClose={() => !isBusy('createKey') && setKeyOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Create API key</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Namespace"
            size="small"
            value={keyNs}
            onChange={e => setKeyNs(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Agent name"
            size="small"
            value={keyAgent}
            onChange={e => setKeyAgent(e.target.value)}
            fullWidth
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKeyOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={createKey} sx={{ textTransform: 'none' }}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={intOpen} onClose={() => !isBusy('createIntegration') && setIntOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Create integration</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Name"
            size="small"
            value={intName}
            onChange={e => setIntName(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Namespace"
            size="small"
            value={intNs}
            onChange={e => setIntNs(e.target.value)}
            fullWidth
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIntOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={createIntegration} sx={{ textTransform: 'none' }}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteInt}
        title="Delete integration"
        message={
          deleteInt
            ? `Delete ${deleteInt.namespace}/${deleteInt.name}?`
            : ''
        }
        onConfirm={removeIntegration}
        onCancel={() => setDeleteInt(null)}
      />

      <ConfirmDialog
        open={!!deleteKey}
        title="Delete API key"
        message="Delete this API key?"
        onConfirm={removeKey}
        onCancel={() => setDeleteKey(null)}
      />

      {!flags.sandbox && !flags.integrations && !flags.triggers && (
        <Alert severity="info">No Kagenti admin features are enabled.</Alert>
      )}
    </Box>
  );
}
