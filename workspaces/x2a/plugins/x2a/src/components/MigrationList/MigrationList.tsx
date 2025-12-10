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
import {
  Table,
  TableColumn,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import useAsync from 'react-use/lib/useAsync';
import { Button } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';

export const migrationsMock = {
  results: [
    {
      name: 'Migration 1',
      status: 'Pending',
      sourceRepository: 'https://github.com/org/repo',
    },
    {
      name: 'Migration 2',
      status: 'Completed',
      sourceRepository: 'https://github.com/org/repo',
    },
  ],
};

type Migration = {
  name: string;
  status: string;
  sourceRepository: string;
};

type DenseTableProps = {
  migrations: Migration[];
};

export const DenseTable = ({ migrations }: DenseTableProps) => {
  const columns: TableColumn[] = [
    { title: 'Name', field: 'name' },
    { title: 'Status', field: 'status' },
    { title: 'Source Repository', field: 'sourceRepository' },
    { title: 'Actions', field: 'actions' },
  ];

  const data = migrations.map(migration => {
    return {
      name: migration.name,
      status: migration.status,
      sourceRepository: migration.sourceRepository,
      actions: (
        <>
          <Button variant="text" color="default">
            <DeleteIcon />
          </Button>
        </>
      ),
    };
  });

  return (
    <Table
      title={`Migrations (${migrations.length})`}
      options={{ search: false, paging: false }}
      columns={columns}
      data={data}
    />
  );
};

export const MigrationList = () => {
  const { value, loading, error } = useAsync(async (): Promise<Migration[]> => {
    // Would use fetch in a real world example
    return migrationsMock.results;
  }, []);

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  return <DenseTable migrations={value || []} />;
};
