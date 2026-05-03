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
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import type { AgentWizardFormData } from '../types';

interface InstructionsStepProps {
  formData: AgentWizardFormData;
  updateField: <K extends keyof AgentWizardFormData>(
    field: K,
    value: AgentWizardFormData[K],
  ) => void;
  getFieldError: (field: string) => string | undefined;
  onGeneratePrompt?: (description: string) => Promise<string>;
}

export function InstructionsStep({
  formData,
  updateField,
  getFieldError,
  onGeneratePrompt,
}: InstructionsStepProps) {
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!onGeneratePrompt || !formData.description) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const prompt = await onGeneratePrompt(formData.description);
      updateField('instructions', prompt);
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : 'Failed to generate prompt',
      );
    } finally {
      setGenerating(false);
    }
  }, [onGeneratePrompt, formData.description, updateField]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" gutterBottom>
        System Instructions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Define how the agent should behave. These instructions guide the
        model&apos;s responses and personality.
      </Typography>

      {onGeneratePrompt && formData.description && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 2,
            bgcolor: 'action.hover',
            borderRadius: 1,
          }}
        >
          <AutoFixHighIcon color="primary" />
          <Typography variant="body2" sx={{ flex: 1 }}>
            Generate instructions from your agent description using AI
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={handleGenerate}
            disabled={generating}
            startIcon={generating ? <CircularProgress size={16} /> : undefined}
          >
            {generating ? 'Generating...' : 'Generate'}
          </Button>
        </Box>
      )}

      {generateError && (
        <Alert severity="error" onClose={() => setGenerateError(null)}>
          {generateError}
        </Alert>
      )}

      <TextField
        label="System Prompt"
        required
        fullWidth
        multiline
        rows={12}
        value={formData.instructions}
        onChange={e => updateField('instructions', e.target.value)}
        error={!!getFieldError('instructions')}
        helperText={
          getFieldError('instructions') ||
          `${formData.instructions.length} characters`
        }
        placeholder={`You are a helpful assistant specializing in...\n\nYour responsibilities:\n- ...\n- ...\n\nGuidelines:\n- Be concise and accurate\n- Ask for clarification when needed`}
        InputProps={{
          sx: { fontFamily: 'monospace', fontSize: '0.875rem' },
        }}
      />
    </Box>
  );
}
