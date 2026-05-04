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
import { useState, useCallback, useMemo, useEffect } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import {
  useAdminConfig,
  useBranding,
  dispatchBrandingRefresh,
} from '../../hooks';
import { AdminSection } from './shared/AdminSection';
import { ColorInput } from './shared/ColorInput';
import {
  DEFAULT_BRANDING,
  type BrandingConfig,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// ---------------------------------------------------------------------------
// Field group header
// ---------------------------------------------------------------------------

const FieldGroup = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Box sx={{ mb: 3 }}>
    <Typography
      variant="subtitle2"
      color="text.secondary"
      sx={{
        mb: 1,
        fontWeight: 600,
        textTransform: 'uppercase',
        fontSize: '0.7rem',
        letterSpacing: 0.5,
      }}
    >
      {title}
    </Typography>
    {children}
  </Box>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface Props {
  effectiveConfig?: Record<string, unknown> | null;
}

export const AppearanceSection = ({
  effectiveConfig: _effectiveConfig,
}: Props) => {
  const config = useAdminConfig('branding');
  const { branding: liveBranding, loading: brandingLoading } = useBranding();

  const [local, setLocal] = useState<BrandingConfig>({ ...DEFAULT_BRANDING });
  const [toast, setToast] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const baseline = useMemo<BrandingConfig>(
    () => ({ ...DEFAULT_BRANDING, ...liveBranding }),
    [liveBranding],
  );

  const dbOverrides = useMemo<Partial<BrandingConfig>>(() => {
    if (!config.entry) return {};
    return (config.entry.configValue as Partial<BrandingConfig>) ?? {};
  }, [config.entry]);

  useEffect(() => {
    if (!initialized && !config.loading && !brandingLoading) {
      const merged = { ...baseline, ...dbOverrides };
      setLocal(merged);
      setInitialized(true);
    }
  }, [initialized, config.loading, brandingLoading, baseline, dbOverrides]);

  const set = useCallback(
    <K extends keyof BrandingConfig>(key: K, value: BrandingConfig[K]) => {
      setLocal(prev => ({ ...prev, [key]: value }));
    },
    [],
  );

  // Validate all color fields
  const colorFields: (keyof BrandingConfig)[] = [
    'primaryColor',
    'secondaryColor',
    'successColor',
    'warningColor',
    'errorColor',
    'infoColor',
  ];
  const hasInvalidColor = colorFields.some(f => {
    const v = local[f] as string;
    return v && !HEX_RE.test(v);
  });

  const handleSave = useCallback(async () => {
    if (hasInvalidColor) {
      setToast('Fix invalid color values before saving');
      return;
    }
    try {
      await config.save(local);
    } catch {
      return;
    }
    dispatchBrandingRefresh();
    setToast('Branding saved');
  }, [local, config, hasInvalidColor]);

  const handleReset = useCallback(async () => {
    try {
      await config.reset();
    } catch {
      return;
    }
    setLocal({ ...baseline });
    setInitialized(false);
    dispatchBrandingRefresh();
    setToast('Reset to YAML defaults');
  }, [config, baseline]);

  if (config.loading) return null;

  return (
    <>
      <AdminSection
        title=""
        source={config.source}
        saving={config.saving}
        error={config.error}
        onSave={handleSave}
        onReset={handleReset}
        saveDisabled={hasInvalidColor}
      >
        {/* Identity */}
        <FieldGroup title="Identity">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, pt: 1 }}>
            <TextField
              label="App Name"
              size="small"
              value={local.appName}
              onChange={e => set('appName', e.target.value)}
            />
            <TextField
              label="Input Placeholder"
              size="small"
              value={local.inputPlaceholder}
              onChange={e => set('inputPlaceholder', e.target.value)}
            />
            <TextField
              label="Favicon URL"
              size="small"
              value={local.faviconUrl ?? ''}
              onChange={e => set('faviconUrl', e.target.value || undefined)}
              placeholder="https://example.com/favicon.ico"
              helperText="Tab icon URL"
            />
            <TextField
              label="Bot Avatar URL"
              size="small"
              value={local.botAvatarUrl ?? ''}
              onChange={e => set('botAvatarUrl', e.target.value || undefined)}
              placeholder="https://example.com/avatar.png"
              helperText="Assistant avatar in chat"
            />
          </Box>
        </FieldGroup>

        {/* Colors */}
        <FieldGroup title="Colors">
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <ColorInput
              label="Primary Color"
              value={local.primaryColor}
              onChange={v => set('primaryColor', v)}
              defaultValue={DEFAULT_BRANDING.primaryColor}
            />
            <ColorInput
              label="Secondary Color"
              value={local.secondaryColor}
              onChange={v => set('secondaryColor', v)}
              defaultValue={DEFAULT_BRANDING.secondaryColor}
            />
            <ColorInput
              label="Success Color"
              value={local.successColor}
              onChange={v => set('successColor', v)}
              defaultValue={DEFAULT_BRANDING.successColor}
            />
            <ColorInput
              label="Warning Color"
              value={local.warningColor}
              onChange={v => set('warningColor', v)}
              defaultValue={DEFAULT_BRANDING.warningColor}
            />
            <ColorInput
              label="Error Color"
              value={local.errorColor}
              onChange={v => set('errorColor', v)}
              defaultValue={DEFAULT_BRANDING.errorColor}
            />
            <ColorInput
              label="Info Color"
              value={local.infoColor}
              onChange={v => set('infoColor', v)}
              defaultValue={DEFAULT_BRANDING.infoColor}
            />
          </Box>
        </FieldGroup>

      </AdminSection>

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
};
