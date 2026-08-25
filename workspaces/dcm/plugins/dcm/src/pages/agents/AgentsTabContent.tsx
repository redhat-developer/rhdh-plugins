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
import { Box, Chip, Tooltip } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import type { Agent } from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { agentsApiRef } from '../../apis';
import { DcmCrudTabLayout } from '../../components/DcmCrudTabLayout';
import { DcmFormDialog } from '../../components/DcmFormDialog';
import { DcmSuccessSnackbar } from '../../components/DcmSuccessSnackbar';
import { DcmFormDialogActions } from '../../components/DcmFormDialogActions';
import { usePaginatedCrudTab } from '../../hooks/usePaginatedCrudTab';
import { useTranslation } from '../../hooks/useTranslation';
import emptyIllustration from '../../assets/environments-empty-state.png';
import { TruncatedText, DcmEmptyCell } from '../../components/TruncatedText';
import { AgentHealthStatus } from './components/AgentHealthStatus';
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
}));

export function AgentsTabContent() {
  const classes = useStyles();
  const agentsApi = useApi(agentsApiRef);
  const { t } = useTranslation();

  const crud = usePaginatedCrudTab<Agent, AgentForm>({
    loadFn: ({ pageToken, pageSize: ps }) =>
      agentsApi
        .listAgents({ page_token: pageToken, max_page_size: ps })
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
        render: a => <AgentHealthStatus value={a.health_status} />,
      },
    ],
    [classes, t],
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
        />
      </DcmFormDialog>

      <DcmSuccessSnackbar
        message={crud.successMessage}
        onClose={crud.clearSuccessMessage}
      />
    </>
  );
}
