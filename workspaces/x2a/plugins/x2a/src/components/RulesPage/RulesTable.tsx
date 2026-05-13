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
import EditIcon from '@material-ui/icons/Edit';
import { useClientService } from '../../ClientService';
import { useTranslation } from '../../hooks/useTranslation';
import { extractResponseError, isHttpSuccessResponse } from '../tools';
import { RuleDialog } from './RuleDialog';

const EditIconComponent = () => <EditIcon />;

/** Plain data shape returned by the rules API (subset of the domain Rule class). */
interface RuleData {
  id: string;
  title: string;
  description: string;
  required: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const RulesTable = () => {
  const clientService = useClientService();
  const { t } = useTranslation();

  const [rules, setRules] = useState<RuleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RuleData | undefined>(undefined);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await clientService.rulesGet({});
      if (!isHttpSuccessResponse(response)) {
        const message = await extractResponseError(
          response,
          'Failed to fetch rules',
        );
        setError(new Error(message));
        return;
      }
      const data = await response.json();
      setRules(data.items ?? []);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [clientService]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleOpenCreate = () => {
    setEditTarget(undefined);
    setDialogOpen(true);
  };

  const handleOpenEdit = (rule: RuleData) => {
    setEditTarget(rule);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditTarget(undefined);
  };

  const handleSaved = () => {
    handleDialogClose();
    fetchRules();
  };

  const columns = useMemo(
    (): TableColumn<RuleData>[] => [
      {
        title: t('rulesPage.table.id'),
        field: 'id',
      },
      {
        title: t('rulesPage.table.title'),
        field: 'title',
      },
      {
        title: t('rulesPage.table.description'),
        field: 'description',
        render: (rowData: RuleData) => {
          const desc = rowData.description ?? '';
          return desc.length > 100 ? `${desc.slice(0, 100)}...` : desc;
        },
      },
      {
        title: t('rulesPage.table.required'),
        field: 'required',
        render: (rowData: RuleData) =>
          rowData.required ? (
            <Chip
              label={t('rulesPage.table.required')}
              size="small"
              style={{ backgroundColor: '#4caf50', color: '#fff' }}
            />
          ) : (
            t('rulesPage.table.optional')
          ),
      },
      {
        title: t('rulesPage.table.createdAt'),
        field: 'createdAt',
        type: 'datetime',
      },
    ],
    [t],
  );

  const actions = useMemo(
    () => [
      (rowData: RuleData) => ({
        icon: EditIconComponent,
        onClick: () => handleOpenEdit(rowData),
        tooltip: t('rulesPage.table.editRule'),
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
          {t('rulesPage.addRule')}
        </Button>
      </Box>

      <Table<RuleData>
        title={t('rulesPage.title')}
        columns={columns}
        data={rules}
        actions={actions}
        isLoading={loading}
        options={{
          search: false,
          paging: true,
          actionsColumnIndex: -1,
          padding: 'default',
          emptyRowsWhenPaging: false,
        }}
        emptyContent={t('rulesPage.table.noRules')}
      />

      <RuleDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSaved={handleSaved}
        rule={editTarget}
      />
    </>
  );
};
