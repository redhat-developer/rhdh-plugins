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
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import DeleteIcon from '@material-ui/icons/Delete';
import type {
  CatalogItem,
  CatalogItemInstance,
} from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { extractApiError } from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { catalogApiRef } from '../../apis';
import { DcmCrudTabLayout } from '../../components/DcmCrudTabLayout';
import { DcmDeleteDialog } from '../../components/DcmDeleteDialog';
import { DcmSuccessSnackbar } from '../../components/DcmSuccessSnackbar';
import { DcmFormDialog } from '../../components/DcmFormDialog';
import { DcmFormDialogActions } from '../../components/DcmFormDialogActions';
import { DcmEmptyCell, TruncatedText } from '../../components/TruncatedText';
import { useCrudTab } from '../../hooks/useCrudTab';
import { useTranslation } from '../../hooks/useTranslation';
import emptyIllustration from '../../assets/environments-empty-state.png';
import { InstanceFormFields } from './components/InstanceFormFields';
import {
  emptyInstanceForm,
  formToInstance,
  isInstanceFormValid,
} from './instanceFormTypes';
import type { InstanceForm } from './instanceFormTypes';

const useStyles = makeStyles(() => ({
  catalogItemChip: {
    maxWidth: 180,
  },
  apiVersionChip: {
    maxWidth: 140,
  },
  actionsCell: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 4,
  },
  /** Lets Tooltip wrap disabled IconButton (ref + layout) without raw `<span>`. */
  tooltipTrigger: {
    display: 'inline-flex',
  },
}));

export function CatalogItemInstancesTabContent() {
  const classes = useStyles();
  const catalogApi = useApi(catalogApiRef);
  const { t } = useTranslation();

  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [rehydratingId, setRehydratingId] = useState<string | null>(null);
  const [rehydrateError, setRehydrateError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rehydrateConfirmInst, setRehydrateConfirmInst] =
    useState<CatalogItemInstance | null>(null);

  const crud = useCrudTab<CatalogItemInstance, InstanceForm>({
    loadFn: async () => {
      const [instanceList, itemList] = await Promise.all([
        catalogApi.listCatalogItemInstances().then(r => r.results ?? []),
        catalogApi.listCatalogItems().then(r => r.results ?? []),
      ]);
      setCatalogItems(itemList);
      return instanceList;
    },
    createFn: form =>
      catalogApi.createCatalogItemInstance(formToInstance(form)),
    deleteFn: id => catalogApi.deleteCatalogItemInstance(id),
    getId: inst => inst.uid ?? '',
    getSearchText: inst => [
      inst.display_name,
      inst.spec?.catalog_item_id,
      inst.uid,
      inst.resource_id,
    ],
    emptyForm: emptyInstanceForm,
    isValid: isInstanceFormValid,
    storageKey: 'catalog-item-instances',
  });

  const { handleOpenDelete, setItems } = crud;

  const executeRehydrate = useCallback(
    async (inst: CatalogItemInstance) => {
      const id = inst.uid ?? '';
      if (!id) return;
      setRehydratingId(id);
      setRehydrateError(null);
      setSuccessMessage(null);
      try {
        const updated = await catalogApi.rehydrateCatalogItemInstance(id);
        setItems(prev => prev.map(row => (row.uid === id ? updated : row)));
        setSuccessMessage(t('instances.rehydrateSuccess'));
      } catch (err) {
        setRehydrateError(extractApiError(err));
      } finally {
        setRehydratingId(null);
      }
    },
    [catalogApi, setItems, t],
  );

  const handleRehydrate = useCallback((inst: CatalogItemInstance) => {
    setRehydrateConfirmInst(inst);
  }, []);

  const catalogItemName = useCallback(
    (id: string) => {
      const item = catalogItems.find(ci => ci.uid === id);
      return item?.display_name ?? id;
    },
    [catalogItems],
  );

  const columns = useMemo<TableColumn<CatalogItemInstance>[]>(
    () => [
      {
        title: t('instances.columns.displayName'),
        field: 'display_name',
        render: inst => (
          <TruncatedText
            text={inst.display_name}
            variant="body2"
            bold
            maxWidth={220}
            fallback={<DcmEmptyCell />}
          />
        ),
      },
      {
        title: t('instances.columns.catalogItem'),
        field: 'spec.catalog_item_id',
        render: inst => (
          <Chip
            label={catalogItemName(inst.spec?.catalog_item_id ?? '')}
            size="small"
            variant="outlined"
            className={classes.catalogItemChip}
          />
        ),
      },
      {
        title: t('instances.columns.resourceId'),
        field: 'resource_id',
        render: inst => (
          <TruncatedText
            text={inst.resource_id}
            variant="body2"
            color="textSecondary"
            bold={false}
            maxWidth={180}
            fallback={<DcmEmptyCell />}
          />
        ),
      },
      {
        title: t('instances.columns.apiVersion'),
        field: 'api_version',
        render: inst => (
          <Chip
            label={inst.api_version}
            size="small"
            className={classes.apiVersionChip}
          />
        ),
      },
      {
        title: t('instances.columns.created'),
        field: 'create_time',
        render: inst =>
          inst.create_time ? (
            <Typography variant="body2">
              {new Date(inst.create_time).toLocaleDateString()}
            </Typography>
          ) : (
            <Typography variant="caption" color="textSecondary">
              -
            </Typography>
          ),
      },
      {
        title: t('common.actions'),
        field: 'actions',
        sorting: false,
        width: '120px',
        render: inst => {
          const busy = rehydratingId === inst.uid;
          return (
            <Box className={classes.actionsCell}>
              <Tooltip title={t('instances.rehydrateTooltip')}>
                <Typography
                  component="span"
                  variant="inherit"
                  className={classes.tooltipTrigger}
                >
                  <IconButton
                    size="small"
                    aria-label={t('instances.rehydrateAriaLabel')}
                    disabled={busy}
                    onClick={() => handleRehydrate(inst)}
                  >
                    <AutorenewIcon fontSize="small" />
                  </IconButton>
                </Typography>
              </Tooltip>
              <Tooltip title={t('instances.deleteTooltip')}>
                <Typography
                  component="span"
                  variant="inherit"
                  className={classes.tooltipTrigger}
                >
                  <IconButton
                    size="small"
                    aria-label={t('instances.deleteAriaLabel')}
                    disabled={busy}
                    onClick={() => handleOpenDelete(inst)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Typography>
              </Tooltip>
            </Box>
          );
        },
      },
    ],
    [
      classes,
      handleOpenDelete,
      handleRehydrate,
      catalogItemName,
      rehydratingId,
      t,
    ],
  );

  type ScalarTouched = Partial<
    Record<Exclude<keyof InstanceForm, 'user_values'>, boolean>
  >;

  return (
    <>
      <DcmCrudTabLayout<CatalogItemInstance>
        items={crud.items}
        filtered={crud.filtered}
        paginated={crud.paginated}
        columns={columns}
        loading={crud.loading}
        loadError={crud.loadError}
        onRetry={crud.reload}
        actionError={rehydrateError}
        onDismissActionError={() => setRehydrateError(null)}
        search={crud.search}
        onSearchChange={crud.setSearch}
        page={crud.page}
        pageSize={crud.pageSize}
        onPageChange={crud.onPageChange}
        onRowsPerPageChange={crud.onRowsPerPageChange}
        emptyTitle={t('instances.emptyTitle')}
        emptyDescription={t('instances.emptyDescription')}
        primaryActionLabel={t('instances.createButton')}
        onPrimaryAction={crud.handleOpenCreate}
        illustrationSrc={emptyIllustration}
        entityLabel={t('instances.entityLabel')}
      />

      <DcmFormDialog
        open={crud.createOpen}
        onClose={crud.handleCloseCreate}
        title={t('instances.createDialogTitle')}
        maxWidth="sm"
        error={crud.createError}
        submitting={crud.createSubmitting}
        actions={
          <DcmFormDialogActions
            onSubmit={crud.handleCreateSubmit}
            onCancel={crud.handleCloseCreate}
            submitLabel={t('instances.createButton')}
            submitting={crud.createSubmitting}
            disabled={!isInstanceFormValid(crud.createForm)}
          />
        }
      >
        <InstanceFormFields
          form={crud.createForm}
          setForm={crud.setCreateForm}
          catalogItems={catalogItems}
          touched={crud.createTouched as ScalarTouched}
          setTouched={
            crud.setCreateTouched as React.Dispatch<
              React.SetStateAction<ScalarTouched>
            >
          }
        />
      </DcmFormDialog>

      <DcmDeleteDialog
        open={crud.deleteOpen}
        onClose={crud.handleCloseDelete}
        onConfirm={crud.handleDeleteConfirm}
        resourceName={
          crud.deletingItem?.display_name ?? crud.deletingItem?.uid ?? ''
        }
        resourceLabel={t('instances.deleteLabel')}
        error={crud.deleteError}
        isSubmitting={crud.deleteSubmitting}
      />

      <DcmSuccessSnackbar
        message={successMessage}
        onClose={() => setSuccessMessage(null)}
      />

      <Dialog
        open={Boolean(rehydrateConfirmInst)}
        onClose={() => setRehydrateConfirmInst(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('instances.rehydrateDialogTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {(t as any)('instances.rehydrateDialogBody', {
              instanceName:
                rehydrateConfirmInst?.display_name ??
                rehydrateConfirmInst?.uid ??
                t('instances.rehydrateDialogFallbackName'),
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRehydrateConfirmInst(null)}>
            {t('instances.rehydrateDialogCancel')}
          </Button>
          <Button
            color="primary"
            variant="contained"
            onClick={() => {
              if (rehydrateConfirmInst) {
                executeRehydrate(rehydrateConfirmInst);
              }
              setRehydrateConfirmInst(null);
            }}
          >
            {t('instances.rehydrateDialogConfirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
