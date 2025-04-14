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

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useFormikContext } from 'formik';

import {
  AddedRepositories,
  AddRepositoriesFormValues,
  RepositorySelection,
} from '../../types';
import { RepositoriesSearchBar } from './RepositoriesSearchBar';

export const AddRepositoriesTableToolbar = ({
  title,
  setSearchString,
  onPageChange,
  activeOrganization,
  selectedReposFromDrawer,
}: {
  title: string;
  setSearchString: (str: string) => void;
  onPageChange?: (page: number) => void;
  activeOrganization?: string;
  selectedReposFromDrawer?: AddedRepositories;
}) => {
  const { setFieldValue, values } =
    useFormikContext<AddRepositoriesFormValues>();
  const [selection, setSelection] = React.useState<string>(
    RepositorySelection.Repository,
  );
  const [search, setSearch] = React.useState<string>('');
  const [selectedReposNumber, setSelectedReposNumber] = React.useState(0);
  const handleToggle = (
    _event: React.MouseEvent<HTMLElement>,
    type: string,
  ) => {
    if (type && onPageChange) {
      setSelection(type);
      setFieldValue('repositoryType', type);
      onPageChange(0);
    }
    setSearchString('');
    setSearch('');
  };

  const handleSearch = (filter: string) => {
    setSearchString(filter);
    setSearch(filter);
  };

  React.useEffect(() => {
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
      {!activeOrganization && (
        <ToggleButtonGroup
          color="primary"
          value={selection}
          exclusive
          onChange={handleToggle}
          aria-label="repository-type"
        >
          <ToggleButton
            value={RepositorySelection.Repository}
            data-testid="repository-view"
          >
            Repository
          </ToggleButton>
          <ToggleButton
            value={RepositorySelection.Organization}
            data-testid="organization-view"
          >
            Organization
          </ToggleButton>
        </ToggleButtonGroup>
      )}
      <RepositoriesSearchBar
        value={search}
        onChange={handleSearch}
        activeOrganization={!!activeOrganization}
      />
    </Toolbar>
  );
};
