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

import { useCallback, useMemo, useState } from 'react';
import { TableColumn } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Switch,
  Tooltip,
  Typography,
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  /** Name cell — allows TruncatedText to clamp correctly inside a flex table cell. */
  nameCellBox: {
    minWidth: 0,
  },
  /** Actions cell — flex row holding the toggle switch, edit and delete buttons. */
  actionsCellBox: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  /** Wraps the Switch/Spinner so Tooltip can attach to a real DOM element. */
  toggleSpan: {
    display: 'flex',
    alignItems: 'center',
  },
  /** Spinner shown while a toggle request is in-flight. */
  toggleSpinner: {
    margin: theme.spacing(0, 1),
  },
}));
import type { Policy } from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { policyManagerApiRef } from '../../apis';
import { DcmCrudTabLayout } from '../../components/DcmCrudTabLayout';
import { DcmDeleteDialog } from '../../components/DcmDeleteDialog';
import { DcmErrorSnackbar } from '../../components/DcmErrorSnackbar';
import { DcmFormDialog } from '../../components/DcmFormDialog';
import { DcmFormDialogActions } from '../../components/DcmFormDialogActions';
import { DcmEmptyCell, TruncatedText } from '../../components/TruncatedText';
import { useCrudTab } from '../../hooks/useCrudTab';
import emptyIllustration from '../../assets/environments-empty-state.png';
import { PolicyFormFields } from './components/PolicyFormFields';
import {
  emptyPolicyForm,
  formToPolicy,
  isPolicyFormValid,
  policyToForm,
} from './policyFormTypes';
import type { PolicyForm } from './policyFormTypes';

// Module-level state-updater factories — defined outside the component so they
// do not contribute to lexical function-nesting depth (typescript:S2004).

function addTogglingId(id: string) {
  return (prev: Set<string>) => new Set(prev).add(id);
}

function removeTogglingId(id: string) {
  return (prev: Set<string>) => {
    const next = new Set(prev);
    next.delete(id);
    return next;
  };
}

function replacePolicyById(id: string, updated: Policy) {
  return (prev: Policy[]) => prev.map(pol => (pol.id === id ? updated : pol));
}

export function PoliciesTabContent() {
  const classes = useStyles();
  const policyApi = useApi(policyManagerApiRef);

  /** IDs currently being toggled (to show per-row spinner). */
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const crud = useCrudTab<Policy, PolicyForm>({
    loadFn: () => policyApi.listPolicies().then(res => res.policies ?? []),
    createFn: form => policyApi.createPolicy(formToPolicy(form)),
    updateFn: (id, form) => policyApi.updatePolicy(id, formToPolicy(form)),
    deleteFn: id => policyApi.deletePolicy(id),
    getId: p => p.id ?? '',
    getSearchText: p => [p.display_name, p.description, p.policy_type],
    emptyForm: emptyPolicyForm,
    isValid: isPolicyFormValid,
    itemToForm: policyToForm,
    storageKey: 'policies',
  });

  const { setItems, handleOpenEdit, handleOpenDelete } = crud;

  const handleToggleEnabled = useCallback(
    async (p: Policy) => {
      const id = p.id;
      if (!id) return;
      setTogglingIds(addTogglingId(id));
      try {
        const updated = await policyApi.updatePolicy(id, {
          enabled: !p.enabled,
        });
        setItems(replacePolicyById(id, updated));
      } catch {
        // noop — leave the displayed value unchanged on failure
      } finally {
        setTogglingIds(removeTogglingId(id));
      }
    },
    [policyApi, setItems],
  );

  const columns = useMemo<TableColumn<Policy>[]>(
    () => [
      {
        title: 'Display name',
        field: 'display_name',
        render: p => (
          <Box className={classes.nameCellBox}>
            <TruncatedText
              text={p.display_name || '—'}
              variant="body2"
              bold
              maxWidth={220}
              fallback={<DcmEmptyCell />}
            />
            <TruncatedText
              text={p.id ?? ''}
              variant="caption"
              color="textSecondary"
              bold={false}
              maxWidth={220}
              fallback={<DcmEmptyCell />}
            />
          </Box>
        ),
      },
      {
        title: 'Type',
        field: 'policy_type',
        render: p => <Chip label={p.policy_type ?? '—'} size="small" />,
      },
      {
        title: 'Priority',
        field: 'priority',
        render: p => (
          <Typography variant="body2">{p.priority ?? 500}</Typography>
        ),
      },
      {
        title: 'Enabled',
        field: 'enabled',
        render: p => {
          const isEnabled = p.enabled === true;
          return (
            <Chip
              label={isEnabled ? 'Yes' : 'No'}
              size="small"
              color={isEnabled ? 'primary' : 'default'}
            />
          );
        },
      },
      {
        title: 'Description',
        field: 'description',
        sorting: false,
        render: p => (
          <TruncatedText
            text={p.description}
            variant="body2"
            color="textSecondary"
            bold={false}
            maxWidth={260}
            fallback={<DcmEmptyCell />}
          />
        ),
      },
      {
        title: 'Actions',
        field: 'actions',
        sorting: false,
        render: p => {
          const id = p.id ?? '';
          const isToggling = togglingIds.has(id);
          const isEnabled = p.enabled !== false;
          return (
            <Box className={classes.actionsCellBox}>
              <Tooltip
                title={isEnabled ? 'Disable policy' : 'Enable policy'}
                placement="top"
              >
                <Typography
                  component="span"
                  variant="inherit"
                  className={classes.toggleSpan}
                >
                  {isToggling ? (
                    <CircularProgress
                      size={16}
                      className={classes.toggleSpinner}
                    />
                  ) : (
                    <Switch
                      size="small"
                      checked={isEnabled}
                      onChange={() => handleToggleEnabled(p)}
                      disabled={isToggling}
                      color="primary"
                      inputProps={{
                        'aria-label': isEnabled ? 'Disable' : 'Enable',
                      }}
                    />
                  )}
                </Typography>
              </Tooltip>
              <Tooltip title="Edit" placement="top">
                <IconButton
                  size="small"
                  aria-label="Edit"
                  onClick={() => handleOpenEdit(p)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete" placement="top">
                <IconButton
                  size="small"
                  aria-label="Delete"
                  onClick={() => handleOpenDelete(p)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
    ],
    [
      classes,
      togglingIds,
      handleToggleEnabled,
      handleOpenEdit,
      handleOpenDelete,
    ],
  );

  type PolicyDialogProps = {
    title: string;
    open: boolean;
    onClose: () => void;
    form: PolicyForm;
    setForm: React.Dispatch<React.SetStateAction<PolicyForm>>;
    touched: Partial<Record<keyof PolicyForm, boolean>>;
    setTouched: React.Dispatch<
      React.SetStateAction<Partial<Record<keyof PolicyForm, boolean>>>
    >;
    onSubmit: () => void;
    submitLabel: string;
    submitting: boolean;
    error: string | null;
  };

  const formDialog = ({
    title,
    open,
    onClose,
    form,
    setForm,
    touched,
    setTouched,
    onSubmit,
    submitLabel,
    submitting,
    error,
  }: PolicyDialogProps) => (
    <DcmFormDialog
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="md"
      submitting={submitting}
      error={error}
      actions={
        <DcmFormDialogActions
          onSubmit={onSubmit}
          onCancel={onClose}
          submitLabel={submitLabel}
          submitting={submitting}
          disabled={!isPolicyFormValid(form)}
        />
      }
    >
      <PolicyFormFields
        form={form}
        setForm={setForm}
        touched={touched}
        setTouched={setTouched}
      />
    </DcmFormDialog>
  );

  return (
    <>
      <DcmCrudTabLayout<Policy>
        items={crud.items}
        filtered={crud.filtered}
        paginated={crud.paginated}
        columns={columns}
        loading={crud.loading}
        loadError={crud.loadError}
        onRetry={crud.reload}
        search={crud.search}
        onSearchChange={crud.setSearch}
        page={crud.page}
        pageSize={crud.pageSize}
        onPageChange={crud.onPageChange}
        onRowsPerPageChange={crud.onRowsPerPageChange}
        emptyTitle="No policies defined"
        emptyDescription="Create OPA Rego policies to enforce governance rules on DCM resources. Policies can be scoped globally or per user."
        primaryActionLabel="Create"
        onPrimaryAction={crud.handleOpenCreate}
        illustrationSrc={emptyIllustration}
        entityLabel="Policies"
      />

      {formDialog({
        title: 'Create policy',
        open: crud.createOpen,
        onClose: crud.handleCloseCreate,
        form: crud.createForm,
        setForm: crud.setCreateForm,
        touched: crud.createTouched,
        setTouched: crud.setCreateTouched,
        onSubmit: crud.handleCreateSubmit,
        submitLabel: 'Create',
        submitting: crud.createSubmitting,
        error: crud.createError,
      })}

      {formDialog({
        title: 'Edit policy',
        open: crud.editOpen,
        onClose: crud.handleCloseEdit,
        form: crud.editForm,
        setForm: crud.setEditForm,
        touched: crud.editTouched,
        setTouched: crud.setEditTouched,
        onSubmit: crud.handleEditSubmit,
        submitLabel: 'Save',
        submitting: crud.editSubmitting,
        error: crud.editError,
      })}

      <DcmDeleteDialog
        open={crud.deleteOpen}
        onClose={crud.handleCloseDelete}
        onConfirm={crud.handleDeleteConfirm}
        resourceName={
          crud.deletingItem?.display_name ?? crud.deletingItem?.id ?? ''
        }
        resourceLabel="policy"
      />

      <DcmErrorSnackbar
        error={crud.deleteError}
        onClose={() => crud.setDeleteError(null)}
      />
    </>
  );
}
