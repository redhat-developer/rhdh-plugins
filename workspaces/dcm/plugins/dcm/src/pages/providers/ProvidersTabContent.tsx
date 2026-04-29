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

import { useMemo, useState } from 'react';
import { TableColumn } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { Box, Chip, Tooltip, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  nameCellBox: {
    minWidth: 0,
  },
  serviceTypeChip: {
    maxWidth: 160,
    overflow: 'hidden',
  },
  operationsCellBox: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  moreOpsChip: {
    cursor: 'default',
  },
}));
import type {
  Provider,
  ServiceType,
} from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { catalogApiRef, providersApiRef } from '../../apis';
import { DcmCrudTabLayout } from '../../components/DcmCrudTabLayout';
import { DcmDeleteDialog } from '../../components/DcmDeleteDialog';
import { DcmErrorSnackbar } from '../../components/DcmErrorSnackbar';
import { DcmFormDialog } from '../../components/DcmFormDialog';
import { DcmFormDialogActions } from '../../components/DcmFormDialogActions';
import { createEditDeleteColumn } from '../../components/dcmTabListHelpers';
import { DcmEmptyCell, TruncatedText } from '../../components/TruncatedText';
import { useCrudTab } from '../../hooks/useCrudTab';
import emptyIllustration from '../../assets/environments-empty-state.png';
import { CopyButton } from './components/CopyButton';
import { ProviderFormFields } from './components/ProviderFormFields';
import { ProviderStatus } from './components/ProviderStatus';
import {
  emptyProviderForm,
  formToProvider,
  isProviderFormValid,
  nameToDisplayName,
  providerToForm,
} from './providerFormTypes';
import type { ProviderForm } from './providerFormTypes';

export function ProvidersTabContent() {
  const classes = useStyles();
  const providersApi = useApi(providersApiRef);
  const catalogApi = useApi(catalogApiRef);

  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);

  const crud = useCrudTab<Provider, ProviderForm>({
    loadFn: async () => {
      const [providerList, serviceTypeList] = await Promise.all([
        providersApi.listProviders().then(r => r.providers ?? []),
        catalogApi.listServiceTypes().then(r => r.results ?? []),
      ]);
      setServiceTypes(serviceTypeList);
      return providerList;
    },
    createFn: form => providersApi.createProvider(formToProvider(form)),
    updateFn: (id, form) =>
      providersApi.applyProvider(id, formToProvider(form)),
    deleteFn: id => providersApi.deleteProvider(id),
    getId: p => p.id ?? p.name ?? '',
    getSearchText: p => [p.name, p.display_name, p.service_type, p.endpoint],
    emptyForm: emptyProviderForm,
    isValid: isProviderFormValid,
    itemToForm: providerToForm,
    storageKey: 'providers',
  });

  const columns = useMemo<TableColumn<Provider>[]>(
    () => [
      {
        title: 'Display name',
        field: 'display_name',
        render: p => (
          <Box className={classes.nameCellBox}>
            <TruncatedText
              text={p.display_name ?? nameToDisplayName(p.name ?? '')}
              variant="body2"
              bold
              maxWidth={200}
              fallback={<DcmEmptyCell />}
            />
            {p.id && (
              <TruncatedText
                text={p.id}
                variant="caption"
                color="textSecondary"
                bold={false}
                maxWidth={200}
                fallback={<DcmEmptyCell />}
              />
            )}
          </Box>
        ),
      },
      {
        title: 'Name',
        field: 'name',
        render: p => (
          <TruncatedText
            text={p.name}
            variant="body2"
            color="textSecondary"
            bold={false}
            maxWidth={180}
            fallback={<DcmEmptyCell />}
          />
        ),
      },
      {
        title: 'Endpoint',
        field: 'endpoint',
        render: p => (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            width="100%"
          >
            <TruncatedText
              text={p.endpoint}
              variant="body2"
              bold={false}
              maxWidth={180}
              fallback={<DcmEmptyCell />}
            />
            {p.endpoint && <CopyButton text={p.endpoint} />}
          </Box>
        ),
      },
      {
        title: 'Service type',
        field: 'service_type',
        render: p => (
          <Chip
            label={p.service_type}
            size="small"
            className={classes.serviceTypeChip}
          />
        ),
      },
      {
        title: 'Operations',
        field: 'operations',
        sorting: false,
        render: p => {
          const raw: unknown = p.operations;
          let ops: string[];
          if (Array.isArray(raw)) {
            ops = raw as string[];
          } else if (typeof raw === 'string' && raw.trim()) {
            ops = raw
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean);
          } else {
            ops = [];
          }

          if (ops.length === 0) {
            return (
              <Typography variant="caption" color="textSecondary">
                —
              </Typography>
            );
          }

          const VISIBLE = 2;
          const visible = ops.slice(0, VISIBLE);
          const rest = ops.slice(VISIBLE);

          return (
            <Box className={classes.operationsCellBox}>
              {visible.map(op => (
                <Chip key={op} label={op} size="small" variant="outlined" />
              ))}
              {rest.length > 0 && (
                <Tooltip
                  title={rest.join(', ')}
                  placement="top"
                  enterDelay={200}
                >
                  <Chip
                    label={`+${rest.length}`}
                    size="small"
                    className={classes.moreOpsChip}
                  />
                </Tooltip>
              )}
            </Box>
          );
        },
      },
      {
        title: 'Status',
        field: 'health_status',
        render: p => <ProviderStatus value={p.health_status} />,
      },
      createEditDeleteColumn<Provider>({
        onEdit: crud.handleOpenEdit,
        onDelete: crud.handleOpenDelete,
      }),
    ],
    [classes, crud.handleOpenEdit, crud.handleOpenDelete],
  );

  type ProviderDialogProps = {
    title: string;
    open: boolean;
    onClose: () => void;
    form: ProviderForm;
    setForm: React.Dispatch<React.SetStateAction<ProviderForm>>;
    touched: Partial<Record<keyof ProviderForm, boolean>>;
    setTouched: React.Dispatch<
      React.SetStateAction<Partial<Record<keyof ProviderForm, boolean>>>
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
  }: ProviderDialogProps) => (
    <DcmFormDialog
      open={open}
      onClose={onClose}
      title={title}
      submitting={submitting}
      error={error}
      actions={
        <DcmFormDialogActions
          onSubmit={onSubmit}
          onCancel={onClose}
          submitLabel={submitLabel}
          submitting={submitting}
          disabled={!isProviderFormValid(form)}
        />
      }
    >
      <ProviderFormFields
        form={form}
        setForm={setForm}
        serviceTypes={serviceTypes}
        touched={touched}
        setTouched={setTouched}
      />
    </DcmFormDialog>
  );

  return (
    <>
      <DcmCrudTabLayout<Provider>
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
        emptyTitle="No providers registered"
        emptyDescription="Register a service provider to allow DCM to provision resources on external infrastructure (e.g. OpenShift, AWS)."
        primaryActionLabel="Register"
        onPrimaryAction={crud.handleOpenCreate}
        illustrationSrc={emptyIllustration}
        entityLabel="Providers"
      />

      {formDialog({
        title: 'Register provider',
        open: crud.createOpen,
        onClose: crud.handleCloseCreate,
        form: crud.createForm,
        setForm: crud.setCreateForm,
        touched: crud.createTouched,
        setTouched: crud.setCreateTouched,
        onSubmit: crud.handleCreateSubmit,
        submitLabel: 'Register',
        submitting: crud.createSubmitting,
        error: crud.createError,
      })}

      {formDialog({
        title: 'Edit provider',
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
          crud.deletingItem?.display_name ?? crud.deletingItem?.name ?? ''
        }
        resourceLabel="provider"
      />

      <DcmErrorSnackbar
        error={crud.deleteError}
        onClose={() => crud.setDeleteError(null)}
      />
    </>
  );
}
