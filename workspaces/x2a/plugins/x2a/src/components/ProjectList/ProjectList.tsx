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
  LinkButton,
} from '@backstage/core-components';

import DeleteIcon from '@material-ui/icons/Delete';

import {
  Project,
  ProjectsGet200Response,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { useClientService } from '../../ClientService';
import { Box, Grid } from '@material-ui/core';

type DenseTableProps = {
  forceRefresh: () => void;
  projects: Project[];
};

export const DenseTable = ({ projects, forceRefresh }: DenseTableProps) => {
  const clientService = useClientService();

  const [error, setError] = useState<Error | null>(null);

  const handleDelete = async (id: string) => {
    setError(null);

    try {
      await clientService.projectsProjectIdDelete({ path: { projectId: id } });
      forceRefresh();
    } catch (e) {
      setError(e as Error);
    }
  };

  const columns: TableColumn<Project>[] = [
    { title: 'Name', field: 'name' },
    { title: 'Status', field: 'status' },
    { title: 'Source Repository', field: 'sourceRepository' },
  ];

  const data = projects;

  const actions = [
    (rowData: Project) => ({
      icon: DeleteIcon,
      onClick: () => handleDelete(rowData.id),
      tooltip: 'Delete project',
    }),
  ];

  const getDetailPanel = ({ rowData }: { rowData: Project }) => (
    <div>TODO: Details of {rowData.name} project</div>
  );

  return (
    <Grid container spacing={3} direction="column">
      {error && (
        <Grid item>
          <ResponseErrorPanel error={error} />
        </Grid>
      )}

      <Grid item>
        <Box display="flex" justifyContent="flex-end">
          <LinkButton variant="contained" color="primary" to="/x2a/new-project">
            New Project
          </LinkButton>
        </Box>
      </Grid>

      <Grid item>
        <Table<Project>
          title={`Projects (${projects.length})`}
          options={{
            // TODO: review the options
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

export const ProjectList = () => {
  const [refresh, setRefresh] = useState(0);
  const clientService = useClientService();

  const { value, loading, error } =
    useAsync(async (): Promise<ProjectsGet200Response> => {
      const response = await clientService.projectsGet({
        query: {
          /* TODO: pagination */
        },
      });
      return await response.json();
    }, [refresh, clientService]);

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  return (
    <DenseTable
      projects={value?.items || []}
      forceRefresh={() => setRefresh(refresh + 1)}
    />
  );
};
