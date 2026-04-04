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
  useId,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import { useApi } from '@backstage/core-plugin-api';
import type {
  KagentiCreateToolRequest,
  KagentiEnvVar,
  KagentiServicePort,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { augmentApiRef } from '../../../api';
import { getErrorMessage } from '../../../utils';

const STEPS = ['Basics', 'Deployment', 'Runtime'] as const;

type DeploymentMethod = 'image' | 'source';
type WorkloadType = 'deployment' | 'statefulset';
type PortProtocol = 'TCP' | 'UDP';

interface EnvRow {
  id: number;
  name: string;
  value: string;
}

interface ServicePortRow {
  id: number;
  name: string;
  port: string;
  targetPort: string;
  protocol: PortProtocol;
}

export interface CreateToolWizardProps {
  open: boolean;
  namespace?: string;
  onClose: () => void;
  onCreated: () => void;
}

function nextRowId(ref: MutableRefObject<number>): number {
  ref.current += 1;
  return ref.current;
}

function buildEnvVars(rows: EnvRow[]): KagentiEnvVar[] | undefined {
  const list = rows
    .filter(r => r.name.trim())
    .map(r => {
      const ev: KagentiEnvVar = { name: r.name.trim() };
      if (r.value.trim()) {
        ev.value = r.value.trim();
      }
      return ev;
    });
  return list.length ? list : undefined;
}

function parsePositivePort(s: string): number | undefined {
  const n = Number(s);
  if (!Number.isFinite(n)) return undefined;
  const p = Math.floor(n);
  if (p < 1 || p > 65535) return undefined;
  return p;
}

function buildServicePorts(rows: ServicePortRow[]): KagentiServicePort[] | undefined {
  const list = rows
    .map(r => {
      const port = parsePositivePort(r.port);
      if (port === undefined) return null;
      const sp: KagentiServicePort = {
        port,
        protocol: r.protocol,
      };
      if (r.name.trim()) {
        sp.name = r.name.trim();
      }
      const tp = parsePositivePort(r.targetPort);
      if (tp !== undefined) {
        sp.targetPort = tp;
      }
      return sp;
    })
    .filter((x): x is KagentiServicePort => x !== null);
  return list.length ? list : undefined;
}

function buildRequest(state: {
  name: string;
  namespace: string;
  description: string;
  protocol: string;
  framework: string;
  deploymentMethod: DeploymentMethod;
  containerImage: string;
  imagePullSecret: string;
  gitUrl: string;
  gitRevision: string;
  contextDir: string;
  registryUrl: string;
  registrySecret: string;
  imageTag: string;
  workloadType: WorkloadType;
  envRows: EnvRow[];
  portRows: ServicePortRow[];
  createHttpRoute: boolean;
  authBridgeEnabled: boolean;
  spireEnabled: boolean;
}): KagentiCreateToolRequest {
  const body: KagentiCreateToolRequest = {
    name: state.name.trim(),
    namespace: state.namespace.trim(),
    deploymentMethod: state.deploymentMethod,
    workloadType: state.workloadType,
    createHttpRoute: state.createHttpRoute,
    authBridgeEnabled: state.authBridgeEnabled,
    spireEnabled: state.spireEnabled,
  };

  if (state.description.trim()) {
    body.description = state.description.trim();
  }
  if (state.protocol.trim()) {
    body.protocol = state.protocol.trim();
  }
  if (state.framework.trim()) {
    body.framework = state.framework.trim();
  }

  if (state.deploymentMethod === 'image') {
    body.containerImage = state.containerImage.trim();
    if (state.imagePullSecret.trim()) {
      body.imagePullSecret = state.imagePullSecret.trim();
    }
  } else {
    body.gitUrl = state.gitUrl.trim();
    if (state.gitRevision.trim()) {
      body.gitRevision = state.gitRevision.trim();
    }
    if (state.contextDir.trim()) {
      body.contextDir = state.contextDir.trim();
    }
    if (state.registryUrl.trim()) {
      body.registryUrl = state.registryUrl.trim();
    }
    if (state.registrySecret.trim()) {
      body.registrySecret = state.registrySecret.trim();
    }
    if (state.imageTag.trim()) {
      body.imageTag = state.imageTag.trim();
    }
  }

  const envVars = buildEnvVars(state.envRows);
  if (envVars) {
    body.envVars = envVars;
  }
  const servicePorts = buildServicePorts(state.portRows);
  if (servicePorts) {
    body.servicePorts = servicePorts;
  }

  return body;
}

export function CreateToolWizard({
  open,
  namespace: namespaceProp,
  onClose,
  onCreated,
}: CreateToolWizardProps) {
  const api = useApi(augmentApiRef);
  const titleId = useId();
  const rowIdRef = useRef(0);
  const wasOpenRef = useRef(false);

  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [namespace, setNamespace] = useState(namespaceProp ?? '');
  const [description, setDescription] = useState('');
  const [protocol, setProtocol] = useState('');
  const [framework, setFramework] = useState('');

  const [deploymentMethod, setDeploymentMethod] =
    useState<DeploymentMethod>('image');
  const [containerImage, setContainerImage] = useState('');
  const [imagePullSecret, setImagePullSecret] = useState('');
  const [gitUrl, setGitUrl] = useState('');
  const [gitRevision, setGitRevision] = useState('main');
  const [contextDir, setContextDir] = useState('.');
  const [registryUrl, setRegistryUrl] = useState('');
  const [registrySecret, setRegistrySecret] = useState('');
  const [imageTag, setImageTag] = useState('');

  const [workloadType, setWorkloadType] = useState<WorkloadType>('deployment');
  const [envRows, setEnvRows] = useState<EnvRow[]>([]);
  const [portRows, setPortRows] = useState<ServicePortRow[]>([]);
  const [createHttpRoute, setCreateHttpRoute] = useState(false);
  const [authBridgeEnabled, setAuthBridgeEnabled] = useState(false);
  const [spireEnabled, setSpireEnabled] = useState(false);

  const resetForm = useCallback(() => {
    rowIdRef.current = 0;
    setActiveStep(0);
    setSubmitError(null);
    setName('');
    setNamespace(namespaceProp ?? '');
    setDescription('');
    setProtocol('');
    setFramework('');
    setDeploymentMethod('image');
    setContainerImage('');
    setImagePullSecret('');
    setGitUrl('');
    setGitRevision('main');
    setContextDir('.');
    setRegistryUrl('');
    setRegistrySecret('');
    setImageTag('');
    setWorkloadType('deployment');
    setEnvRows([]);
    setPortRows([]);
    setCreateHttpRoute(false);
    setAuthBridgeEnabled(false);
    setSpireEnabled(false);
  }, [namespaceProp]);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      resetForm();
    }
    wasOpenRef.current = open;
  }, [open, resetForm]);

  useEffect(() => {
    setNamespace(n => namespaceProp ?? n);
  }, [namespaceProp]);

  const formState = useMemo(
    () => ({
      name,
      namespace,
      description,
      protocol,
      framework,
      deploymentMethod,
      containerImage,
      imagePullSecret,
      gitUrl,
      gitRevision,
      contextDir,
      registryUrl,
      registrySecret,
      imageTag,
      workloadType,
      envRows,
      portRows,
      createHttpRoute,
      authBridgeEnabled,
      spireEnabled,
    }),
    [
      name,
      namespace,
      description,
      protocol,
      framework,
      deploymentMethod,
      containerImage,
      imagePullSecret,
      gitUrl,
      gitRevision,
      contextDir,
      registryUrl,
      registrySecret,
      imageTag,
      workloadType,
      envRows,
      portRows,
      createHttpRoute,
      authBridgeEnabled,
      spireEnabled,
    ],
  );

  const validateStep0 = useCallback((): boolean => {
    return Boolean(name.trim() && namespace.trim());
  }, [name, namespace]);

  const validateStep1 = useCallback((): boolean => {
    if (deploymentMethod === 'image') {
      return Boolean(containerImage.trim());
    }
    return Boolean(gitUrl.trim());
  }, [deploymentMethod, containerImage, gitUrl]);

  const handleNext = useCallback(() => {
    setSubmitError(null);
    if (activeStep === 0 && !validateStep0()) {
      setSubmitError('Name and namespace are required.');
      return;
    }
    if (activeStep === 1 && !validateStep1()) {
      setSubmitError(
        deploymentMethod === 'image'
          ? 'Container image is required.'
          : 'Git URL is required for source deployment.',
      );
      return;
    }
    setActiveStep(s => Math.min(s + 1, STEPS.length - 1));
  }, [activeStep, validateStep0, validateStep1, deploymentMethod]);

  const handleBack = useCallback(() => {
    setSubmitError(null);
    setActiveStep(s => Math.max(s - 1, 0));
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitError(null);
    if (!validateStep0()) {
      setSubmitError('Name and namespace are required.');
      setActiveStep(0);
      return;
    }
    if (!validateStep1()) {
      setSubmitError(
        deploymentMethod === 'image'
          ? 'Container image is required.'
          : 'Git URL is required for source deployment.',
      );
      setActiveStep(1);
      return;
    }

    const body = buildRequest(formState);
    setSubmitting(true);
    try {
      await api.createKagentiTool(body);
      onCreated();
      onClose();
    } catch (e) {
      setSubmitError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }, [
    api,
    formState,
    onClose,
    onCreated,
    validateStep0,
    validateStep1,
    deploymentMethod,
  ]);

  const handleDialogClose = useCallback(
    (_: object, reason: 'backdropClick' | 'escapeKeyDown') => {
      if (submitting) return;
      if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
        onClose();
      }
    },
    [onClose, submitting],
  );

  const addEnvRow = useCallback(() => {
    setEnvRows(rows => [
      ...rows,
      { id: nextRowId(rowIdRef), name: '', value: '' },
    ]);
  }, []);

  const updateEnvRow = useCallback((id: number, patch: Partial<EnvRow>) => {
    setEnvRows(rows =>
      rows.map(r => (r.id === id ? { ...r, ...patch } : r)),
    );
  }, []);

  const removeEnvRow = useCallback((id: number) => {
    setEnvRows(rows => rows.filter(r => r.id !== id));
  }, []);

  const addPortRow = useCallback(() => {
    setPortRows(rows => [
      ...rows,
      {
        id: nextRowId(rowIdRef),
        name: '',
        port: '',
        targetPort: '',
        protocol: 'TCP',
      },
    ]);
  }, []);

  const updatePortRow = useCallback(
    (id: number, patch: Partial<ServicePortRow>) => {
      setPortRows(rows =>
        rows.map(r => (r.id === id ? { ...r, ...patch } : r)),
      );
    },
    [],
  );

  const removePortRow = useCallback((id: number) => {
    setPortRows(rows => rows.filter(r => r.id !== id));
  }, []);

  const handlePortProtocol = useCallback(
    (id: number, e: SelectChangeEvent<PortProtocol>) => {
      updatePortRow(id, { protocol: e.target.value as PortProtocol });
    },
    [updatePortRow],
  );

  const deploymentMethodChange = useCallback(
    (_: React.ChangeEvent<HTMLInputElement>, v: string) => {
      setDeploymentMethod(v as DeploymentMethod);
    },
    [],
  );

  const workloadTypeChange = useCallback(
    (_: React.ChangeEvent<HTMLInputElement>, v: string) => {
      setWorkloadType(v as WorkloadType);
    },
    [],
  );

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth="md"
      fullWidth
      aria-labelledby={titleId}
    >
      <DialogTitle id={titleId}>Create Kagenti tool</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 3, mt: 1 }}>
          {STEPS.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        {activeStep === 0 && (
          <Stack spacing={2}>
            <TextField
              label="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              fullWidth
              required
              size="small"
            />
            <TextField
              label="Namespace"
              value={namespace}
              onChange={e => setNamespace(e.target.value)}
              fullWidth
              required
              size="small"
            />
            <TextField
              label="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              fullWidth
              multiline
              minRows={3}
              size="small"
            />
            <TextField
              label="Protocol"
              value={protocol}
              onChange={e => setProtocol(e.target.value)}
              fullWidth
              size="small"
              placeholder="e.g. mcp, http, grpc"
            />
            <TextField
              label="Framework"
              value={framework}
              onChange={e => setFramework(e.target.value)}
              fullWidth
              size="small"
              placeholder="e.g. python, nodejs"
            />
          </Stack>
        )}

        {activeStep === 1 && (
          <Stack spacing={2}>
            <FormControl>
              <FormLabel id="deployment-method-label">Deployment method</FormLabel>
              <RadioGroup
                aria-labelledby="deployment-method-label"
                value={deploymentMethod}
                onChange={deploymentMethodChange}
              >
                <FormControlLabel
                  value="image"
                  control={<Radio size="small" />}
                  label="Container Image"
                />
                <FormControlLabel
                  value="source"
                  control={<Radio size="small" />}
                  label="Source Code"
                />
              </RadioGroup>
            </FormControl>

            {deploymentMethod === 'image' ? (
              <Stack spacing={2}>
                <TextField
                  label="Container image"
                  value={containerImage}
                  onChange={e => setContainerImage(e.target.value)}
                  fullWidth
                  required
                  size="small"
                />
                <TextField
                  label="Image pull secret"
                  value={imagePullSecret}
                  onChange={e => setImagePullSecret(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Stack>
            ) : (
              <Stack spacing={2}>
                <TextField
                  label="Git URL"
                  value={gitUrl}
                  onChange={e => setGitUrl(e.target.value)}
                  fullWidth
                  required
                  size="small"
                />
                <TextField
                  label="Git revision"
                  value={gitRevision}
                  onChange={e => setGitRevision(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="main"
                />
                <TextField
                  label="Context directory"
                  value={contextDir}
                  onChange={e => setContextDir(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="."
                />
                <TextField
                  label="Registry URL"
                  value={registryUrl}
                  onChange={e => setRegistryUrl(e.target.value)}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Registry secret"
                  value={registrySecret}
                  onChange={e => setRegistrySecret(e.target.value)}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Image tag"
                  value={imageTag}
                  onChange={e => setImageTag(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Stack>
            )}
          </Stack>
        )}

        {activeStep === 2 && (
          <Stack spacing={3}>
            <FormControl>
              <FormLabel id="workload-type-label">Workload type</FormLabel>
              <RadioGroup
                aria-labelledby="workload-type-label"
                value={workloadType}
                onChange={workloadTypeChange}
                row
              >
                <FormControlLabel
                  value="deployment"
                  control={<Radio size="small" />}
                  label="Deployment"
                />
                <FormControlLabel
                  value="statefulset"
                  control={<Radio size="small" />}
                  label="StatefulSet"
                />
              </RadioGroup>
            </FormControl>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Environment variables
              </Typography>
              <Stack spacing={1.5}>
                {envRows.map(row => (
                  <Stack
                    key={row.id}
                    direction="row"
                    spacing={1}
                    alignItems="flex-start"
                  >
                    <TextField
                      label="Name"
                      value={row.name}
                      onChange={e =>
                        updateEnvRow(row.id, { name: e.target.value })
                      }
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="Value"
                      value={row.value}
                      onChange={e =>
                        updateEnvRow(row.id, { value: e.target.value })
                      }
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <IconButton
                      aria-label="Remove variable"
                      onClick={() => removeEnvRow(row.id)}
                      size="small"
                      sx={{ mt: 0.5 }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={addEnvRow}
                  size="small"
                  sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                >
                  Add variable
                </Button>
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Service ports
              </Typography>
              <Stack spacing={1.5}>
                {portRows.map(row => (
                  <Stack
                    key={row.id}
                    direction="row"
                    spacing={1}
                    alignItems="flex-start"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <TextField
                      label="Name"
                      value={row.name}
                      onChange={e =>
                        updatePortRow(row.id, { name: e.target.value })
                      }
                      size="small"
                      sx={{ minWidth: 120, flex: '1 1 100px' }}
                    />
                    <TextField
                      label="Port"
                      value={row.port}
                      onChange={e =>
                        updatePortRow(row.id, { port: e.target.value })
                      }
                      size="small"
                      type="number"
                      inputProps={{ min: 1, max: 65535 }}
                      sx={{ width: 100 }}
                    />
                    <TextField
                      label="Target port"
                      value={row.targetPort}
                      onChange={e =>
                        updatePortRow(row.id, { targetPort: e.target.value })
                      }
                      size="small"
                      type="number"
                      inputProps={{ min: 1, max: 65535 }}
                      sx={{ width: 120 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <InputLabel id={`proto-${row.id}`}>Protocol</InputLabel>
                      <Select<PortProtocol>
                        labelId={`proto-${row.id}`}
                        label="Protocol"
                        value={row.protocol}
                        onChange={e => handlePortProtocol(row.id, e)}
                      >
                        <MenuItem value="TCP">TCP</MenuItem>
                        <MenuItem value="UDP">UDP</MenuItem>
                      </Select>
                    </FormControl>
                    <IconButton
                      aria-label="Remove port"
                      onClick={() => removePortRow(row.id)}
                      size="small"
                      sx={{ mt: 0.5 }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={addPortRow}
                  size="small"
                  sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                >
                  Add port
                </Button>
              </Stack>
            </Box>

            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={createHttpRoute}
                    onChange={e => setCreateHttpRoute(e.target.checked)}
                    size="small"
                  />
                }
                label="Create HTTP route"
              />
              <Tooltip
                title="Enables identity propagation between services. When enabled, the calling user's identity is forwarded to the tool via Kagenti's auth bridge, allowing the tool to make authenticated calls on behalf of the user."
                placement="right"
                arrow
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={authBridgeEnabled}
                      onChange={e => setAuthBridgeEnabled(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Auth bridge enabled"
                />
              </Tooltip>
              <Tooltip
                title="Enables SPIRE-based workload identity (mTLS). When enabled, the tool receives a SPIFFE identity and communicates with other services using mutual TLS, providing cryptographic proof of workload identity."
                placement="right"
                arrow
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={spireEnabled}
                      onChange={e => setSpireEnabled(e.target.checked)}
                      size="small"
                    />
                  }
                  label="SPIRE enabled"
                />
              </Tooltip>
            </Stack>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Button
          onClick={onClose}
          disabled={submitting}
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {activeStep > 0 && (
            <Button
              onClick={handleBack}
              disabled={submitting}
              sx={{ textTransform: 'none' }}
            >
              Back
            </Button>
          )}
          {activeStep < STEPS.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={submitting}
              sx={{ textTransform: 'none' }}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              startIcon={
                submitting ? (
                  <CircularProgress size={18} color="inherit" />
                ) : undefined
              }
              sx={{ textTransform: 'none' }}
            >
              {submitting ? 'Creating…' : 'Create'}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
