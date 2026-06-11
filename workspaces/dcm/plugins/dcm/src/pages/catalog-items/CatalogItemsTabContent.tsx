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
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Drawer,
  IconButton,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import MuiAlert from '@material-ui/lab/Alert';
import CloseIcon from '@material-ui/icons/Close';

const useStyles = makeStyles(theme => ({
  apiVersionChip: {
    maxWidth: 140,
  },
  serviceTypeChip: {
    maxWidth: 160,
  },
  drawer: {
    width: 680,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(2, 3),
    borderBottom: `1px solid ${theme.palette.divider}`,
    flexShrink: 0,
  },
  drawerContent: {
    flex: 1,
    overflowY: 'auto',
    padding: theme.spacing(3),
  },
  drawerErrorBanner: {
    marginTop: theme.spacing(2),
  },
  drawerFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(1),
    padding: theme.spacing(2, 3),
    borderTop: `1px solid ${theme.palette.divider}`,
    flexShrink: 0,
  },
}));

import type {
  CatalogItem,
  ServiceType,
} from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { catalogApiRef } from '../../apis';
import { DcmCrudTabLayout } from '../../components/DcmCrudTabLayout';
import { DcmDeleteDialog } from '../../components/DcmDeleteDialog';
import { DcmSuccessSnackbar } from '../../components/DcmSuccessSnackbar';
import { createEditDeleteColumn } from '../../components/dcmTabListHelpers';
import { DcmEmptyCell, TruncatedText } from '../../components/TruncatedText';
import { useCrudTab } from '../../hooks/useCrudTab';
import { useTranslation } from '../../hooks/useTranslation';
import emptyIllustration from '../../assets/environments-empty-state.png';
import { CatalogItemFormFields } from './components/CatalogItemFormFields';
import {
  catalogItemToForm,
  emptyCatalogItemForm,
  formToCatalogItem,
  formToCatalogItemForUpdate,
  isCatalogItemFormValid,
} from './catalogItemFormTypes';
import type { CatalogItemForm } from './catalogItemFormTypes';

export function CatalogItemsTabContent() {
  const classes = useStyles();
  const catalogApi = useApi(catalogApiRef);
  const { t } = useTranslation();

  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  /** Tracks whether a submit was attempted so field-level errors show for all fields. */
  const [createSubmitAttempted, setCreateSubmitAttempted] = useState(false);
  const [editSubmitAttempted, setEditSubmitAttempted] = useState(false);

  const crud = useCrudTab<CatalogItem, CatalogItemForm>({
    loadFn: async () => {
      const [itemList, serviceTypeList] = await Promise.all([
        catalogApi.listCatalogItems().then(r => r.results ?? []),
        catalogApi.listServiceTypes().then(r => r.results ?? []),
      ]);
      setServiceTypes(serviceTypeList);
      return itemList;
    },
    createFn: form => catalogApi.createCatalogItem(formToCatalogItem(form)),
    updateFn: (id, form) =>
      catalogApi.updateCatalogItem(id, formToCatalogItemForUpdate(form)),
    deleteFn: id => catalogApi.deleteCatalogItem(id),
    getId: item => item.uid ?? '',
    getSearchText: item => [
      item.display_name,
      item.spec?.service_type,
      item.uid,
    ],
    emptyForm: emptyCatalogItemForm,
    isValid: isCatalogItemFormValid,
    itemToForm: catalogItemToForm,
    storageKey: 'catalog-items',
    createSuccessMessage: t('catalogItems.createSuccess'),
    editSuccessMessage: t('catalogItems.updateSuccess'),
    deleteSuccessMessage: t('catalogItems.deleteSuccess'),
  });

  const columns = useMemo<TableColumn<CatalogItem>[]>(
    () => [
      {
        title: t('catalogItems.columns.displayName'),
        field: 'display_name',
        render: item => (
          <TruncatedText
            text={item.display_name || t('common.emDash')}
            variant="body2"
            bold
            maxWidth={220}
            fallback={<DcmEmptyCell />}
          />
        ),
      },
      {
        title: t('catalogItems.columns.apiVersion'),
        field: 'api_version',
        render: item =>
          item.api_version ? (
            <Chip
              label={item.api_version}
              size="small"
              className={classes.apiVersionChip}
            />
          ) : (
            <Typography variant="caption" color="textSecondary">
              {t('common.emDash')}
            </Typography>
          ),
      },
      {
        title: t('catalogItems.columns.serviceType'),
        field: 'spec.service_type',
        render: item =>
          item.spec?.service_type ? (
            <Chip
              label={item.spec.service_type}
              size="small"
              variant="outlined"
              className={classes.serviceTypeChip}
            />
          ) : (
            <Typography variant="caption" color="textSecondary">
              {t('common.emDash')}
            </Typography>
          ),
      },
      {
        title: t('catalogItems.columns.fields'),
        field: 'spec.fields',
        sorting: false,
        render: item => {
          const count = item.spec?.fields?.length ?? 0;
          return (
            <Typography variant="body2" color="textSecondary">
              {count === 1
                ? t('catalogItems.fieldCount.one')
                : (t as any)('catalogItems.fieldCount.other', { count })}
            </Typography>
          );
        },
      },
      {
        title: t('catalogItems.columns.created'),
        field: 'create_time',
        render: item =>
          item.create_time ? (
            <Typography variant="body2">
              {new Date(item.create_time).toLocaleDateString()}
            </Typography>
          ) : (
            <Typography variant="caption" color="textSecondary">
              {t('common.emDash')}
            </Typography>
          ),
      },
      createEditDeleteColumn<CatalogItem>({
        onEdit: crud.handleOpenEdit,
        onDelete: crud.handleOpenDelete,
        title: t('common.actions'),
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [classes, crud.handleOpenEdit, crud.handleOpenDelete, t],
  );

  type ScalarTouched = Partial<
    Record<Exclude<keyof CatalogItemForm, 'fields'>, boolean>
  >;

  type CatalogItemDrawerProps = {
    title: string;
    open: boolean;
    onClose: () => void;
    form: CatalogItemForm;
    setForm: React.Dispatch<React.SetStateAction<CatalogItemForm>>;
    touched: Partial<Record<keyof CatalogItemForm, boolean>>;
    setTouched: React.Dispatch<
      React.SetStateAction<Partial<Record<keyof CatalogItemForm, boolean>>>
    >;
    onSubmit: () => void;
    submitLabel: string;
    submitting: boolean;
    error: string | null;
    submitAttempted: boolean;
    isEditMode: boolean;
  };

  const itemFormDrawer = ({
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
    submitAttempted,
    isEditMode,
  }: CatalogItemDrawerProps) => (
    <Drawer
      anchor="right"
      open={open}
      onClose={submitting || Boolean(error) ? undefined : onClose}
    >
      <Box className={classes.drawer}>
        <Box className={classes.drawerHeader}>
          <Typography variant="h6">{title}</Typography>
          <IconButton
            size="small"
            aria-label={t('common.close')}
            onClick={onClose}
            disabled={submitting}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Box className={classes.drawerContent}>
          <CatalogItemFormFields
            form={form}
            setForm={setForm}
            serviceTypes={serviceTypes}
            touched={touched as ScalarTouched}
            setTouched={
              setTouched as React.Dispatch<React.SetStateAction<ScalarTouched>>
            }
            submitAttempted={submitAttempted}
            isEditMode={isEditMode}
          />
          <Collapse in={Boolean(error)} className={classes.drawerErrorBanner}>
            <MuiAlert severity="error" variant="outlined">
              {error}
            </MuiAlert>
          </Collapse>
        </Box>

        <Box className={classes.drawerFooter}>
          <Button
            variant="contained"
            color="primary"
            onClick={onSubmit}
            disabled={submitting}
            startIcon={
              submitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
          >
            {submitting ? t('common.saving') : submitLabel}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={onClose}
            disabled={submitting}
          >
            {t('common.cancel')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );

  return (
    <>
      <DcmCrudTabLayout<CatalogItem>
        items={crud.items}
        filtered={crud.filtered}
        paginated={crud.paginated}
        columns={columns}
        loading={crud.loading}
        loadError={crud.loadError}
        onRetry={crud.reload}
        actionError={null}
        onDismissActionError={undefined}
        search={crud.search}
        onSearchChange={crud.setSearch}
        page={crud.page}
        pageSize={crud.pageSize}
        onPageChange={crud.onPageChange}
        onRowsPerPageChange={crud.onRowsPerPageChange}
        emptyTitle={t('catalogItems.emptyTitle')}
        emptyDescription={t('catalogItems.emptyDescription')}
        primaryActionLabel={t('catalogItems.createButton')}
        onPrimaryAction={() => {
          setCreateSubmitAttempted(false);
          crud.handleOpenCreate();
        }}
        illustrationSrc={emptyIllustration}
        entityLabel={t('catalogItems.entityLabel')}
      />

      {itemFormDrawer({
        title: t('catalogItems.createDrawerTitle'),
        open: crud.createOpen,
        onClose: () => {
          setCreateSubmitAttempted(false);
          crud.handleCloseCreate();
        },
        form: crud.createForm,
        setForm: crud.setCreateForm,
        touched: crud.createTouched,
        setTouched: crud.setCreateTouched,
        onSubmit: () => {
          setCreateSubmitAttempted(true);
          crud.handleCreateSubmit();
        },
        submitLabel: t('catalogItems.createButton'),
        submitting: crud.createSubmitting,
        error: crud.createError,
        submitAttempted: createSubmitAttempted,
        isEditMode: false,
      })}

      {itemFormDrawer({
        title: t('catalogItems.editDrawerTitle'),
        open: crud.editOpen,
        onClose: () => {
          setEditSubmitAttempted(false);
          crud.handleCloseEdit();
        },
        form: crud.editForm,
        setForm: crud.setEditForm,
        touched: crud.editTouched,
        setTouched: crud.setEditTouched,
        onSubmit: () => {
          setEditSubmitAttempted(true);
          crud.handleEditSubmit();
        },
        submitLabel: t('catalogItems.saveButton'),
        submitting: crud.editSubmitting,
        error: crud.editError,
        submitAttempted: editSubmitAttempted,
        isEditMode: true,
      })}

      <DcmDeleteDialog
        open={crud.deleteOpen}
        onClose={crud.handleCloseDelete}
        onConfirm={crud.handleDeleteConfirm}
        resourceName={
          crud.deletingItem?.display_name ?? crud.deletingItem?.uid ?? ''
        }
        resourceLabel={t('catalogItems.deleteLabel')}
        error={crud.deleteError}
        isSubmitting={crud.deleteSubmitting}
      />

      <DcmSuccessSnackbar
        message={crud.successMessage}
        onClose={crud.clearSuccessMessage}
      />
    </>
  );
}
