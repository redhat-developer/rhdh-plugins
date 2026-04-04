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

import { useState, useCallback } from 'react';
import Fade from '@mui/material/Fade';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import { useTheme, alpha } from '@mui/material/styles';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import type { StreamFormDescriptor, StreamFormField } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { useTranslation } from '../../hooks/useTranslation';

interface FormRequestCardProps {
  form: StreamFormDescriptor;
  onSubmit?: (values: Record<string, unknown>) => void;
  onCancel?: () => void;
}

function renderField(
  field: StreamFormField,
  value: unknown,
  onChange: (name: string, val: unknown) => void,
) {
  const label = field.label || field.name;
  const fieldType = field.type || 'text';

  switch (fieldType) {
    case 'boolean':
      return (
        <FormControlLabel
          key={field.name}
          control={
            <Switch
              checked={!!value}
              onChange={e => onChange(field.name, e.target.checked)}
              size="small"
            />
          }
          label={
            <Box>
              <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                {label}
              </Typography>
              {field.description && (
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  {field.description}
                </Typography>
              )}
            </Box>
          }
          sx={{ ml: 0, alignItems: 'flex-start' }}
        />
      );

    case 'select':
      return (
        <FormControl key={field.name} fullWidth size="small">
          <InputLabel>{label}</InputLabel>
          <Select
            value={(value as string) || ''}
            label={label}
            onChange={e => onChange(field.name, e.target.value)}
          >
            {(field.options || []).map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
          {field.description && (
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.25 }}>
              {field.description}
            </Typography>
          )}
        </FormControl>
      );

    case 'textarea':
      return (
        <TextField
          key={field.name}
          label={label}
          helperText={field.description}
          value={(value as string) || ''}
          onChange={e => onChange(field.name, e.target.value)}
          required={field.required}
          multiline
          minRows={3}
          maxRows={8}
          size="small"
          fullWidth
        />
      );

    case 'number':
      return (
        <TextField
          key={field.name}
          label={label}
          helperText={field.description}
          type="number"
          value={value !== undefined ? value : ''}
          onChange={e => {
            const num = Number(e.target.value);
            onChange(
              field.name,
              e.target.value ? (Number.isNaN(num) ? undefined : num) : undefined,
            );
          }}
          required={field.required}
          size="small"
          fullWidth
        />
      );

    default:
      return (
        <TextField
          key={field.name}
          label={label}
          helperText={field.description}
          value={(value as string) || ''}
          onChange={e => onChange(field.name, e.target.value)}
          required={field.required}
          size="small"
          fullWidth
        />
      );
  }
}

export const FormRequestCard: React.FC<FormRequestCardProps> = ({
  form,
  onSubmit,
  onCancel,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const fields = form.fields || [];

  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    fields.forEach(f => {
      if (f.defaultValue !== undefined) initial[f.name] = f.defaultValue;
    });
    return initial;
  });

  const handleChange = useCallback((name: string, val: unknown) => {
    setValues(prev => ({ ...prev, [name]: val }));
  }, []);

  const hasRequiredMissing = fields.some(
    f => f.required && (values[f.name] === undefined || values[f.name] === ''),
  );

  return (
    <Fade in timeout={300}>
    <Box
      sx={{
        mt: 1.5,
        mb: 1,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
        borderLeft: `3px solid ${theme.palette.primary.main}`,
        bgcolor: alpha(theme.palette.primary.main, isDark ? 0.06 : 0.02),
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1.25,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        }}
      >
        <AssignmentIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
            {form.title || t('formRequestCard.inputRequired')}
          </Typography>
          {form.description && (
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              {form.description}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Fields */}
      <Box sx={{ px: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {fields.map(field => renderField(field, values[field.name], handleChange))}
      </Box>

      {/* Actions */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1,
          px: 2,
          py: 1.25,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        }}
      >
        {onCancel && (
          <Button
            size="small"
            startIcon={<CloseIcon sx={{ fontSize: 14 }} />}
            onClick={onCancel}
            sx={{ textTransform: 'none', fontSize: '0.8rem' }}
          >
            {t('formRequestCard.cancel')}
          </Button>
        )}
        <Button
          size="small"
          variant="contained"
          startIcon={<SendIcon sx={{ fontSize: 14 }} />}
          disabled={hasRequiredMissing}
          onClick={() => onSubmit?.(values)}
          sx={{ textTransform: 'none', fontSize: '0.8rem' }}
        >
          {t('formRequestCard.submit')}
        </Button>
      </Box>
    </Box>
    </Fade>
  );
};
