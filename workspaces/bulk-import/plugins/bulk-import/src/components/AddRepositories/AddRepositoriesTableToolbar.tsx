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

import { useEffect, useState } from 'react';

import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useFormikContext } from 'formik';

import { AddedRepositories, AddRepositoriesFormValues } from '../../types';
import { RepositoriesSearchBar } from './RepositoriesSearchBar';

export const AddRepositoriesTableToolbar = ({
  title,
  setSearchString,
  activeOrganization,
  selectedReposFromDrawer,
}: {
  title: string;
  setSearchString: (str: string) => void;
  activeOrganization?: string;
  selectedReposFromDrawer?: AddedRepositories;
}) => {
  const { values } = useFormikContext<AddRepositoriesFormValues>();
  const [search, setSearch] = useState<string>('');
  const [selectedReposNumber, setSelectedReposNumber] = useState(0);

  const handleSearch = (filter: string) => {
    setSearchString(filter);
    setSearch(filter);
  };

  useEffect(() => {
    if (activeOrganization && selectedReposFromDrawer) {
      const thisSelectedReposCount = Object.values(
        selectedReposFromDrawer,
      )?.filter(repo => repo.orgName === activeOrganization).length;
      setSelectedReposNumber(thisSelectedReposCount || 0);
    } else {
      setSelectedReposNumber(
        values.repositories ? Object.values(values.repositories).length : 0,
      );
    }
  }, [selectedReposFromDrawer, values.repositories, activeOrganization]);

  return (
    <Toolbar
      sx={{
        paddingTop: '14px',
        paddingBottom: '14px',
      }}
    >
      <Typography
        sx={{ flex: '1 1 100%', fontWeight: 'bold' }}
        variant="h5"
        id={title}
      >
        {`${title} (${selectedReposNumber})`}
      </Typography>
      <RepositoriesSearchBar
        value={search}
        onChange={handleSearch}
        activeOrganization={!!activeOrganization}
      />
    </Toolbar>
  );
};
