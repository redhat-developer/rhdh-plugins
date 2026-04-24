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

// Migrate to use useCrudTab + DcmCrudTabLayout when it is re-activated.
import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Table,
  TableColumn,
  InfoCard,
  Link,
  Progress,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { Box, Button, Typography } from '@material-ui/core';
import type { CatalogItem } from '@red-hat-developer-hub/backstage-plugin-dcm-common';
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
} from '../../data/service-specs';
import { catalogApiRef } from '../../apis';
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

function catalogItemToServiceSpec(item: CatalogItem): ServiceSpec {
  return {
    id: item.uid ?? item.display_name ?? String(Date.now()),
    name: item.display_name ?? '',
    cpu: 0,
    ram: 0,
    policyPacks: [],
    environment: item.spec?.service_type ?? '',
    used: 0,
    quota: 0,
    adoptionCount: 0,
    resourceType: item.spec?.service_type ?? 'VM',
    envSupport: item.spec?.service_type ? [item.spec.service_type] : [],
    estDeploymentTime: '',
    costTier: '',
    port: 0,
    protocol: '',
    backupPolicy: '',
    tags: [],
  };
}

function specFormToCatalogItem(
  form: { name: string; environment: string },
  id?: string,
): CatalogItem {
  return {
    ...(id ? { uid: id } : {}),
    api_version: 'v1alpha1',
    display_name: form.name.trim(),
    spec: {
      service_type: form.environment.trim(),
      fields: [],
    },
  };
}

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

// Module-level state-updater factories and pure helpers — defined outside the
// component so they do not contribute to lexical function-nesting depth (S2004).

function addSpec(spec: ServiceSpec) {
  return (prev: ServiceSpec[]) => [...prev, spec];
}

function replaceSpec(id: string, spec: ServiceSpec) {
  return (prev: ServiceSpec[]) => prev.map(s => (s.id === id ? spec : s));
}

function patchSpecs(id: string, form: SpecFormState) {
  const quota = Number(form.maxQuota) || 0;
  const env = form.environment.trim();
  return (prev: ServiceSpec[]) =>
    prev.map(s => updateSpecFromEditForm(s, id, form, env, quota));
}

function buildFallbackSpec(form: SpecFormState): ServiceSpec {
  const quota = Number(form.maxQuota) || 0;
  const cpu = Number(form.cpu) || 0;
  const ram = Number(form.ram) || 0;
  const env = form.environment.trim();
  return {
    id: `spec-${Date.now()}`,
    name: form.name.trim(),
    cpu,
    ram,
    policyPacks: [...form.policyPacks],
    environment: env,
    used: 0,
    quota,
    adoptionCount: 0,
    ...defaultDetailFields(env),
  };
}

function removeSpec(id: string) {
  return (prev: ServiceSpec[]) => prev.filter(s => s.id !== id);
}

function togglePack(packs: string[], pack: string): string[] {
  return packs.includes(pack)
    ? packs.filter(p => p !== pack)
    : [...packs, pack];
}

export const ServiceSpecsTabContent = () => {
  const classes = useDcmStyles();
  const catalogApi = useApi(catalogApiRef);
  const [specs, setSpecs] = useState<ServiceSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    catalogApi
      .listCatalogItems()
      .then(list => {
        setSpecs((list.results ?? []).map(catalogItemToServiceSpec));
      })
      .catch(() => {
        setSpecs([]);
      })
      .finally(() => setLoading(false));
  }, [catalogApi]);
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
      setForm(prev => ({
        ...prev,
        policyPacks: togglePack(prev.policyPacks, pack),
      }));
    },
    [],
  );

  const handleCreateSubmit = useCallback(async () => {
    if (!isServiceSpecFormValid(createForm)) return;
    const item = specFormToCatalogItem(createForm);
    try {
      const created = await catalogApi.createCatalogItem(item);
      setSpecs(addSpec(catalogItemToServiceSpec(created)));
    } catch {
      setSpecs(addSpec(buildFallbackSpec(createForm)));
    }
    handleCreateClose();
  }, [catalogApi, createForm, handleCreateClose, isServiceSpecFormValid]);

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

  const handleEditSubmit = useCallback(async () => {
    if (!editingSpec || !isServiceSpecFormValid(editForm)) return;
    const id = editingSpec.id;
    const patch = specFormToCatalogItem(editForm, id);
    try {
      const updated = await catalogApi.updateCatalogItem(id, patch);
      setSpecs(replaceSpec(id, catalogItemToServiceSpec(updated)));
    } catch {
      setSpecs(patchSpecs(id, editForm));
    }
    handleEditClose();
  }, [
    catalogApi,
    editingSpec,
    editForm,
    handleEditClose,
    isServiceSpecFormValid,
  ]);

  const handleDelete = useCallback((spec: ServiceSpec) => {
    setSpecToDelete(spec);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteClose = useCallback(() => {
    setDeleteDialogOpen(false);
    setSpecToDelete(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (specToDelete) {
      const id = specToDelete.id;
      try {
        await catalogApi.deleteCatalogItem(id);
      } catch {
        // No-op: keep local removal regardless of API response
      }
      setSpecs(removeSpec(id));
    }
    handleDeleteClose();
  }, [catalogApi, specToDelete, handleDeleteClose]);

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

  if (loading) return <Progress />;

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
