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

import { useEffect, useMemo, useRef, useState } from 'react';
import useAsync from 'react-use/lib/useAsync';
import { ResponseErrorPanel } from '@backstage/core-components';
import { identityApiRef, useApi } from '@backstage/core-plugin-api';
import { usePermission } from '@backstage/plugin-permission-react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import {
  ENTITY_REF_RE,
  Project,
  x2aAdminWritePermission,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { useClientService } from '../../ClientService';
import { useTranslation } from '../../hooks/useTranslation';
import { extractResponseError } from '../tools';

export const EditProjectDialog = ({
  open,
  onClose,
  onUpdated,
  project,
}: {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  project: Project;
}) => {
  const { t } = useTranslation();
  const clientService = useClientService();
  const identityApi = useApi(identityApiRef);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(project.name);
  const [ownedBy, setOwnedBy] = useState(project.ownedBy);
  const [description, setDescription] = useState(project.description ?? '');
  const [error, setError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOwnerConfirm, setShowOwnerConfirm] = useState(false);

  const { allowed: isAdmin } = usePermission({
    permission: x2aAdminWritePermission,
  });
  const { value: identity } = useAsync(
    () => identityApi.getBackstageIdentity(),
    [identityApi],
  );

  const ownerOptions = useMemo(() => {
    const refs = [...(identity?.ownershipEntityRefs ?? [])];
    if (project.ownedBy && !refs.includes(project.ownedBy)) {
      refs.unshift(project.ownedBy);
    }
    return refs;
  }, [identity?.ownershipEntityRefs, project.ownedBy]);

  useEffect(() => {
    if (open) {
      setName(project.name);
      setOwnedBy(project.ownedBy);
      setDescription(project.description ?? '');
      setError(null);
      setShowOwnerConfirm(false);
    }
  }, [open, project]);

  const trimmedName = name.trim();
  const trimmedOwnedBy = ownedBy.trim();
  const trimmedDescription = description.trim();

  const hasChanges =
    trimmedName !== project.name ||
    trimmedOwnedBy !== project.ownedBy ||
    trimmedDescription !== (project.description ?? '');

  const ownerChanged = trimmedOwnedBy !== project.ownedBy;

  const nameError = trimmedName.length === 0;
  const ownedByError =
    trimmedOwnedBy.length === 0 || !ENTITY_REF_RE.test(trimmedOwnedBy);
  const hasValidationErrors = nameError || ownedByError;

  const submitUpdate = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const body: { name?: string; ownedBy?: string; description?: string } =
        {};
      if (trimmedName !== project.name) body.name = trimmedName;
      if (trimmedOwnedBy !== project.ownedBy) body.ownedBy = trimmedOwnedBy;
      if (trimmedDescription !== (project.description ?? ''))
        body.description = trimmedDescription;

      const response = await clientService.projectsProjectIdPatch({
        path: { projectId: project.id },
        body,
      });

      if (!response.ok) {
        const message = await extractResponseError(
          response,
          t('editProjectDialog.updateError'),
        );
        setError(new Error(message));
        return;
      }

      onClose();
      onUpdated();
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsSubmitting(false);
      setShowOwnerConfirm(false);
    }
  };

  const handleUpdate = async () => {
    if (ownerChanged) {
      setShowOwnerConfirm(true);
      return;
    }
    await submitUpdate();
  };

  return (
    <>
      <Dialog
        open={open && !showOwnerConfirm}
        onClose={onClose}
        aria-labelledby="edit-project-dialog-title"
        fullWidth
        maxWidth="sm"
        TransitionProps={{
          onEntered: () => nameInputRef.current?.focus(),
        }}
      >
        <DialogTitle id="edit-project-dialog-title">
          {t('editProjectDialog.title')}
        </DialogTitle>
        <DialogContent>
          {error && <ResponseErrorPanel error={error} />}
          <TextField
            inputRef={nameInputRef}
            margin="dense"
            label={t('projectDetailsCard.name')}
            fullWidth
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={isSubmitting}
            error={nameError}
            helperText={nameError ? t('editProjectDialog.nameRequired') : ''}
          />
          <Autocomplete
            freeSolo={isAdmin}
            disableClearable
            options={ownerOptions}
            value={ownedBy}
            onChange={(_, newValue) => setOwnedBy((newValue as string) || '')}
            {...(isAdmin
              ? {
                  inputValue: ownedBy,
                  onInputChange: (_: unknown, newValue: string) =>
                    setOwnedBy(newValue),
                }
              : {})}
            disabled={isSubmitting}
            renderInput={params => (
              <TextField
                {...params}
                margin="dense"
                label={t('projectDetailsCard.ownedBy')}
                error={ownedByError}
                helperText={
                  ownedByError || isAdmin
                    ? t('editProjectDialog.ownerFormatHint')
                    : ''
                }
              />
            )}
          />
          <TextField
            margin="dense"
            label={t('projectDetailsCard.description')}
            fullWidth
            multiline
            minRows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={isSubmitting}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant="outlined" disabled={isSubmitting}>
            {t('editProjectDialog.cancel')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpdate}
            disabled={isSubmitting || !hasChanges || hasValidationErrors}
          >
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : (
              t('editProjectDialog.update')
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={open && showOwnerConfirm}
        onClose={() => setShowOwnerConfirm(false)}
        aria-labelledby="owner-change-confirm-title"
        maxWidth="xs"
      >
        <DialogTitle id="owner-change-confirm-title">
          {t('editProjectDialog.ownerChangeWarningTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('editProjectDialog.ownerChangeWarning')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowOwnerConfirm(false)}
            variant="outlined"
            disabled={isSubmitting}
          >
            {t('editProjectDialog.cancel')}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={submitUpdate}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : (
              t('editProjectDialog.ownerChangeConfirm')
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
