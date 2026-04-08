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

import { useCallback, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LaptopMacOutlinedIcon from '@mui/icons-material/LaptopMacOutlined';
import { alpha, useTheme } from '@mui/material/styles';
import { useApi } from '@backstage/core-plugin-api';
import { augmentApiRef } from '../../../api';
import { getErrorMessage } from '../../../utils';

export interface DevSpacesLaunchFormProps {
  onBack: () => void;
  /** Pre-fill the git repo field, e.g. from a template's source URL. */
  initialGitRepo?: string;
}

interface WorkspaceResult {
  name: string;
  namespace: string;
  phase: string;
  message: string;
}

type FormStatus = 'idle' | 'creating' | 'success' | 'error';

export function DevSpacesLaunchForm({
  onBack,
  initialGitRepo,
}: DevSpacesLaunchFormProps) {
  const theme = useTheme();
  const api = useApi(augmentApiRef);

  const [namespace, setNamespace] = useState('admin-devspaces');
  const [gitRepo, setGitRepo] = useState(initialGitRepo ?? '');
  const [token, setToken] = useState('');
  const [memoryLimit, setMemoryLimit] = useState('8Gi');
  const [cpuLimit, setCpuLimit] = useState('2000m');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [status, setStatus] = useState<FormStatus>('idle');
  const [result, setResult] = useState<WorkspaceResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const isValid = namespace.trim() && gitRepo.trim() && token.trim();

  const handleCreate = useCallback(async () => {
    if (!isValid) return;
    setStatus('creating');
    setErrorMessage('');
    setResult(null);

    try {
      const response = await api.createDevSpacesWorkspace(
        {
          namespace: namespace.trim(),
          git_repo: gitRepo.trim(),
          memory_limit: memoryLimit.trim() || '8Gi',
          cpu_limit: cpuLimit.trim() || '2000m',
        },
        token.trim(),
      );
      setResult(response);
      setStatus('success');
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
      setStatus('error');
    }
  }, [api, namespace, gitRepo, token, memoryLimit, cpuLimit, isValid]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <IconButton onClick={onBack} size="small" aria-label="Back">
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <LaptopMacOutlinedIcon
          sx={{ fontSize: 22, color: theme.palette.primary.main }}
        />
        <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
          Agent DevSpace
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Launch a ready-to-code cloud IDE with your agent&apos;s repository,
        tools, and runtime pre-configured.
      </Typography>

      {status === 'success' && result && (
        <Alert
          severity="success"
          icon={<CheckCircleOutlineIcon />}
          sx={{ mb: 2.5 }}
          action={
            <Button
              size="small"
              onClick={() => {
                setStatus('idle');
                setResult(null);
              }}
              sx={{ textTransform: 'none' }}
            >
              Create Another
            </Button>
          }
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Workspace created
          </Typography>
          <Typography variant="body2">
            <strong>{result.name}</strong> in {result.namespace} &mdash;{' '}
            {result.phase}
          </Typography>
          {result.message && (
            <Typography variant="caption" color="text.secondary">
              {result.message}
            </Typography>
          )}
        </Alert>
      )}

      {status === 'error' && errorMessage && (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          {errorMessage}
        </Alert>
      )}

      {status !== 'success' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Git Repository"
            placeholder="https://github.com/your-org/agent-repo.git"
            value={gitRepo}
            onChange={e => setGitRepo(e.target.value)}
            required
            fullWidth
            size="small"
            helperText="The repository containing your agent code"
            disabled={status === 'creating'}
          />

          <TextField
            label="OpenShift Token"
            placeholder="sha256~..."
            value={token}
            onChange={e => setToken(e.target.value)}
            required
            fullWidth
            size="small"
            type="password"
            helperText="Your OpenShift token for authentication (oc whoami -t)"
            disabled={status === 'creating'}
          />

          <TextField
            label="Namespace"
            placeholder="admin-devspaces"
            value={namespace}
            onChange={e => setNamespace(e.target.value)}
            required
            fullWidth
            size="small"
            helperText="OpenShift namespace where the workspace will run"
            disabled={status === 'creating'}
          />

          <Box>
            <Button
              size="small"
              onClick={() => setAdvancedOpen(v => !v)}
              endIcon={
                <ExpandMoreIcon
                  sx={{
                    transform: advancedOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                  }}
                />
              }
              sx={{ textTransform: 'none', color: theme.palette.text.secondary }}
            >
              Resource Limits
            </Button>
            <Collapse in={advancedOpen}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 2,
                  mt: 1,
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.action.hover, 0.04),
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <TextField
                  label="Memory Limit"
                  value={memoryLimit}
                  onChange={e => setMemoryLimit(e.target.value)}
                  size="small"
                  helperText="e.g. 8Gi, 4Gi"
                  disabled={status === 'creating'}
                />
                <TextField
                  label="CPU Limit"
                  value={cpuLimit}
                  onChange={e => setCpuLimit(e.target.value)}
                  size="small"
                  helperText="e.g. 2000m, 4000m"
                  disabled={status === 'creating'}
                />
              </Box>
            </Collapse>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 1 }}>
            <Button
              onClick={onBack}
              disabled={status === 'creating'}
              sx={{ textTransform: 'none' }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={!isValid || status === 'creating'}
              startIcon={
                status === 'creating' ? (
                  <CircularProgress size={16} color="inherit" />
                ) : undefined
              }
              sx={{ textTransform: 'none', minWidth: 160 }}
            >
              {status === 'creating' ? 'Creating...' : 'Create Workspace'}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
