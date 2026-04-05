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
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import type { DeploymentMethod } from './toolWizardTypes';

interface ToolWizardDeployStepProps {
  deploymentMethod: DeploymentMethod;
  setDeploymentMethod: (v: DeploymentMethod) => void;
  containerImage: string;
  setContainerImage: (v: string) => void;
  imagePullSecret: string;
  setImagePullSecret: (v: string) => void;
  gitUrl: string;
  setGitUrl: (v: string) => void;
  gitRevision: string;
  setGitRevision: (v: string) => void;
  contextDir: string;
  setContextDir: (v: string) => void;
  registryUrl: string;
  setRegistryUrl: (v: string) => void;
  registrySecret: string;
  setRegistrySecret: (v: string) => void;
  imageTag: string;
  setImageTag: (v: string) => void;
  buildStrategy: string;
  setBuildStrategy: (v: string) => void;
  buildStrategies: KagentiBuildStrategy[];
  buildStrategyError: string | null;
  dockerfile: string;
  setDockerfile: (v: string) => void;
  buildTimeout: string;
  setBuildTimeout: (v: string) => void;
}

export const ToolWizardDeployStep: FC<ToolWizardDeployStepProps> = ({
  deploymentMethod,
  setDeploymentMethod,
  containerImage,
  setContainerImage,
  imagePullSecret,
  setImagePullSecret,
  gitUrl,
  setGitUrl,
  gitRevision,
  setGitRevision,
  contextDir,
  setContextDir,
  registryUrl,
  setRegistryUrl,
  registrySecret,
  setRegistrySecret,
  imageTag,
  setImageTag,
  buildStrategy,
  setBuildStrategy,
  buildStrategies,
  buildStrategyError,
  dockerfile,
  setDockerfile,
  buildTimeout,
  setBuildTimeout,
}) => (
  <Stack spacing={2}>
    <FormControl>
      <FormLabel id="tool-deploy-method-label">Deployment method</FormLabel>
      <RadioGroup
        aria-labelledby="tool-deploy-method-label"
        value={deploymentMethod}
        onChange={(_, v) => setDeploymentMethod(v as DeploymentMethod)}
      >
        <FormControlLabel
          value="image"
          control={<Radio size="small" />}
          label="Container Image"
        />
        <FormControlLabel
          value="source"
          control={<Radio size="small" />}
          label="Source Code (Shipwright)"
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
          helperText="Name of the Kubernetes Secret for private registries."
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
          helperText="Target container registry for the built image."
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

        {buildStrategyError && (
          <Alert severity="warning">{buildStrategyError}</Alert>
        )}
        {buildStrategies.length > 0 ? (
          <FormControl size="small" fullWidth>
            <InputLabel>Build strategy</InputLabel>
            <Select
              label="Build strategy"
              value={buildStrategy}
              onChange={e => setBuildStrategy(e.target.value)}
            >
              <MenuItem value="">
                <em>Default</em>
              </MenuItem>
              {buildStrategies.map(s => (
                <MenuItem key={s.name} value={s.name}>
                  {s.name}
                  {s.description ? ` — ${s.description}` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <TextField
            label="Build strategy"
            value={buildStrategy}
            onChange={e => setBuildStrategy(e.target.value)}
            fullWidth
            size="small"
            placeholder="e.g. buildpacks-v3"
          />
        )}
        <TextField
          label="Dockerfile"
          value={dockerfile}
          onChange={e => setDockerfile(e.target.value)}
          fullWidth
          size="small"
          placeholder="Dockerfile"
        />
        <TextField
          label="Build timeout"
          value={buildTimeout}
          onChange={e => setBuildTimeout(e.target.value)}
          fullWidth
          size="small"
          placeholder="15m"
          helperText="e.g. 15m, 30m, 1h"
        />
      </Stack>
    )}
  </Stack>
);
