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

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Table,
  TableColumn,
  ResponseErrorPanel,
} from '@backstage/core-components';
import { Box, Button, Chip } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import type { AdversarialAgent } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { useClientService } from '../../ClientService';
import { useTranslation } from '../../hooks/useTranslation';
import { extractResponseError, isHttpSuccessResponse } from '../tools';
import { DeleteAgentDialog } from './DeleteAgentDialog';
import { AgentDialog } from './AgentDialog';

const EditIconComponent = () => <EditIcon />;
const DeleteIconComponent = () => <DeleteIcon />;

export const AdversarialAgentsTable = () => {
  const clientService = useClientService();
  const { t } = useTranslation();

  const [agents, setAgents] = useState<AdversarialAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdversarialAgent | undefined>(
    undefined,
  );
  const [deleteTarget, setDeleteTarget] = useState<
    AdversarialAgent | undefined
  >(undefined);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await clientService.adversarialAgentsGet({
        query: {},
      });
      if (!isHttpSuccessResponse(response)) {
        const message = await extractResponseError(
          response,
          t('adversarialAgentsPage.table.fetchError'),
        );
        setError(new Error(message));
        return;
      }
      const data = await response.json();
      setAgents(data.agents ?? []);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [clientService, t]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleOpenCreate = () => {
    setEditTarget(undefined);
    setDialogOpen(true);
  };

  const handleOpenEdit = (agent: AdversarialAgent) => {
    setEditTarget(agent);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditTarget(undefined);
  };

  const handleSaved = () => {
    handleDialogClose();
    fetchAgents();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const response = await clientService.adversarialAgentsIdDelete({
        path: { id: deleteTarget.id },
      });
      if (!isHttpSuccessResponse(response)) {
        const message = await extractResponseError(
          response,
          t('adversarialAgentsPage.deleteConfirm.deleteError'),
        );
        setError(new Error(message));
        return;
      }
      setDeleteTarget(undefined);
      fetchAgents();
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo(
    (): TableColumn<AdversarialAgent>[] => [
      {
        title: t('adversarialAgentsPage.table.name'),
        field: 'name',
      },
      {
        title: t('adversarialAgentsPage.table.prompt'),
        field: 'prompt',
        render: (rowData: AdversarialAgent) => {
          const prompt = rowData.prompt ?? '';
          return prompt.length > 100 ? `${prompt.slice(0, 100)}...` : prompt;
        },
      },
      {
        title: t('adversarialAgentsPage.table.phases'),
        field: 'phases',
        render: (rowData: AdversarialAgent) => (
          <Box>
            {(rowData.phases ?? []).map(phase => (
              <Chip
                key={phase}
                label={phase}
                size="small"
                style={{ margin: 2 }}
              />
            ))}
          </Box>
        ),
      },
      {
        title: t('adversarialAgentsPage.table.severity'),
        field: 'critical',
        render: (rowData: AdversarialAgent) =>
          rowData.critical
            ? t('adversarialAgentsPage.table.critical')
            : t('adversarialAgentsPage.table.warning'),
      },
      {
        title: t('adversarialAgentsPage.table.createdAt'),
        field: 'createdAt',
        render: (rowData: AdversarialAgent) =>
          rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : '',
      },
    ],
    [t],
  );

  const actions = useMemo(
    () => [
      (rowData: AdversarialAgent) => ({
        icon: EditIconComponent,
        onClick: () => handleOpenEdit(rowData),
        tooltip: t('adversarialAgentsPage.table.editAgent'),
      }),
      (rowData: AdversarialAgent) => ({
        icon: DeleteIconComponent,
        onClick: () => setDeleteTarget(rowData),
        tooltip: t('adversarialAgentsPage.table.deleteAgent'),
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  return (
    <>
      {error && <ResponseErrorPanel error={error} />}

      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="contained" color="primary" onClick={handleOpenCreate}>
          {t('adversarialAgentsPage.addAgent')}
        </Button>
      </Box>

      <Table<AdversarialAgent>
        title={t('adversarialAgentsPage.title')}
        columns={columns}
        data={agents}
        actions={actions}
        isLoading={loading}
        options={{
          search: false,
          paging: true,
          actionsColumnIndex: -1,
          padding: 'default',
          emptyRowsWhenPaging: false,
        }}
        emptyContent={t('adversarialAgentsPage.table.noAgents')}
      />

      <AgentDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSaved={handleSaved}
        agent={editTarget}
      />

      <DeleteAgentDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(undefined)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        agentName={deleteTarget?.name ?? ''}
      />
    </>
  );
};
