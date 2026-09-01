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

import { useEffect, useState } from 'react';

import { ResponseErrorPanel } from '@backstage/core-components';
import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  FormLabel,
  TextField,
  Box,
  Switch,
} from '@material-ui/core';
import type { AdversarialAgent } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { useClientService } from '../../ClientService';
import { useTranslation } from '../../hooks/useTranslation';
import { extractResponseError, isHttpSuccessResponse } from '../tools';

interface AgentDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  agent?: AdversarialAgent;
}

const PHASES = ['analyze', 'migrate'] as const;

const PHASE_LABELS: Record<(typeof PHASES)[number], string> = {
  analyze: 'adversarialAgentsPage.dialog.phaseAnalyze',
  migrate: 'adversarialAgentsPage.dialog.phaseMigrate',
};

export const AgentDialog = ({
  open,
  onClose,
  onSaved,
  agent,
}: AgentDialogProps) => {
  const clientService = useClientService();
  const { t } = useTranslation();

  const isEdit = !!agent;

  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [phases, setPhases] = useState<Set<string>>(new Set());
  const [critical, setCritical] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (open) {
      setName(agent?.name ?? '');
      setPrompt(agent?.prompt ?? '');
      setPhases(new Set(agent?.phases ?? []));
      setCritical(agent?.critical ?? false);
      setError(null);
    }
  }, [open, agent]);

  const handlePhaseToggle = (phase: string, checked: boolean) => {
    const newPhases = new Set(phases);
    if (checked) {
      newPhases.add(phase);
    } else {
      newPhases.delete(phase);
    }
    setPhases(newPhases);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const body = {
        name,
        prompt,
        phases: Array.from(phases) as any,
        critical,
      };

      const response = isEdit
        ? await clientService.adversarialAgentsIdPut({
            path: { id: agent!.id },
            body,
          })
        : await clientService.adversarialAgentsPost({
            body,
          });

      if (!isHttpSuccessResponse(response)) {
        const errorKey = isEdit
          ? 'adversarialAgentsPage.dialog.updateError'
          : 'adversarialAgentsPage.dialog.createError';
        const message = await extractResponseError(response, t(errorKey));
        setError(new Error(message));
        return;
      }

      onSaved();
    } catch (e) {
      setError(e as Error);
    } finally {
      setSaving(false);
    }
  };

  const canSave =
    name.trim().length >= 3 &&
    name.trim().length <= 100 &&
    prompt.trim().length >= 50 &&
    prompt.trim().length <= 5000 &&
    phases.size > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEdit
          ? t('adversarialAgentsPage.dialog.editTitle')
          : t('adversarialAgentsPage.dialog.createTitle')}
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column">
          {error && <ResponseErrorPanel error={error} />}

          <Box mt={2}>
            <TextField
              label={t('adversarialAgentsPage.dialog.nameField')}
              placeholder={t('adversarialAgentsPage.dialog.namePlaceholder')}
              value={name}
              onChange={e => setName(e.target.value)}
              fullWidth
              required
              error={name.length > 0 && (name.length < 3 || name.length > 100)}
              helperText={
                name.length > 0 && (name.length < 3 || name.length > 100)
                  ? t('adversarialAgentsPage.dialog.nameValidation')
                  : ''
              }
            />
          </Box>

          <Box mt={2}>
            <TextField
              label={t('adversarialAgentsPage.dialog.promptField')}
              placeholder={t('adversarialAgentsPage.dialog.promptPlaceholder')}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              multiline
              rows={6}
              fullWidth
              required
              error={
                prompt.length > 0 &&
                (prompt.length < 50 || prompt.length > 5000)
              }
              helperText={`${prompt.length}${t('adversarialAgentsPage.dialog.promptCharacterCount')}`}
            />
          </Box>

          <Box mt={2}>
            <FormLabel component="legend">
              {t('adversarialAgentsPage.dialog.phasesField')}
            </FormLabel>
            <FormGroup>
              {PHASES.map(phase => (
                <FormControlLabel
                  key={phase}
                  control={
                    <Checkbox
                      checked={phases.has(phase)}
                      onChange={e => handlePhaseToggle(phase, e.target.checked)}
                    />
                  }
                  label={t(PHASE_LABELS[phase] as any, {})}
                />
              ))}
            </FormGroup>
            {phases.size === 0 && (
              <Box color="error.main" fontSize="0.75rem" mt={1}>
                {t('adversarialAgentsPage.dialog.phasesValidation')}
              </Box>
            )}
          </Box>

          <Box mt={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={critical}
                  onChange={e => setCritical(e.target.checked)}
                  color="primary"
                />
              }
              label={t('adversarialAgentsPage.dialog.criticalField')}
            />
            <Box fontSize="0.75rem" color="text.secondary" mt={1}>
              {t('adversarialAgentsPage.dialog.criticalHelper')}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {t('adversarialAgentsPage.dialog.cancel')}
        </Button>
        <Button
          onClick={handleSave}
          color="primary"
          variant="contained"
          disabled={!canSave || saving}
          startIcon={saving ? <CircularProgress size={16} /> : undefined}
        >
          {t('adversarialAgentsPage.dialog.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
