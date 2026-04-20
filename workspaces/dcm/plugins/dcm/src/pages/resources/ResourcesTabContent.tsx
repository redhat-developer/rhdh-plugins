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
import { Box, Chip, IconButton, Tooltip, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
  nameCellBox: {
    minWidth: 0,
  },
}));
import DeleteIcon from '@material-ui/icons/Delete';
import type {
  CatalogItemInstance,
  Resource,
} from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { catalogApiRef, placementApiRef } from '../../apis';
import { DcmCrudTabLayout } from '../../components/DcmCrudTabLayout';
import { DcmDeleteDialog } from '../../components/DcmDeleteDialog';
import { DcmErrorSnackbar } from '../../components/DcmErrorSnackbar';
import { DcmFormDialog } from '../../components/DcmFormDialog';
import { DcmFormDialogActions } from '../../components/DcmFormDialogActions';
import { DcmEmptyCell, TruncatedText } from '../../components/TruncatedText';
import { useCrudTab } from '../../hooks/useCrudTab';
import emptyIllustration from '../../assets/environments-empty-state.png';
import { ResourceFormFields } from './components/ResourceFormFields';
import {
  emptyResourceForm,
  formToResource,
  isResourceFormValid,
} from './resourceFormTypes';
import type { ResourceForm } from './resourceFormTypes';

export function ResourcesTabContent() {
  const classes = useStyles();
  const placementApi = useApi(placementApiRef);
  const catalogApi = useApi(catalogApiRef);

  const [instances, setInstances] = useState<CatalogItemInstance[]>([]);

  const crud = useCrudTab<Resource, ResourceForm>({
    loadFn: async () => {
      const [resList, instList] = await Promise.all([
        placementApi.listResources(),
        catalogApi.listCatalogItemInstances(),
      ]);
      setInstances(instList.results ?? []);
      return resList.resources ?? [];
    },
    createFn: form => {
      const clientId = form.id.trim() || undefined;
      return placementApi.createResource(formToResource(form), clientId);
    },
    deleteFn: id => placementApi.deleteResource(id),
    getId: r => r.id ?? '',
    getSearchText: r => [
      r.id,
      r.catalog_item_instance_id,
      r.provider_name,
      r.approval_status,
    ],
    emptyForm: emptyResourceForm,
    isValid: isResourceFormValid,
  });

  const instanceNameById = useMemo(() => {
    const map = new Map<string, string>();
    instances.forEach(inst => {
      if (inst.uid) map.set(inst.uid, inst.display_name || inst.uid);
    });
    return map;
  }, [instances]);

  const columns = useMemo<TableColumn<Resource>[]>(
    () => [
      {
        title: 'Resource ID',
        field: 'id',
        render: r => (
          <Box className={classes.nameCellBox}>
            <TruncatedText
              text={r.id}
              variant="body2"
              bold
              maxWidth={200}
              fallback={<DcmEmptyCell />}
            />
            {r.path && (
              <TruncatedText
                text={r.path}
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
        title: 'Catalog instance',
        field: 'catalog_item_instance_id',
        render: r => (
          <TruncatedText
            text={
              instanceNameById.get(r.catalog_item_instance_id) ??
              r.catalog_item_instance_id
            }
            variant="body2"
            bold={false}
            maxWidth={200}
            fallback={<DcmEmptyCell />}
          />
        ),
      },
      {
        title: 'Provider',
        field: 'provider_name',
        render: r => (
          <TruncatedText
            text={r.provider_name}
            variant="body2"
            color="textSecondary"
            bold={false}
            maxWidth={160}
            fallback={<DcmEmptyCell />}
          />
        ),
      },
      {
        title: 'Approval',
        field: 'approval_status',
        render: r =>
          r.approval_status ? (
            <Chip label={r.approval_status} size="small" />
          ) : (
            <Typography variant="caption" color="textSecondary">
              —
            </Typography>
          ),
      },
      {
        title: 'Created',
        field: 'create_time',
        render: r =>
          r.create_time ? (
            <Typography variant="body2">
              {new Date(r.create_time).toLocaleDateString()}
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
        render: r => (
          <Tooltip title="Delete">
            <Box component="span">
              <IconButton
                size="small"
                aria-label="Delete resource"
                onClick={() => crud.handleOpenDelete(r)}
                disabled={!r.id}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Tooltip>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [classes, crud.handleOpenDelete, instanceNameById],
  );

  return (
    <>
      <DcmCrudTabLayout<Resource>
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
        emptyTitle="No resources provisioned"
        emptyDescription="Resources are created by the Placement Manager when a catalog item instance is submitted. Use the Create button to provision a new resource."
        primaryActionLabel="Create"
        onPrimaryAction={crud.handleOpenCreate}
        illustrationSrc={emptyIllustration}
        entityLabel="Resources"
      />

      <DcmFormDialog
        open={crud.createOpen}
        onClose={crud.handleCloseCreate}
        title="Create resource"
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
        <ResourceFormFields
          form={crud.createForm}
          setForm={crud.setCreateForm}
          touched={crud.createTouched}
          setTouched={crud.setCreateTouched}
          instances={instances}
        />
      </DcmFormDialog>

      <DcmDeleteDialog
        open={crud.deleteOpen}
        onClose={crud.handleCloseDelete}
        onConfirm={crud.handleDeleteConfirm}
        resourceName={crud.deletingItem?.id ?? ''}
        resourceLabel="resource"
      />

      <DcmErrorSnackbar
        error={crud.deleteError}
        onClose={() => crud.setDeleteError(null)}
      />
    </>
  );
}
