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
import { usePersistedPageSize } from '../../hooks/usePersistedPageSize';
import {
  Table,
  TableColumn,
  InfoCard,
  Link,
  Progress,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { Box, Button, Typography } from '@material-ui/core';
import type { Provider } from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { DcmDataCenterTabEmptyState } from '../../components/DcmDataCenterTabEmptyState';
import { DCM_FROM_TAB_STATE } from '../../components/dataCenterNavigation';
import environmentsEmptyIllustration from '../../assets/environments-empty-state.png';
import {
  createEditDeleteColumn,
  DcmSearchCardAction,
} from '../../components/dcmTabListHelpers';
import { useDcmStyles } from '../../components/dcmStyles';
import { getMockEntityCountForEnvironment, type Environment } from '../../data';
import { providersApiRef } from '../../apis';
import { DeleteEnvironmentDialog } from './components/DeleteEnvironmentDialog';
import { EditEnvironmentDialog } from './components/EditEnvironmentDialog';
import { RegisterEnvironmentDialog } from './components/RegisterEnvironmentDialog';
import {
  emptyEnvironmentRegisterForm,
  type EnvironmentRegisterFormState,
} from './components/environmentFormTypes';

export type { Environment } from '../../data';

function providerToEnvironment(p: Provider): Environment {
  return {
    id: p.id ?? p.name,
    name: p.display_name ?? p.name,
    type: p.service_type,
    envLabel: String(p.metadata?.status ?? ''),
    resourceLoadCurrent: 0,
    resourceLoadTotal: p.metadata?.resources?.total_cpu ?? 0,
    infrastructureLoadCount: 0,
    maxRamGb: undefined,
  };
}

function formToProvider(form: EnvironmentRegisterFormState): Provider {
  return {
    name: form.name
      .trim()
      .toLowerCase()
      .replaceAll(/[^a-z0-9-]/g, '-'),
    display_name: form.name.trim(),
    endpoint: '',
    service_type: form.type,
    schema_version: 'v1alpha1',
    metadata: {
      status: form.envLabel,
      resources: {
        total_cpu: Number(form.maxVcpus) || 0,
        total_memory: form.maxRamGb ? `${form.maxRamGb}Gi` : undefined,
      },
    },
  };
}

// Module-level state updater factories — defined outside the component so they
// do not contribute to lexical function-nesting depth (typescript:S2004).

function addEnvironment(env: Environment) {
  return (prev: Environment[]) => [...prev, env];
}

function replaceEnvironment(id: string, env: Environment) {
  return (prev: Environment[]) => prev.map(e => (e.id === id ? env : e));
}

function patchEnvironment(id: string, form: EnvironmentRegisterFormState) {
  const maxVcpus = Number(form.maxVcpus) || 0;
  const maxRamGb =
    form.maxRamGb.trim() === ''
      ? undefined
      : Number(form.maxRamGb) || undefined;
  return (prev: Environment[]) =>
    prev.map(e =>
      e.id === id
        ? {
            ...e,
            name: form.name.trim(),
            type: form.type,
            envLabel: form.envLabel.trim(),
            resourceLoadTotal: maxVcpus,
            maxRamGb,
          }
        : e,
    );
}

function removeEnvironment(id: string) {
  return (prev: Environment[]) => prev.filter(e => e.id !== id);
}

export function EnvironmentsTabContent() {
  const classes = useDcmStyles();
  const providersApi = useApi(providersApiRef);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = usePersistedPageSize('environments');
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    providersApi
      .listProviders()
      .then(list => {
        setEnvironments((list.providers ?? []).map(providerToEnvironment));
      })
      .catch(() => {
        // Keep empty list on error so the UI shows the empty state
        setEnvironments([]);
      })
      .finally(() => setLoading(false));
  }, [providersApi]);
  const [registerForm, setRegisterForm] =
    useState<EnvironmentRegisterFormState>(() =>
      emptyEnvironmentRegisterForm(),
    );
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEnvironment, setEditingEnvironment] =
    useState<Environment | null>(null);
  const [editForm, setEditForm] = useState<EnvironmentRegisterFormState>(() =>
    emptyEnvironmentRegisterForm(),
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [envToDelete, setEnvToDelete] = useState<Environment | null>(null);
  const isEnvironmentFormValid = useCallback(
    (form: EnvironmentRegisterFormState) =>
      form.name.trim() !== '' &&
      form.type.trim() !== '' &&
      form.envLabel.trim() !== '',
    [],
  );

  const filteredEnvironments = useMemo(() => {
    if (!search.trim()) return environments;
    const lower = search.toLowerCase();
    return environments.filter(
      env =>
        env.name.toLowerCase().includes(lower) ||
        env.type.toLowerCase().includes(lower) ||
        env.envLabel.toLowerCase().includes(lower),
    );
  }, [environments, search]);

  const paginatedEnvironments = useMemo(() => {
    const start = page * pageSize;
    return filteredEnvironments.slice(start, start + pageSize);
  }, [filteredEnvironments, page, pageSize]);

  useEffect(() => {
    const maxPage = Math.max(
      0,
      Math.ceil(filteredEnvironments.length / pageSize) - 1,
    );
    setPage(prev => Math.min(prev, maxPage));
  }, [filteredEnvironments.length, pageSize]);

  const handleRegister = useCallback(() => {
    setRegisterForm(emptyEnvironmentRegisterForm());
    setRegisterModalOpen(true);
  }, []);

  const handleRegisterModalClose = useCallback(() => {
    setRegisterModalOpen(false);
    setRegisterForm(emptyEnvironmentRegisterForm());
  }, []);

  const handleRegisterSubmit = useCallback(async () => {
    if (!isEnvironmentFormValid(registerForm)) return;
    const provider = formToProvider(registerForm);
    try {
      const created = await providersApi.createProvider(provider);
      setEnvironments(addEnvironment(providerToEnvironment(created)));
    } catch {
      // Optimistic fallback: add locally so the user sees their entry
      setEnvironments(
        addEnvironment(
          providerToEnvironment({ ...provider, id: String(Date.now()) }),
        ),
      );
    }
    handleRegisterModalClose();
  }, [
    providersApi,
    registerForm,
    handleRegisterModalClose,
    isEnvironmentFormValid,
  ]);

  const handleEdit = useCallback((env: Environment) => {
    setEditingEnvironment(env);
    setEditForm({
      name: env.name,
      type: env.type,
      envLabel: env.envLabel,
      maxVcpus: String(env.resourceLoadTotal),
      maxRamGb:
        env.maxRamGb !== null && env.maxRamGb !== undefined
          ? String(env.maxRamGb)
          : '',
    });
    setEditModalOpen(true);
  }, []);

  const handleEditModalClose = useCallback(() => {
    setEditModalOpen(false);
    setEditingEnvironment(null);
    setEditForm(emptyEnvironmentRegisterForm());
  }, []);

  const handleEditSubmit = useCallback(async () => {
    if (!editingEnvironment || !isEnvironmentFormValid(editForm)) return;
    const provider = formToProvider(editForm);
    const id = editingEnvironment.id;
    try {
      const updated = await providersApi.applyProvider(id, { ...provider, id });
      setEnvironments(replaceEnvironment(id, providerToEnvironment(updated)));
    } catch {
      setEnvironments(patchEnvironment(id, editForm));
    }
    handleEditModalClose();
  }, [
    providersApi,
    editingEnvironment,
    editForm,
    handleEditModalClose,
    isEnvironmentFormValid,
  ]);

  const handleDelete = useCallback((env: Environment) => {
    setEnvToDelete(env);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteDialogClose = useCallback(() => {
    setDeleteDialogOpen(false);
    setEnvToDelete(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (envToDelete) {
      const id = envToDelete.id;
      try {
        await providersApi.deleteProvider(id);
      } catch {
        // No-op: keep local removal regardless of API response
      }
      setEnvironments(removeEnvironment(id));
    }
    handleDeleteDialogClose();
  }, [providersApi, envToDelete, handleDeleteDialogClose]);

  const handlePageChange = useCallback(
    (newPage: number, newPageSize: number) => {
      setPage(newPage);
      setPageSize(newPageSize);
    },
    [setPageSize],
  );

  const handleRowsPerPageChange = useCallback(
    (newPageSize: number) => {
      setPageSize(newPageSize);
      setPage(0);
    },
    [setPageSize],
  );

  const { underlineLink } = classes;

  const columns = useMemo<TableColumn<Environment>[]>(
    () => [
      {
        title: 'Name',
        field: 'name',
        cellStyle: { minWidth: 140 },
        render: data => (
          <Link
            to={`environments/${data.id}`}
            state={{ [DCM_FROM_TAB_STATE]: 'environments' }}
            className={underlineLink}
          >
            {data.name}
          </Link>
        ),
      },
      {
        title: 'Type',
        field: 'type',
        cellStyle: { minWidth: 100 },
        render: data => <Typography variant="body2">{data.type}</Typography>,
      },
      {
        title: 'Env label',
        field: 'envLabel',
        cellStyle: { minWidth: 100 },
        render: data => (
          <Typography variant="body2">{data.envLabel}</Typography>
        ),
      },
      {
        title: 'Resource load (VCPUs)',
        field: 'resourceLoad',
        sorting: false,
        cellStyle: { minWidth: 160 },
        render: data => (
          <Typography variant="body2" component="span">
            {data.resourceLoadCurrent} / {data.resourceLoadTotal}
          </Typography>
        ),
      },
      {
        title: 'Infrastructure load',
        field: 'infrastructureLoadCount',
        sorting: false,
        cellStyle: { minWidth: 140 },
        render: data => (
          <Link
            to={`environments/${data.id}/entities`}
            state={{ [DCM_FROM_TAB_STATE]: 'environments' }}
            className={underlineLink}
          >
            {getMockEntityCountForEnvironment(data.id)} entities
          </Link>
        ),
      },
      createEditDeleteColumn<Environment>({
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
      {environments.length === 0 ? (
        <DcmDataCenterTabEmptyState
          title="No environments registered"
          description="Register environments (e.g. AWS Prod, OpenShift Dev) to allow developers to provision service instances to those targets. Environment types and URLs are configured in the plugin config file."
          primaryActionLabel="Register"
          onPrimaryAction={handleRegister}
          illustrationSrc={environmentsEmptyIllustration}
        />
      ) : (
        <>
          <Box className={classes.toolbarRow}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleRegister}
            >
              Register
            </Button>
          </Box>
          <InfoCard
            title="Environments"
            action={cardAction}
            className={classes.dataCard}
            titleTypographyProps={{
              className: classes.cardTitle,
            }}
          >
            <Box className={classes.cardContent}>
              <Table<Environment>
                data={paginatedEnvironments}
                columns={columns}
                options={{
                  paging: true,
                  pageSize,
                  pageSizeOptions: [5, 10, 25, 50],
                  search: false,
                  sorting: true,
                  padding: 'default',
                  toolbar: false,
                  emptyRowsWhenPaging: false,
                }}
                totalCount={filteredEnvironments.length}
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

      <RegisterEnvironmentDialog
        open={registerModalOpen}
        onClose={handleRegisterModalClose}
        form={registerForm}
        setForm={setRegisterForm}
        onSubmit={handleRegisterSubmit}
        isSubmitDisabled={!isEnvironmentFormValid(registerForm)}
      />
      <EditEnvironmentDialog
        open={editModalOpen}
        onClose={handleEditModalClose}
        form={editForm}
        setForm={setEditForm}
        onSubmit={handleEditSubmit}
        isSubmitDisabled={!isEnvironmentFormValid(editForm)}
      />
      <DeleteEnvironmentDialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        environment={envToDelete}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  );
}
