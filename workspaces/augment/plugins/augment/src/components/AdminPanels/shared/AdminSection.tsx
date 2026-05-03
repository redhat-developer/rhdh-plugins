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
import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import { useTheme, alpha } from '@mui/material/styles';
import { glassSurface, borderRadius, transitions } from '../../../theme/tokens';

export interface AdminSectionProps {
  title: string;
  description?: string;
  source: 'database' | 'default';
  saving: boolean;
  error: string | null;
  onSave: () => void;
  onReset?: () => void;
  /** Disable the save button (e.g. when form is invalid) */
  saveDisabled?: boolean;
  children: ReactNode;
}

/**
 * Reusable card wrapper for admin config sections.
 * Provides a consistent header, customized chip, save/reset buttons,
 * and error display.
 */
export const AdminSection = ({
  title,
  description,
  source,
  saving,
  error,
  onSave,
  onReset,
  saveDisabled,
  children,
}: AdminSectionProps) => {
  const hasHeader = !!title;

  const actionCluster = (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {source === 'database' && (
        <Chip label="Customized" size="small" color="info" />
      )}
      {onReset && (
        <Button
          size="small"
          startIcon={<RestoreIcon />}
          onClick={onReset}
          disabled={saving || source === 'default'}
          sx={{ textTransform: 'none' }}
        >
          Reset
        </Button>
      )}
    </Box>
  );

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const glass = glassSurface(theme, 8);

  return (
    <Box
      sx={{
        ...glass,
        mb: 3,
        overflow: 'hidden',
        borderRadius: borderRadius.md,
        transition: transitions.normal,
        position: 'relative',
      }}
    >
      {/* Saving progress indicator */}
      {saving && (
        <LinearProgress
          sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, zIndex: 1 }}
        />
      )}

      {/* Header bar — only when a title is provided */}
      {hasHeader && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2.5,
            py: 1.5,
            borderBottom: `1px solid ${alpha(
              isDark ? theme.palette.common.white : theme.palette.common.black,
              isDark ? 0.1 : 0.06,
            )}`,
          }}
        >
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, color: 'text.primary' }}>
            {title}
          </Typography>
          {actionCluster}
        </Box>
      )}

      {/* Section body */}
      <Box sx={{ p: 2.5 }}>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {description}
          </Typography>
        )}

        {children}

        <Box
          sx={{
            mt: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Button
            variant="contained"
            size="small"
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={onSave}
            disabled={saving || saveDisabled}
            aria-busy={saving}
            sx={{
              textTransform: 'none',
              borderRadius: borderRadius.sm,
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none' },
            }}
          >
            Save
          </Button>
          {/* When no header bar, render actions inline with Save */}
          {!hasHeader && actionCluster}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 1.5 }}>
            {error}
          </Alert>
        )}
      </Box>
    </Box>
  );
};
