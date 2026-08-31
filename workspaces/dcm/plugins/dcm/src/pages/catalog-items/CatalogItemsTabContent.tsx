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

import { useMemo } from 'react';
import { TableColumn } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { Box, Chip, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import type { CatalogItem } from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { catalogApiRef } from '../../apis';
import { DcmCrudTabLayout } from '../../components/DcmCrudTabLayout';
import { DcmDeleteDialog } from '../../components/DcmDeleteDialog';
import { DcmSuccessSnackbar } from '../../components/DcmSuccessSnackbar';
import { createEditDeleteColumn } from '../../components/dcmTabListHelpers';
import { DcmEmptyCell, TruncatedText } from '../../components/TruncatedText';
import { useInfiniteSelect } from '../../hooks/useInfiniteSelect';
import { usePaginatedCrudTab } from '../../hooks/usePaginatedCrudTab';
import { useTranslation } from '../../hooks/useTranslation';
import emptyIllustration from '../../assets/environments-empty-state.png';
import { CatalogItemWizardDialog } from './components/CatalogItemWizardDialog';
import {
  catalogItemToForm,
  emptyCatalogItemForm,
  formToCatalogItem,
  formToCatalogItemForUpdate,
  isCatalogItemFormValid,
} from './catalogItemFormTypes';
import type { CatalogItemForm } from './catalogItemFormTypes';

const useStyles = makeStyles(theme => ({
  apiVersionChip: {
    maxWidth: 140,
  },
  resourceChip: {
    maxWidth: 160,
    margin: theme.spacing(0.25),
    height: 22,
    fontSize: theme.typography.pxToRem(12),
  },
}));

export function CatalogItemsTabContent() {
  const classes = useStyles();
  const catalogApi = useApi(catalogApiRef);
  const { t } = useTranslation();

  // Paginated service-type list for the create/edit-item dropdowns.
  // Loads the first 100 on mount; subsequent pages are appended as the user
  // scrolls inside the dropdown menu (see CatalogItemWizardDialog).
  const {
    items: serviceTypes,
    loadingMore: loadingMoreServiceTypes,
    error: serviceTypesError,
    loadMore: loadMoreServiceTypes,
  } = useInfiniteSelect((token?: string) =>
    catalogApi.listServiceTypes({ max_page_size: 100, page_token: token }),
  );

  const crud = usePaginatedCrudTab<CatalogItem, CatalogItemForm>({
    loadFn: ({ pageToken, pageSize: ps }) =>
      catalogApi
        .listCatalogItems({ page_token: pageToken, max_page_size: ps })
        .then(r => ({
          items: r.results ?? [],
          nextPageToken: r.next_page_token,
        })),
    storageKey: 'catalog-items',
    createFn: form => catalogApi.createCatalogItem(formToCatalogItem(form)),
    updateFn: (id, form) =>
      catalogApi.updateCatalogItem(id, formToCatalogItemForUpdate(form)),
    deleteFn: id => catalogApi.deleteCatalogItem(id),
    getId: item => item.uid ?? '',
    getSearchText: item => [
      item.display_name,
      ...(item.spec?.resources?.map(r => r.service_type) ?? []),
      item.uid,
    ],
    emptyForm: emptyCatalogItemForm,
    isValid: isCatalogItemFormValid,
    itemToForm: catalogItemToForm,
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
            text={item.display_name || '-'}
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
              -
            </Typography>
          ),
      },
      {
        title: t('catalogItems.columns.resources'),
        field: 'spec.resources',
        sorting: false,
        render: item => {
          const resources = item.spec?.resources ?? [];
          if (resources.length === 0) {
            return (
              <Typography variant="caption" color="textSecondary">
                -
              </Typography>
            );
          }
          return (
            <Box display="flex" flexWrap="wrap">
              {resources.map(r => (
                <Chip
                  key={r.name}
                  label={r.service_type}
                  size="small"
                  variant="outlined"
                  className={classes.resourceChip}
                />
              ))}
            </Box>
          );
        },
      },
      {
        title: t('catalogItems.columns.fields'),
        field: 'spec.resources',
        sorting: false,
        render: item => {
          const count = (item.spec?.resources ?? []).reduce(
            (sum, r) => sum + (r.fields?.length ?? 0),
            0,
          );
          return (
            <Typography variant="body2" color="textSecondary">
              {(t as any)('catalogItems.fieldCount', { count })}
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
              -
            </Typography>
          ),
      },
      createEditDeleteColumn<CatalogItem>({
        onEdit: crud.handleOpenEdit,
        onDelete: crud.handleOpenDelete,
        title: t('common.actions'),
      }),
    ],
    [classes, crud.handleOpenEdit, crud.handleOpenDelete, t],
  );

  return (
    <>
      <DcmCrudTabLayout<CatalogItem>
        items={crud.items}
        filtered={crud.filtered}
        paginated={crud.filtered}
        columns={columns}
        loading={crud.loading}
        loadError={crud.loadError}
        onRetry={crud.reload}
        actionError={serviceTypesError}
        search={crud.search}
        onSearchChange={crud.handleSearchChange}
        cursorPagination={crud.cursorPagination}
        emptyTitle={t('catalogItems.emptyTitle')}
        emptyDescription={t('catalogItems.emptyDescription')}
        primaryActionLabel={t('catalogItems.createButton')}
        onPrimaryAction={crud.handleOpenCreate}
        illustrationSrc={emptyIllustration}
        entityLabel={t('catalogItems.entityLabel')}
      />

      <CatalogItemWizardDialog
        open={crud.createOpen}
        onClose={crud.handleCloseCreate}
        title={t('catalogItems.createDrawerTitle')}
        form={crud.createForm}
        setForm={crud.setCreateForm}
        serviceTypes={serviceTypes}
        onLoadMoreServiceTypes={loadMoreServiceTypes}
        loadingMoreServiceTypes={loadingMoreServiceTypes}
        onSubmit={crud.handleCreateSubmit}
        submitLabel={t('catalogItems.createButton')}
        submitting={crud.createSubmitting}
        error={crud.createError}
        isEditMode={false}
      />

      <CatalogItemWizardDialog
        open={crud.editOpen}
        onClose={crud.handleCloseEdit}
        title={t('catalogItems.editDrawerTitle')}
        form={crud.editForm}
        setForm={crud.setEditForm}
        serviceTypes={serviceTypes}
        onLoadMoreServiceTypes={loadMoreServiceTypes}
        loadingMoreServiceTypes={loadingMoreServiceTypes}
        onSubmit={crud.handleEditSubmit}
        submitLabel={t('catalogItems.saveButton')}
        submitting={crud.editSubmitting}
        error={crud.editError}
        isEditMode
      />

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
