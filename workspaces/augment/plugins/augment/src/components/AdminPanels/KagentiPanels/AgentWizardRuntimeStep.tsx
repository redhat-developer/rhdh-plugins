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

import type { FC } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type {
  EnvRow,
  EnvSource,
  PortProtocol,
  ServicePortRow,
  WorkloadType,
} from './agentWizardTypes';

interface AgentWizardRuntimeStepProps {
  workloadType: WorkloadType;
  setWorkloadType: (v: WorkloadType) => void;
  envRows: EnvRow[];
  addEnvRow: () => void;
  updateEnvRow: (id: number, patch: Partial<EnvRow>) => void;
  removeEnvRow: (id: number) => void;
  duplicateEnvNames: Set<string>;
  portRows: ServicePortRow[];
  addPortRow: () => void;
  updatePortRow: (id: number, patch: Partial<ServicePortRow>) => void;
  removePortRow: (id: number) => void;
  handlePortProtocol: (id: number, e: SelectChangeEvent<PortProtocol>) => void;
  portErrors: Map<number, string>;
  createHttpRoute: boolean;
  setCreateHttpRoute: (v: boolean) => void;
  authBridgeEnabled: boolean;
  setAuthBridgeEnabled: (v: boolean) => void;
  spireEnabled: boolean;
  setSpireEnabled: (v: boolean) => void;
}

export const AgentWizardRuntimeStep: FC<AgentWizardRuntimeStepProps> = ({
  workloadType,
  setWorkloadType,
  envRows,
  addEnvRow,
  updateEnvRow,
  removeEnvRow,
  duplicateEnvNames,
  portRows,
  addPortRow,
  updatePortRow,
  removePortRow,
  handlePortProtocol,
  portErrors,
  createHttpRoute,
  setCreateHttpRoute,
  authBridgeEnabled,
  setAuthBridgeEnabled,
  spireEnabled,
  setSpireEnabled,
}) => (
  <Stack spacing={3}>
    <FormControl>
      <FormLabel id="agent-workload-type">Workload type</FormLabel>
      <RadioGroup
        aria-labelledby="agent-workload-type"
        value={workloadType}
        onChange={(_, v) => setWorkloadType(v as WorkloadType)}
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
        <FormControlLabel
          value="job"
          control={<Radio size="small" />}
          label="Job"
        />
      </RadioGroup>
    </FormControl>

    {/* Environment variables */}
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Environment variables
      </Typography>
      {duplicateEnvNames.size > 0 && (
        <Alert severity="warning" variant="outlined" sx={{ mb: 1, py: 0.25 }}>
          Duplicate variable names: {Array.from(duplicateEnvNames).join(', ')}
        </Alert>
      )}
      <Stack spacing={1.5}>
        {envRows.map(row => (
          <Box key={row.id}>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <TextField
                label="Name"
                value={row.name}
                onChange={e => updateEnvRow(row.id, { name: e.target.value })}
                size="small"
                sx={{ flex: 1 }}
                error={duplicateEnvNames.has(row.name.trim().toLowerCase())}
              />
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Source</InputLabel>
                <Select
                  label="Source"
                  value={row.source}
                  onChange={e =>
                    updateEnvRow(row.id, {
                      source: e.target.value as EnvSource,
                    })
                  }
                >
                  <MenuItem value="direct">Direct value</MenuItem>
                  <MenuItem value="secret">Secret ref</MenuItem>
                  <MenuItem value="configMap">ConfigMap ref</MenuItem>
                </Select>
              </FormControl>
              {row.source === 'direct' ? (
                <TextField
                  label="Value"
                  value={row.value}
                  onChange={e =>
                    updateEnvRow(row.id, { value: e.target.value })
                  }
                  size="small"
                  sx={{ flex: 1 }}
                />
              ) : (
                <>
                  <TextField
                    label={
                      row.source === 'secret' ? 'Secret name' : 'ConfigMap name'
                    }
                    value={row.refName}
                    onChange={e =>
                      updateEnvRow(row.id, { refName: e.target.value })
                    }
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Key"
                    value={row.refKey}
                    onChange={e =>
                      updateEnvRow(row.id, { refKey: e.target.value })
                    }
                    size="small"
                    sx={{ flex: 1 }}
                  />
                </>
              )}
              <IconButton
                aria-label="Remove variable"
                onClick={() => removeEnvRow(row.id)}
                size="small"
                sx={{ mt: 0.5 }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>
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

    {/* Service ports */}
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
              onChange={e => updatePortRow(row.id, { name: e.target.value })}
              size="small"
              sx={{ minWidth: 120, flex: '1 1 100px' }}
            />
            <TextField
              label="Port"
              value={row.port}
              onChange={e => updatePortRow(row.id, { port: e.target.value })}
              size="small"
              type="number"
              inputProps={{ min: 1, max: 65535 }}
              sx={{ width: 100 }}
              error={portErrors.has(row.id)}
              helperText={portErrors.get(row.id)}
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
              <InputLabel id={`agent-proto-${row.id}`}>Protocol</InputLabel>
              <Select<PortProtocol>
                labelId={`agent-proto-${row.id}`}
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

    {/* Switches */}
    <Stack spacing={1}>
      <Tooltip
        title="Expose the agent externally via an OpenShift Route or Kubernetes Ingress."
        placement="right"
        arrow
      >
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
      </Tooltip>
      <Tooltip
        title="Enables identity propagation between services. When enabled, the calling user's identity is forwarded to the agent via the platform auth bridge."
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
        title="Enables SPIRE-based workload identity (mTLS). Provides cryptographic proof of workload identity between services."
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
);
