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

import { useMemo, useState, useCallback } from 'react';
import { Table, TableColumn, InfoCard, Link } from '@backstage/core-components';
import { Box, Button, Typography } from '@material-ui/core';
import { DcmDataCenterTabEmptyState } from '../../components/DcmDataCenterTabEmptyState';
import { DCM_FROM_TAB_STATE } from '../../components/dataCenterNavigation';
import dataCenterTabEmptyIllustration from '../../assets/environments-empty-state.png';
import {
  createEditDeleteColumn,
  DcmSearchCardAction,
} from '../../components/dcmTabListHelpers';
import { useDcmStyles } from '../../components/dcmStyles';
import type { ServiceSpec } from '../../data/service-specs';
import {
  formatServiceSpecCpu,
  formatServiceSpecRam,
  getMockEntityCountForServiceSpec,
  INITIAL_SERVICE_SPECS,
} from '../../data/service-specs';
import { DeleteServiceSpecDialog } from './components/DeleteServiceSpecDialog';
import { ServiceSpecCreateDialog } from './components/ServiceSpecCreateDialog';
import { ServiceSpecEditDialog } from './components/ServiceSpecEditDialog';
import {
  defaultDetailFields,
  emptySpecForm,
  specToForm,
  type SpecFormState,
} from './components/specFormTypes';
import { DCM_DETAILS_TABS } from '../../routes';

function getUpdatedEnvSupport(
  envSupport: string[],
  environment: string,
): string[] {
  if (!environment) return envSupport;
  return [
    environment,
    ...envSupport.filter(existing => existing !== environment),
  ];
}

function updateSpecFromEditForm(
  spec: ServiceSpec,
  editingSpecId: string,
  form: SpecFormState,
  environment: string,
  quota: number,
): ServiceSpec {
  if (spec.id !== editingSpecId) return spec;
  const cpu = Number(form.cpu) || 0;
  const ram = Number(form.ram) || 0;
  return {
    ...spec,
    name: form.name.trim(),
    cpu,
    ram,
    policyPacks: [...form.policyPacks],
    environment,
    quota,
    envSupport: getUpdatedEnvSupport(spec.envSupport, environment),
  };
}

export const ServiceSpecsTabContent = () => {
  const classes = useDcmStyles();
  const [specs, setSpecs] = useState<ServiceSpec[]>(() => [
    ...INITIAL_SERVICE_SPECS,
  ]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<SpecFormState>(() =>
    emptySpecForm(),
  );
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState<ServiceSpec | null>(null);
  const [editForm, setEditForm] = useState<SpecFormState>(() =>
    emptySpecForm(),
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [specToDelete, setSpecToDelete] = useState<ServiceSpec | null>(null);
  const isServiceSpecFormValid = useCallback(
    (form: SpecFormState) =>
      form.name.trim() !== '' &&
      form.cpu.trim() !== '' &&
      form.ram.trim() !== '' &&
      form.environment.trim() !== '',
    [],
  );

  const filteredSpecs = useMemo(() => {
    if (!search.trim()) return specs;
    const lower = search.toLowerCase();
    return specs.filter(
      s =>
        s.name.toLowerCase().includes(lower) ||
        formatServiceSpecCpu(s.cpu).toLowerCase().includes(lower) ||
        formatServiceSpecRam(s.ram).toLowerCase().includes(lower) ||
        s.environment.toLowerCase().includes(lower) ||
        s.policyPacks.some(p => p.toLowerCase().includes(lower)),
    );
  }, [specs, search]);

  const paginatedSpecs = useMemo(() => {
    const start = page * pageSize;
    return filteredSpecs.slice(start, start + pageSize);
  }, [filteredSpecs, page, pageSize]);

  const handleCreateOpen = useCallback(() => {
    setCreateForm(emptySpecForm());
    setCreateModalOpen(true);
  }, []);

  const handleCreateClose = useCallback(() => {
    setCreateModalOpen(false);
    setCreateForm(emptySpecForm());
  }, []);

  const togglePolicyPack = useCallback(
    (
      setForm: React.Dispatch<React.SetStateAction<SpecFormState>>,
      pack: string,
    ) => {
      setForm(prev => {
        const has = prev.policyPacks.includes(pack);
        return {
          ...prev,
          policyPacks: has
            ? prev.policyPacks.filter(p => p !== pack)
            : [...prev.policyPacks, pack],
        };
      });
    },
    [],
  );

  const handleCreateSubmit = useCallback(() => {
    if (!isServiceSpecFormValid(createForm)) return;
    const quota = Number(createForm.maxQuota) || 0;
    const cpu = Number(createForm.cpu) || 0;
    const ram = Number(createForm.ram) || 0;
    const newId = `spec-${Date.now()}`;
    const env = createForm.environment.trim();
    setSpecs(prev => [
      ...prev,
      {
        id: newId,
        name: createForm.name.trim(),
        cpu,
        ram,
        policyPacks: [...createForm.policyPacks],
        environment: env,
        used: 0,
        quota,
        adoptionCount: 0,
        ...defaultDetailFields(env),
      },
    ]);
    handleCreateClose();
  }, [createForm, handleCreateClose, isServiceSpecFormValid]);

  const handleEdit = useCallback((spec: ServiceSpec) => {
    setEditingSpec(spec);
    setEditForm(specToForm(spec));
    setEditModalOpen(true);
  }, []);

  const handleEditClose = useCallback(() => {
    setEditModalOpen(false);
    setEditingSpec(null);
    setEditForm(emptySpecForm());
  }, []);

  const handleEditSubmit = useCallback(() => {
    if (!editingSpec || !isServiceSpecFormValid(editForm)) return;
    const quota = Number(editForm.maxQuota) || 0;
    const env = editForm.environment.trim();
    setSpecs(prev =>
      prev.map(s =>
        updateSpecFromEditForm(s, editingSpec.id, editForm, env, quota),
      ),
    );
    handleEditClose();
  }, [editingSpec, editForm, handleEditClose, isServiceSpecFormValid]);

  const handleDelete = useCallback((spec: ServiceSpec) => {
    setSpecToDelete(spec);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteClose = useCallback(() => {
    setDeleteDialogOpen(false);
    setSpecToDelete(null);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (specToDelete) {
      setSpecs(prev => prev.filter(s => s.id !== specToDelete.id));
    }
    handleDeleteClose();
  }, [specToDelete, handleDeleteClose]);

  const handlePageChange = useCallback(
    (newPage: number, newPageSize: number) => {
      setPage(newPage);
      setPageSize(newPageSize);
    },
    [],
  );

  const handleRowsPerPageChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(0);
  }, []);

  const { underlineLink } = classes;

  const columns = useMemo<TableColumn<ServiceSpec>[]>(
    () => [
      {
        title: 'Name',
        field: 'name',
        cellStyle: { minWidth: 200 },
        render: data => (
          <Link
            to={data.id}
            state={{ [DCM_FROM_TAB_STATE]: 'service-specs' }}
            className={underlineLink}
          >
            {data.name}
          </Link>
        ),
      },
      {
        title: 'CPU',
        field: 'cpu',
        cellStyle: { minWidth: 90 },
        render: data => (
          <Typography variant="body2">
            {formatServiceSpecCpu(data.cpu)}
          </Typography>
        ),
      },
      {
        title: 'RAM',
        field: 'ram',
        cellStyle: { minWidth: 90 },
        render: data => (
          <Typography variant="body2">
            {formatServiceSpecRam(data.ram)}
          </Typography>
        ),
      },
      {
        title: 'Policy packs',
        field: 'policyPacks',
        sorting: false,
        cellStyle: { minWidth: 160 },
        render: data => (
          <Typography variant="body2">{data.policyPacks.join(', ')}</Typography>
        ),
      },
      {
        title: 'Environment',
        field: 'environment',
        cellStyle: { minWidth: 90 },
        render: data => (
          <Typography variant="body2">{data.environment}</Typography>
        ),
      },
      {
        title: 'Availability',
        field: 'availability',
        sorting: false,
        cellStyle: { minWidth: 130 },
        render: data => (
          <Typography variant="body2" component="span">
            {data.used} of {data.quota} used
          </Typography>
        ),
      },
      {
        title: 'Adoption',
        field: 'adoptionCount',
        sorting: false,
        cellStyle: { minWidth: 110 },
        render: data => (
          <Link
            to={`${data.id}${DCM_DETAILS_TABS.entities}`}
            state={{ [DCM_FROM_TAB_STATE]: 'service-specs' }}
            className={underlineLink}
          >
            {getMockEntityCountForServiceSpec(data.id)} entities
          </Link>
        ),
      },
      createEditDeleteColumn<ServiceSpec>({
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    ],
    [handleEdit, handleDelete, underlineLink],
  );

  const cardAction = (
    <DcmSearchCardAction
      value={search}
      setValue={setSearch}
      classes={classes}
    />
  );

  return (
    <Box className={classes.root}>
      {specs.length === 0 ? (
        <DcmDataCenterTabEmptyState
          title="No service specs defined"
          description="Create service specs (templates) to define the types of services developers can provision, such as small development VMs or production-ready tiers."
          primaryActionLabel="Create"
          onPrimaryAction={handleCreateOpen}
          illustrationSrc={dataCenterTabEmptyIllustration}
        />
      ) : (
        <>
          <Box className={classes.toolbarRow}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateOpen}
            >
              Create
            </Button>
          </Box>
          <InfoCard
            title="Service specs"
            action={cardAction}
            className={classes.dataCard}
            titleTypographyProps={{
              className: classes.cardTitle,
            }}
          >
            <Box className={classes.cardContent}>
              <Table<ServiceSpec>
                data={paginatedSpecs}
                columns={columns}
                options={{
                  paging: true,
                  pageSize,
                  pageSizeOptions: [5, 10, 25, 50],
                  search: false,
                  sorting: true,
                  padding: 'default',
                  toolbar: false,
                }}
                totalCount={filteredSpecs.length}
                page={page}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                localization={{
                  pagination: {
                    labelRowsPerPage: 'rows',
                  },
                }}
              />
            </Box>
          </InfoCard>
        </>
      )}

      <ServiceSpecCreateDialog
        open={createModalOpen}
        onClose={handleCreateClose}
        form={createForm}
        setForm={setCreateForm}
        onSubmit={handleCreateSubmit}
        isSubmitDisabled={!isServiceSpecFormValid(createForm)}
        togglePolicyPack={togglePolicyPack}
      />
      <ServiceSpecEditDialog
        open={editModalOpen}
        onClose={handleEditClose}
        form={editForm}
        setForm={setEditForm}
        onSubmit={handleEditSubmit}
        isSubmitDisabled={!isServiceSpecFormValid(editForm)}
        togglePolicyPack={togglePolicyPack}
      />
      <DeleteServiceSpecDialog
        open={deleteDialogOpen}
        onClose={handleDeleteClose}
        spec={specToDelete}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  );
};
