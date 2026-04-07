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
import type { KagentiBuildStrategy } from '@red-hat-developer-hub/backstage-plugin-augment-common';
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
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { BuildArgRow, DeploymentMethod } from './agentWizardTypes';

interface AgentWizardDeployStepProps {
  deploymentMethod: DeploymentMethod;
  setDeploymentMethod: (v: DeploymentMethod) => void;
  containerImage: string;
  setContainerImage: (v: string) => void;
  imagePullSecret: string;
  setImagePullSecret: (v: string) => void;
  gitUrl: string;
  setGitUrl: (v: string) => void;
  gitBranch: string;
  setGitBranch: (v: string) => void;
  gitPath: string;
  setGitPath: (v: string) => void;
  registryUrl: string;
  setRegistryUrl: (v: string) => void;
  registrySecret: string;
  setRegistrySecret: (v: string) => void;
  imageTag: string;
  setImageTag: (v: string) => void;
  startCommand: string;
  setStartCommand: (v: string) => void;
  buildStrategy: string;
  setBuildStrategy: (v: string) => void;
  buildStrategies: KagentiBuildStrategy[];
  buildStrategyError: string | null;
  dockerfile: string;
  setDockerfile: (v: string) => void;
  buildTimeout: string;
  setBuildTimeout: (v: string) => void;
  buildArgRows: BuildArgRow[];
  addBuildArgRow: () => void;
  updateBuildArgRow: (id: number, value: string) => void;
  removeBuildArgRow: (id: number) => void;
}

export const AgentWizardDeployStep: FC<AgentWizardDeployStepProps> = ({
  deploymentMethod,
  setDeploymentMethod,
  containerImage,
  setContainerImage,
  imagePullSecret,
  setImagePullSecret,
  gitUrl,
  setGitUrl,
  gitBranch,
  setGitBranch,
  gitPath,
  setGitPath,
  registryUrl,
  setRegistryUrl,
  registrySecret,
  setRegistrySecret,
  imageTag,
  setImageTag,
  startCommand,
  setStartCommand,
  buildStrategy,
  setBuildStrategy,
  buildStrategies,
  buildStrategyError,
  dockerfile,
  setDockerfile,
  buildTimeout,
  setBuildTimeout,
  buildArgRows,
  addBuildArgRow,
  updateBuildArgRow,
  removeBuildArgRow,
}) => (
  <Stack spacing={2}>
    <FormControl>
      <FormLabel id="agent-deploy-method">Deployment method</FormLabel>
      <RadioGroup
        aria-labelledby="agent-deploy-method"
        value={deploymentMethod}
        onChange={(_, v) => setDeploymentMethod(v as DeploymentMethod)}
      >
        <FormControlLabel
          value="image"
          control={<Radio size="small" />}
          label={
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Container Image
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Deploy from a pre-built image. Fastest option.
              </Typography>
            </Box>
          }
        />
        <FormControlLabel
          value="source"
          control={<Radio size="small" />}
          label={
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Source from Git
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Build the image from source via Shipwright, then deploy. Takes a
                few minutes.
              </Typography>
            </Box>
          }
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
          helperText="e.g. quay.io/org/agent:v1"
        />
        <TextField
          label="Image pull secret"
          value={imagePullSecret}
          onChange={e => setImagePullSecret(e.target.value)}
          fullWidth
          size="small"
          helperText="Kubernetes Secret name for private registry authentication."
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
          helperText="Repository URL containing the agent source code."
        />
        <Stack direction="row" spacing={2}>
          <TextField
            label="Git branch"
            value={gitBranch}
            onChange={e => setGitBranch(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            helperText="Defaults to main."
          />
          <TextField
            label="Git path"
            value={gitPath}
            onChange={e => setGitPath(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            helperText="Subdirectory within the repo."
          />
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Registry URL"
            value={registryUrl}
            onChange={e => setRegistryUrl(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            helperText="Container registry for the built image."
          />
          <TextField
            label="Registry secret"
            value={registrySecret}
            onChange={e => setRegistrySecret(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            helperText="Secret for registry push credentials."
          />
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Image tag"
            value={imageTag}
            onChange={e => setImageTag(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            helperText="Tag for the built image (default v0.0.1)."
          />
          <TextField
            label="Start command"
            value={startCommand}
            onChange={e => setStartCommand(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            helperText="Override the container entrypoint."
          />
        </Stack>

        {/* Shipwright build config */}
        <Typography variant="subtitle2" sx={{ mt: 1 }}>
          Build configuration
        </Typography>
        {buildStrategyError && (
          <Alert severity="warning" variant="outlined" sx={{ py: 0.5 }}>
            {buildStrategyError}
          </Alert>
        )}
        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <InputLabel>Build strategy</InputLabel>
            <Select
              label="Build strategy"
              value={buildStrategy}
              onChange={e => setBuildStrategy(e.target.value)}
            >
              <MenuItem value="">
                <em>Default</em>
              </MenuItem>
              {buildStrategies.map(bs => (
                <MenuItem key={bs.name} value={bs.name}>
                  {bs.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Dockerfile"
            value={dockerfile}
            onChange={e => setDockerfile(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            helperText="Path relative to git path."
          />
        </Stack>
        <TextField
          label="Build timeout"
          value={buildTimeout}
          onChange={e => setBuildTimeout(e.target.value)}
          size="small"
          fullWidth
          helperText="Maximum build duration (e.g. 15m, 30m, 1h)."
        />
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 0.5, display: 'block' }}
          >
            Build arguments
          </Typography>
          <Stack spacing={1}>
            {buildArgRows.map(row => (
              <Stack
                key={row.id}
                direction="row"
                spacing={1}
                alignItems="center"
              >
                <TextField
                  value={row.value}
                  onChange={e => updateBuildArgRow(row.id, e.target.value)}
                  size="small"
                  fullWidth
                  placeholder="ARG_NAME=value"
                />
                <IconButton
                  aria-label="Remove argument"
                  onClick={() => removeBuildArgRow(row.id)}
                  size="small"
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={addBuildArgRow}
              size="small"
              sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
            >
              Add build argument
            </Button>
          </Stack>
        </Box>
      </Stack>
    )}
  </Stack>
);
