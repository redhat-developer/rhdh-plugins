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

import { useEffect, useMemo, useRef, useState } from 'react';
import { TableColumn } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import type {
  Agent,
  AgentHealthStatus,
} from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { agentsApiRef, catalogApiRef } from '../../apis';
import { DcmCrudTabLayout } from '../../components/DcmCrudTabLayout';
import { DcmFormDialog } from '../../components/DcmFormDialog';
import { DcmSuccessSnackbar } from '../../components/DcmSuccessSnackbar';
import { DcmFormDialogActions } from '../../components/DcmFormDialogActions';
import { usePaginatedCrudTab } from '../../hooks/usePaginatedCrudTab';
import { useInfiniteSelect } from '../../hooks/useInfiniteSelect';
import { useTranslation } from '../../hooks/useTranslation';
import emptyIllustration from '../../assets/environments-empty-state.png';
import { TruncatedText, DcmEmptyCell } from '../../components/TruncatedText';
import { AgentHealthStatus as AgentHealthStatusBadge } from './components/AgentHealthStatus';
import { AgentFormFields } from './components/AgentFormFields';
import { CopyButton } from './components/CopyButton';
import {
  emptyAgentForm,
  formToAgentRegistration,
  isAgentFormValid,
} from './agentFormTypes';
import type { AgentForm } from './agentFormTypes';

const useStyles = makeStyles(theme => ({
  nameCellBox: {
    minWidth: 0,
  },
  chipCell: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
  },
  healthFilter: {
    minWidth: 140,
  },
}));

export function AgentsTabContent() {
  const classes = useStyles();
  const agentsApi = useApi(agentsApiRef);
  const catalogApi = useApi(catalogApiRef);
  const { t } = useTranslation();

  const [healthFilter, setHealthFilter] = useState<AgentHealthStatus | ''>('');
  const [serviceTypesErrorDismissed, setServiceTypesErrorDismissed] =
    useState(false);

  const healthFilterOptions = useMemo(
    () => [
      {
        value: 'ready' as AgentHealthStatus,
        label: t('agents.filter.healthReady'),
      },
      {
        value: 'congested' as AgentHealthStatus,
        label: t('agents.filter.healthCongested'),
      },
      {
        value: 'unavailable' as AgentHealthStatus,
        label: t('agents.filter.healthUnavailable'),
      },
    ],
    [t],
  );

  const {
    items: serviceTypes,
    loading: loadingServiceTypes,
    loadingMore: loadingMoreServiceTypes,
    loadMore: loadMoreServiceTypes,
    error: serviceTypesError,
  } = useInfiniteSelect((token?: string) =>
    catalogApi.listServiceTypes({ max_page_size: 100, page_token: token }),
  );

  // Keep the latest filter value accessible inside the loadFn without
  // causing the hook to re-initialise when the filter changes.
  const healthFilterRef = useRef(healthFilter);
  healthFilterRef.current = healthFilter;

  const crud = usePaginatedCrudTab<Agent, AgentForm>({
    loadFn: ({ pageToken, pageSize: ps }) =>
      agentsApi
        .listAgents({
          page_token: pageToken,
          max_page_size: ps,
          health_status: healthFilterRef.current || undefined,
        })
        .then(r => ({
          items: r.agents ?? [],
          nextPageToken: r.next_page_token,
        })),
    storageKey: 'agents',
    createFn: form => agentsApi.createAgent(formToAgentRegistration(form)),
    getId: a => a.agent_id ?? a.name ?? '',
    getSearchText: a => [a.name, a.environment, a.topic_name],
    emptyForm: emptyAgentForm,
    isValid: isAgentFormValid,
    createSuccessMessage: t('agents.createSuccess'),
  });

  // Reset cursor and reload whenever the health filter changes, but skip the
  // initial render (the hook already loads on mount).
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    crud.resetAndReload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healthFilter]);

  const columns = useMemo<TableColumn<Agent>[]>(
    () => [
      {
        title: t('agents.columns.name'),
        field: 'name',
        render: a => (
          <Box className={classes.nameCellBox}>
            <TruncatedText
              text={a.name}
              variant="body2"
              bold
              maxWidth={180}
              fallback={<DcmEmptyCell />}
            />
            {a.agent_id && (
              <TruncatedText
                text={a.agent_id}
                variant="caption"
                color="textSecondary"
                bold={false}
                maxWidth={180}
                fallback={<DcmEmptyCell />}
              />
            )}
          </Box>
        ),
      },
      {
        title: t('agents.columns.environment'),
        field: 'environment',
        render: a => (
          <Chip label={a.environment} size="small" variant="outlined" />
        ),
      },
      {
        title: t('agents.columns.serviceTypes'),
        field: 'service_types',
        sorting: false,
        render: a => {
          const types = a.service_types ?? [];
          if (types.length === 0) return <DcmEmptyCell />;
          const VISIBLE = 2;
          const visible = types.slice(0, VISIBLE);
          const rest = types.slice(VISIBLE);
          return (
            <Box className={classes.chipCell}>
              {visible.map(st => (
                <Chip key={st} label={st} size="small" />
              ))}
              {rest.length > 0 && (
                <Tooltip
                  title={rest.join(', ')}
                  placement="top"
                  enterDelay={200}
                >
                  <Chip label={`+${rest.length}`} size="small" />
                </Tooltip>
              )}
            </Box>
          );
        },
      },
      {
        title: t('agents.columns.cost'),
        field: 'cost',
        render: a => <Chip label={a.cost} size="small" />,
      },
      {
        title: t('agents.columns.topic'),
        field: 'topic_name',
        render: a => (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            width="100%"
          >
            <TruncatedText
              text={a.topic_name}
              variant="body2"
              bold={false}
              maxWidth={200}
              fallback={<DcmEmptyCell />}
            />
            {a.topic_name && <CopyButton text={a.topic_name} />}
          </Box>
        ),
      },
      {
        title: t('agents.columns.health'),
        field: 'health_status',
        render: a => <AgentHealthStatusBadge value={a.health_status} />,
      },
      {
        title: t('agents.columns.lastHeartbeat'),
        field: 'last_heartbeat',
        render: a =>
          a.last_heartbeat ? (
            <Typography variant="body2">
              {new Date(a.last_heartbeat).toLocaleString()}
            </Typography>
          ) : (
            <DcmEmptyCell />
          ),
      },
    ],
    [classes, t],
  );

  const healthFilterControl = (
    <FormControl
      variant="outlined"
      size="small"
      className={classes.healthFilter}
    >
      <InputLabel shrink id="health-filter-label">
        {t('agents.filter.healthLabel')}
      </InputLabel>
      <Select
        labelId="health-filter-label"
        value={healthFilter}
        onChange={e =>
          setHealthFilter(e.target.value as AgentHealthStatus | '')
        }
        displayEmpty
        label={t('agents.filter.healthLabel')}
        inputProps={{ 'data-testid': 'health-filter' }}
      >
        <MenuItem value="">{t('agents.filter.healthAll')}</MenuItem>
        {healthFilterOptions.map(opt => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  return (
    <>
      <DcmCrudTabLayout<Agent>
        items={crud.items}
        filtered={crud.filtered}
        paginated={crud.filtered}
        columns={columns}
        loading={crud.loading}
        loadError={crud.loadError}
        onRetry={crud.reload}
        search={crud.search}
        onSearchChange={crud.handleSearchChange}
        cursorPagination={crud.cursorPagination}
        emptyTitle={t('agents.emptyTitle')}
        emptyDescription={t('agents.emptyDescription')}
        primaryActionLabel={t('agents.registerButton')}
        onPrimaryAction={crud.handleOpenCreate}
        illustrationSrc={emptyIllustration}
        entityLabel={t('agents.entityLabel')}
        toolbarExtra={healthFilterControl}
        hasActiveFilter={Boolean(healthFilter)}
        actionError={serviceTypesErrorDismissed ? null : serviceTypesError}
        onDismissActionError={() => setServiceTypesErrorDismissed(true)}
      />

      <DcmFormDialog
        open={crud.createOpen}
        onClose={crud.handleCloseCreate}
        title={t('agents.registerDialogTitle')}
        submitting={crud.createSubmitting}
        error={crud.createError}
        actions={
          <DcmFormDialogActions
            onSubmit={crud.handleCreateSubmit}
            onCancel={crud.handleCloseCreate}
            submitLabel={t('agents.registerButton')}
            submitting={crud.createSubmitting}
            disabled={!isAgentFormValid(crud.createForm)}
          />
        }
      >
        <AgentFormFields
          form={crud.createForm}
          setForm={crud.setCreateForm}
          touched={crud.createTouched}
          setTouched={crud.setCreateTouched}
          serviceTypes={serviceTypes}
          loadingServiceTypes={loadingServiceTypes}
          loadingMoreServiceTypes={loadingMoreServiceTypes}
          loadMoreServiceTypes={loadMoreServiceTypes}
        />
      </DcmFormDialog>

      <DcmSuccessSnackbar
        message={crud.successMessage}
        onClose={crud.clearSuccessMessage}
      />
    </>
  );
}
