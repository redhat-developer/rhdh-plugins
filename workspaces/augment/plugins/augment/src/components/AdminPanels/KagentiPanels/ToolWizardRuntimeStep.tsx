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
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
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
import Select, { type SelectChangeEvent } from '@mui/material/Select';
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
} from './toolWizardTypes';

interface ToolWizardRuntimeStepProps {
  workloadType: WorkloadType;
  setWorkloadType: (v: WorkloadType) => void;
  persistentStorageEnabled: boolean;
  setPersistentStorageEnabled: (v: boolean) => void;
  persistentStorageSize: string;
  setPersistentStorageSize: (v: string) => void;
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

export const ToolWizardRuntimeStep: FC<ToolWizardRuntimeStepProps> = ({
  workloadType,
  setWorkloadType,
  persistentStorageEnabled,
  setPersistentStorageEnabled,
  persistentStorageSize,
  setPersistentStorageSize,
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
      <FormLabel id="tool-workload-type-label">Workload type</FormLabel>
      <RadioGroup
        aria-labelledby="tool-workload-type-label"
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
      </RadioGroup>
    </FormControl>

    {workloadType === 'statefulset' && (
      <Box>
        <FormControlLabel
          control={
            <Switch
              checked={persistentStorageEnabled}
              onChange={e => setPersistentStorageEnabled(e.target.checked)}
              size="small"
            />
          }
          label="Persistent storage"
        />
        {persistentStorageEnabled && (
          <TextField
            label="Storage size"
            value={persistentStorageSize}
            onChange={e => setPersistentStorageSize(e.target.value)}
            size="small"
            sx={{ mt: 1, width: 200 }}
            placeholder="1Gi"
            helperText="e.g. 1Gi, 5Gi, 10Gi"
          />
        )}
      </Box>
    )}

    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Environment variables
      </Typography>
      <Stack spacing={1.5}>
        {envRows.map(row => {
          const isDupe = duplicateEnvNames.has(row.name.trim().toLowerCase());
          return (
            <Stack key={row.id} spacing={1}>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <TextField
                  label="Name"
                  value={row.name}
                  onChange={e => updateEnvRow(row.id, { name: e.target.value })}
                  size="small"
                  sx={{ flex: 1 }}
                  error={isDupe}
                  helperText={isDupe ? 'Duplicate' : undefined}
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
                    <MenuItem value="direct">Value</MenuItem>
                    <MenuItem value="secret">Secret</MenuItem>
                    <MenuItem value="configMap">ConfigMap</MenuItem>
                  </Select>
                </FormControl>
                <IconButton
                  aria-label="Remove variable"
                  onClick={() => removeEnvRow(row.id)}
                  size="small"
                  sx={{ mt: 0.5 }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
              {row.source === 'direct' ? (
                <TextField
                  label="Value"
                  value={row.value}
                  onChange={e =>
                    updateEnvRow(row.id, { value: e.target.value })
                  }
                  size="small"
                  fullWidth
                />
              ) : (
                <Stack direction="row" spacing={1}>
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
                </Stack>
              )}
            </Stack>
          );
        })}
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
              <InputLabel id={`tool-proto-${row.id}`}>Protocol</InputLabel>
              <Select<PortProtocol>
                labelId={`tool-proto-${row.id}`}
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
        title="Enables identity propagation between services. When enabled, the calling user's identity is forwarded to the tool via the platform auth bridge, allowing the tool to make authenticated calls on behalf of the user."
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
);
