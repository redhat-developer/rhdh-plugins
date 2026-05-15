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
  TextField,
} from '@material-ui/core';
import type { Rule } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { useClientService } from '../../ClientService';
import { useTranslation } from '../../hooks/useTranslation';
import { extractResponseError, isHttpSuccessResponse } from '../tools';

interface RuleDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  rule?: Rule;
}

export const RuleDialog = ({
  open,
  onClose,
  onSaved,
  rule,
}: RuleDialogProps) => {
  const clientService = useClientService();
  const { t } = useTranslation();

  const isEdit = !!rule;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [required, setRequired] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(rule?.title ?? '');
      setDescription(rule?.description ?? '');
      setRequired(rule?.required ?? false);
      setError(null);
    }
  }, [open, rule]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = isEdit
        ? await clientService.rulesRuleIdPut({
            path: { ruleId: rule!.id },
            body: { title, description, required },
          })
        : await clientService.rulesPost({
            body: { title, description, required },
          });

      if (!isHttpSuccessResponse(response)) {
        const errorKey = isEdit
          ? 'rulesPage.dialog.updateError'
          : 'rulesPage.dialog.createError';
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

  const canSave = title.trim().length > 0 && description.trim().length > 0;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEdit
          ? t('rulesPage.dialog.editTitle')
          : t('rulesPage.dialog.createTitle')}
      </DialogTitle>
      <DialogContent>
        {error && <ResponseErrorPanel error={error} />}
        <TextField
          label={t('rulesPage.dialog.titleField')}
          value={title}
          onChange={e => setTitle(e.target.value)}
          fullWidth
          margin="normal"
          disabled={saving}
          required
        />
        <TextField
          label={t('rulesPage.dialog.descriptionField')}
          value={description}
          onChange={e => setDescription(e.target.value)}
          fullWidth
          multiline
          minRows={3}
          margin="normal"
          disabled={saving}
          required
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={required}
              onChange={e => setRequired(e.target.checked)}
              color="primary"
              disabled={saving}
            />
          }
          label={t('rulesPage.dialog.requiredField')}
        />
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={saving || !canSave}
          startIcon={
            saving ? <CircularProgress size={16} color="inherit" /> : null
          }
        >
          {t('rulesPage.dialog.save')}
        </Button>
        <Button variant="outlined" onClick={onClose} disabled={saving}>
          {t('rulesPage.dialog.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
