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

import { type FC, useState } from 'react';
import type { KagentiBuildStrategy } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { BuildArgRow, DeploymentMethod } from './toolWizardTypes';

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
  buildArgRows: BuildArgRow[];
  addBuildArgRow: () => void;
  updateBuildArgRow: (id: number, value: string) => void;
  removeBuildArgRow: (id: number) => void;
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
  buildArgRows,
  addBuildArgRow,
  updateBuildArgRow,
  removeBuildArgRow,
  buildTimeout,
  setBuildTimeout,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        Choose how to deploy your tool — from a pre-built container image or by
        building from source code.
      </Typography>
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
                  Build the image from source via Shipwright, then deploy. Takes
                  a few minutes.
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
            placeholder="ghcr.io/your-org/tool-name:latest"
            helperText="Full image reference including tag."
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
            placeholder="https://github.com/your-org/repo.git"
          />

          <Box>
            <Link
              component="button"
              type="button"
              variant="body2"
              underline="hover"
              onClick={() => setShowAdvanced(prev => !prev)}
              sx={{ mb: showAdvanced ? 1 : 0 }}
            >
              {showAdvanced
                ? 'Hide advanced build options'
                : 'Show advanced build options'}
            </Link>
            <Collapse in={showAdvanced}>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label="Git revision"
                  value={gitRevision}
                  onChange={e => setGitRevision(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="main"
                  helperText="Branch, tag, or commit SHA. Defaults to main."
                />
                <TextField
                  label="Context directory"
                  value={contextDir}
                  onChange={e => setContextDir(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="e.g. tools/my_tool"
                  helperText="Subdirectory containing the Dockerfile. Leave empty for repo root."
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
                  helperText="Kubernetes Secret name for authenticating with the target container registry."
                />
                <TextField
                  label="Image tag"
                  value={imageTag}
                  onChange={e => setImageTag(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="v0.0.1"
                  helperText="Tag for the built image. Defaults to v0.0.1."
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
                  helperText="Path to the Dockerfile relative to the context directory."
                />
                <Box>
                  <Typography
                    variant="body2"
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
                          onChange={e =>
                            updateBuildArgRow(row.id, e.target.value)
                          }
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
                <TextField
                  label="Build timeout"
                  value={buildTimeout}
                  onChange={e => setBuildTimeout(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="15m"
                  helperText="Maximum build duration. Defaults to 15m."
                />
              </Stack>
            </Collapse>
          </Box>
        </Stack>
      )}
    </Stack>
  );
};
