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
import { Chip, IconButton, Tooltip, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
  catalogItemChip: {
    maxWidth: 180,
  },
  apiVersionChip: {
    maxWidth: 140,
  },
}));
import DeleteIcon from '@material-ui/icons/Delete';
import type {
  CatalogItem,
  CatalogItemInstance,
} from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { catalogApiRef } from '../../apis';
import { DcmCrudTabLayout } from '../../components/DcmCrudTabLayout';
import { DcmDeleteDialog } from '../../components/DcmDeleteDialog';
import { DcmErrorSnackbar } from '../../components/DcmErrorSnackbar';
import { DcmFormDialog } from '../../components/DcmFormDialog';
import { DcmFormDialogActions } from '../../components/DcmFormDialogActions';
import { DcmEmptyCell, TruncatedText } from '../../components/TruncatedText';
import { useCrudTab } from '../../hooks/useCrudTab';
import emptyIllustration from '../../assets/environments-empty-state.png';
import { InstanceFormFields } from './components/InstanceFormFields';
import {
  emptyInstanceForm,
  formToInstance,
  isInstanceFormValid,
} from './instanceFormTypes';
import type { InstanceForm } from './instanceFormTypes';

export function CatalogItemInstancesTabContent() {
  const classes = useStyles();
  const catalogApi = useApi(catalogApiRef);

  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);

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
  });

  const { handleOpenDelete } = crud;

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
        title: 'Display name',
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
        title: 'Catalog item',
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
        title: 'Resource ID',
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
        title: 'API version',
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
        title: 'Created',
        field: 'create_time',
        render: inst =>
          inst.create_time ? (
            <Typography variant="body2">
              {new Date(inst.create_time).toLocaleDateString()}
            </Typography>
          ) : (
            <Typography variant="caption" color="textSecondary">
              —
            </Typography>
          ),
      },
      {
        title: 'Actions',
        field: 'actions',
        sorting: false,
        width: '80px',
        render: inst => (
          <Tooltip title="Delete">
            <IconButton
              size="small"
              aria-label="Delete instance"
              onClick={() => handleOpenDelete(inst)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [classes, handleOpenDelete, catalogItemName],
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
        search={crud.search}
        onSearchChange={crud.setSearch}
        page={crud.page}
        pageSize={crud.pageSize}
        onPageChange={crud.onPageChange}
        onRowsPerPageChange={crud.onRowsPerPageChange}
        emptyTitle="No instances provisioned"
        emptyDescription="Catalog item instances represent provisioned services. Create an instance from a catalog item to provision a service on the registered provider infrastructure."
        primaryActionLabel="Create"
        onPrimaryAction={crud.handleOpenCreate}
        illustrationSrc={emptyIllustration}
        entityLabel="Catalog item instances"
      />

      <DcmFormDialog
        open={crud.createOpen}
        onClose={crud.handleCloseCreate}
        title="Create catalog item instance"
        maxWidth="sm"
        error={crud.createError}
        submitting={crud.createSubmitting}
        actions={
          <DcmFormDialogActions
            onSubmit={crud.handleCreateSubmit}
            onCancel={crud.handleCloseCreate}
            submitLabel="Create"
            submitting={crud.createSubmitting}
            disabled={false}
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
        resourceLabel="instance"
      />

      <DcmErrorSnackbar
        error={crud.deleteError}
        onClose={() => crud.setDeleteError(null)}
      />
    </>
  );
}
