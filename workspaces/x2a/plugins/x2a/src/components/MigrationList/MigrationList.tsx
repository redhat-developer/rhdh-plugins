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
import { useState } from 'react';
import useAsync from 'react-use/lib/useAsync';

import {
  Table,
  TableColumn,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';

import DeleteIcon from '@material-ui/icons/Delete';

import { Migration } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { useClientService } from '../../ClientService';
import { Grid } from '@material-ui/core';

type DenseTableProps = {
  forceRefresh: () => void;
  migrations: Migration[];
};

export const DenseTable = ({ migrations, forceRefresh }: DenseTableProps) => {
  const clientService = useClientService();

  const [error, setError] = useState<Error | null>(null);

  const handleDelete = async (id: string) => {
    setError(null);

    try {
      await clientService.deleteMigration(id);
      forceRefresh();
    } catch (e) {
      setError(e as Error);
    }
  };

  const columns: TableColumn<Migration>[] = [
    { title: 'Name', field: 'name' },
    { title: 'Status', field: 'status' },
    { title: 'Source Repository', field: 'sourceRepository' },
  ];

  const data = migrations;

  const actions = [
    (rowData: Migration) => ({
      icon: DeleteIcon,
      onClick: () => handleDelete(rowData.id),
      tooltip: 'Delete migration',
    }),
  ];

  const getDetailPanel = ({ rowData }: { rowData: Migration }) => (
    <div>TODO: Details of {rowData.name} migration</div>
  );

  return (
    <Grid container spacing={error ? 3 : 0} direction="column">
      {error && (
        <Grid item>
          <ResponseErrorPanel error={error} />
        </Grid>
      )}

      <Grid item>
        <Table<Migration>
          title={`Migrations (${migrations.length})`}
          options={{
            search: false,
            paging: false,
            actionsColumnIndex: -1,
            padding: 'default',
          }}
          columns={columns}
          data={data}
          actions={actions}
          detailPanel={getDetailPanel}
        />
      </Grid>
    </Grid>
  );
};

export const MigrationList = () => {
  const [refresh, setRefresh] = useState(0);
  const clientService = useClientService();

  const { value, loading, error } = useAsync(clientService.getAllMigrations, [
    clientService.isReady,
    refresh,
  ]);

  if (loading || !clientService.isReady) {
    return <Progress />;
  } else if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  return (
    <DenseTable
      migrations={value || []}
      forceRefresh={() => setRefresh(refresh + 1)}
    />
  );
};
