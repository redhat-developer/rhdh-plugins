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

import { useMemo, useState, useCallback, useEffect } from 'react';
import { Table, TableColumn, InfoCard, Link } from '@backstage/core-components';
import { Box, Button, Typography } from '@material-ui/core';
import { DcmDataCenterTabEmptyState } from '../../components/DcmDataCenterTabEmptyState';
import { DCM_FROM_TAB_STATE } from '../../components/dataCenterNavigation';
import environmentsEmptyIllustration from '../../assets/environments-empty-state.png';
import {
  createEditDeleteColumn,
  DcmSearchCardAction,
} from '../../components/dcmTabListHelpers';
import { useDcmStyles } from '../../components/dcmStyles';
import {
  getMockEntityCountForEnvironment,
  INITIAL_ENVIRONMENTS,
  type Environment,
} from '../../data';
import { DeleteEnvironmentDialog } from './components/DeleteEnvironmentDialog';
import { EditEnvironmentDialog } from './components/EditEnvironmentDialog';
import { RegisterEnvironmentDialog } from './components/RegisterEnvironmentDialog';
import {
  emptyEnvironmentRegisterForm,
  type EnvironmentRegisterFormState,
} from './components/environmentFormTypes';

export type { Environment } from '../../data';

export function EnvironmentsTabContent() {
  const classes = useDcmStyles();
  const [environments, setEnvironments] = useState<Environment[]>(
    () => INITIAL_ENVIRONMENTS,
  );
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
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

  const handleRegisterSubmit = useCallback(() => {
    if (!isEnvironmentFormValid(registerForm)) return;
    const maxVcpus = Number(registerForm.maxVcpus) || 0;
    const maxRamGb =
      registerForm.maxRamGb.trim() === ''
        ? undefined
        : Number(registerForm.maxRamGb) || undefined;
    const newId = String(Date.now());
    setEnvironments(prev => [
      ...prev,
      {
        id: newId,
        name: registerForm.name.trim(),
        type: registerForm.type,
        envLabel: registerForm.envLabel.trim(),
        resourceLoadCurrent: 0,
        resourceLoadTotal: maxVcpus,
        infrastructureLoadCount: 0,
        ...(maxRamGb !== undefined && { maxRamGb }),
      },
    ]);
    handleRegisterModalClose();
  }, [registerForm, handleRegisterModalClose, isEnvironmentFormValid]);

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

  const handleEditSubmit = useCallback(() => {
    if (!editingEnvironment || !isEnvironmentFormValid(editForm)) return;
    const maxVcpus = Number(editForm.maxVcpus) || 0;
    const maxRamGb =
      editForm.maxRamGb.trim() === ''
        ? undefined
        : Number(editForm.maxRamGb) || undefined;
    setEnvironments(prev =>
      prev.map(e =>
        e.id === editingEnvironment.id
          ? {
              ...e,
              name: editForm.name.trim(),
              type: editForm.type,
              envLabel: editForm.envLabel.trim(),
              resourceLoadTotal: maxVcpus,
              maxRamGb,
            }
          : e,
      ),
    );
    handleEditModalClose();
  }, [
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

  const handleDeleteConfirm = useCallback(() => {
    if (envToDelete) {
      setEnvironments(prev => prev.filter(e => e.id !== envToDelete.id));
    }
    handleDeleteDialogClose();
  }, [envToDelete, handleDeleteDialogClose]);

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
