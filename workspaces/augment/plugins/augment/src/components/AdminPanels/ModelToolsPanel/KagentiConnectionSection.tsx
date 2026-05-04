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
import { useState, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { useAdminConfig } from '../../../hooks';
import { AdminSection } from '../shared/AdminSection';

const URL_RE = /^https?:\/\/.+/;

interface Props {
  effectiveConfig?: Record<string, unknown> | null;
  onConfigSaved?: () => void;
}

export const KagentiConnectionSection = ({
  effectiveConfig,
  onConfigSaved,
}: Props) => {
  const kagentiUrlConfig = useAdminConfig('kagentiBaseUrl');

  const effectiveKagentiUrl = (effectiveConfig?.kagentiBaseUrl as string) ?? '';

  const [kagentiUrl, setKagentiUrl] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    if (!initialized && !kagentiUrlConfig.loading) {
      const dbValue = kagentiUrlConfig.entry?.configValue as string | undefined;
      setKagentiUrl(dbValue ?? effectiveKagentiUrl);
      setInitialized(true);
    }
  }, [initialized, kagentiUrlConfig.loading, kagentiUrlConfig.entry, effectiveKagentiUrl]);

  const handleSave = useCallback(async () => {
    if (kagentiUrl.trim() && !URL_RE.test(kagentiUrl.trim())) {
      setToast({
        message: 'Kagenti URL must start with http:// or https://',
        severity: 'error',
      });
      return;
    }
    try {
      await kagentiUrlConfig.save(kagentiUrl.trim());
    } catch {
      return;
    }
    setToast({ message: 'Kagenti connection URL saved', severity: 'success' });
    onConfigSaved?.();
  }, [kagentiUrl, kagentiUrlConfig, onConfigSaved]);

  const handleReset = useCallback(async () => {
    try {
      await kagentiUrlConfig.reset();
    } catch {
      return;
    }
    setKagentiUrl(effectiveKagentiUrl);
    setInitialized(false);
    setToast({ message: 'Reset to YAML default', severity: 'success' });
  }, [kagentiUrlConfig, effectiveKagentiUrl]);

  if (kagentiUrlConfig.loading) return null;

  return (
    <>
      <AdminSection
        title="Kagenti Connection"
        description="Configure the Kagenti backend API endpoint. This URL is used to communicate with the Kagenti agent orchestration service."
        source={kagentiUrlConfig.source === 'database' ? 'database' : 'default'}
        saving={kagentiUrlConfig.saving}
        error={kagentiUrlConfig.error}
        onSave={handleSave}
        onReset={handleReset}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2.5, pt: 1 }}>
          <TextField
            label="Kagenti API URL"
            size="small"
            value={kagentiUrl}
            onChange={e => setKagentiUrl(e.target.value)}
            placeholder="e.g. https://kagenti-backend.apps.example.com"
            helperText="Kagenti backend endpoint (overrides app-config.yaml)"
            error={!!kagentiUrl && !URL_RE.test(kagentiUrl)}
          />
        </Box>
      </AdminSection>

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert
            onClose={() => setToast(null)}
            severity={toast.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
};
