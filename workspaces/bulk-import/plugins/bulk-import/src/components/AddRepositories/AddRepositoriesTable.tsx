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

import * as React from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { useFormikContext } from 'formik';

import { AddRepositoriesFormValues, RepositorySelection } from '../../types';
import { AddRepositoriesTableToolbar } from './AddRepositoriesTableToolbar';
import { RepositoriesTable } from './RepositoriesTable';

export const AddRepositoriesTable = ({ title }: { title: string }) => {
  const { values } = useFormikContext<AddRepositoriesFormValues>();
  const [searchString, setSearchString] = React.useState<string>('');
  const [page, setPage] = React.useState<number>(0);
  const handleSearch = (str: string) => {
    setSearchString(str);
    setPage(0);
  };
  return (
    <Box sx={{ width: '100%' }}>
      <Paper style={{ width: '100%' }}>
        <AddRepositoriesTableToolbar
          title={title}
          setSearchString={handleSearch}
          onPageChange={setPage}
        />
        {values.repositoryType === RepositorySelection.Repository ? (
          <RepositoriesTable
            searchString={searchString}
            page={page}
            setPage={setPage}
          />
        ) : (
          <RepositoriesTable
            searchString={searchString}
            page={page}
            setPage={setPage}
            showOrganizations
          />
        )}
      </Paper>
    </Box>
  );
};
