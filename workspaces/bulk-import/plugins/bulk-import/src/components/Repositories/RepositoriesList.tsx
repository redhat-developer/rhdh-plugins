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

import type { MouseEvent } from 'react';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Table } from '@backstage/core-components';

import Box from '@mui/material/Box';
import TablePagination from '@mui/material/TablePagination';

import { useGitlabConfigured } from '../../hooks';
import { useAddedRepositories } from '../../hooks/useAddedRepositories';
import { useTranslation } from '../../hooks/useTranslation';
import {
  AddedRepositoryColumnNameEnum,
  AddRepositoryData,
  SortingOrderEnum,
} from '../../types';
import { RepositoriesHeader } from '../AddRepositories/RepositoriesHeader';
import { useDeleteDialog } from '../DeleteDialogContext';
import { useDrawer } from '../DrawerContext';
import { AddedRepositoriesTableBody } from './AddedRepositoriesTableBody';
import DeleteRepositoryDialog from './DeleteRepositoryDialog';
import EditCatalogInfo from './EditCatalogInfo';
import { RepositoriesAddLink } from './RepositoriesAddLink';
import { getRepositoriesListColumns } from './RepositoriesListColumns';

export const RepositoriesList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const { t } = useTranslation();
  const [order, setOrder] = useState<SortingOrderEnum>(SortingOrderEnum.Asc);
  const [orderBy, setOrderBy] = useState<string>('repoName');
  const { openDialog, setOpenDialog, deleteComponent } = useDeleteDialog();
  const { openDrawer, setOpenDrawer, drawerData } = useDrawer();
  const [pageNumber, setPageNumber] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const gitlabConfigured = useGitlabConfigured();

  const orderByColumn = useMemo(() => {
    return orderBy?.replace(/\.([a-zA-Z])/g, (_, char) =>
      char.toUpperCase('en-US'),
    ) as keyof typeof AddedRepositoryColumnNameEnum;
  }, [orderBy]);
  const {
    data: importJobs,
    error: errJobs,
    loading,
    refetch,
  } = useAddedRepositories(
    pageNumber + 1,
    rowsPerPage,
    debouncedSearch,
    AddedRepositoryColumnNameEnum[orderByColumn],
    order,
  );

  const closeDialog = () => {
    setOpenDialog(false);
    refetch();
  };

  const closeDrawer = () => {
    queryParams.delete('repository');
    queryParams.delete('defaultBranch');
    navigate({
      pathname: location.pathname,
      search: `?${queryParams.toString()}`,
    });
    setOpenDrawer(false);
  };

  const handleRequestSort = (_event: MouseEvent<unknown>, property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? SortingOrderEnum.Desc : SortingOrderEnum.Asc);
    setOrderBy(property);
  };

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    pageNumber > 0 ? Math.max(0, rowsPerPage - importJobs.totalJobs) : 0;

  const handleSearch = (str: string) => {
    setDebouncedSearch(str);
    setPageNumber(0);
  };
  const baseTitle = gitlabConfigured
    ? t('repositories.importedEntities')
    : t('repositories.addedRepositories');

  const getTitleWithCount = () => {
    if (gitlabConfigured) {
      return t('repositories.importedEntitiesCount' as any, {
        count: importJobs.totalJobs.toString(),
      });
    }
    return t('repositories.addedRepositoriesCount' as any, {
      count: importJobs.totalJobs.toString(),
    });
  };

  const finalTitle =
    importJobs?.totalJobs === 0 ? baseTitle : getTitleWithCount();
  return (
    <>
      <RepositoriesAddLink />
      <Table
        data={importJobs.addedRepositories ?? []}
        columns={getRepositoriesListColumns(t, gitlabConfigured)}
        onSearchChange={handleSearch}
        title={finalTitle}
        options={{
          search: true,
        }}
        localization={{
          toolbar: {
            searchPlaceholder: t('common.filter'),
          },
        }}
        components={{
          Header: () => (
            <RepositoriesHeader
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              showImportJobs
            />
          ),
          Body: () => (
            <AddedRepositoriesTableBody
              error={errJobs}
              loading={loading}
              rows={importJobs.addedRepositories || []}
              emptyRows={emptyRows}
            />
          ),

          Pagination: () => (
            <TablePagination
              rowsPerPageOptions={[
                { value: 5, label: t('table.pagination.rows5') },
                { value: 10, label: t('table.pagination.rows10') },
                { value: 20, label: t('table.pagination.rows20') },
                { value: 50, label: t('table.pagination.rows50') },
                { value: 100, label: t('table.pagination.rows100') },
              ]}
              component="div"
              count={importJobs.totalJobs || 0}
              rowsPerPage={rowsPerPage}
              page={pageNumber}
              onPageChange={(_event, page: number) => {
                setPageNumber(page);
              }}
              onRowsPerPageChange={event => {
                setRowsPerPage(event.target.value as unknown as number);
              }}
              labelRowsPerPage={null}
            />
          ),
        }}
        emptyContent={
          <Box
            data-testid="no-import-jobs-found"
            sx={{
              padding: 2,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            {t(
              gitlabConfigured
                ? 'repositories.noProjectsFound'
                : 'repositories.noRecordsFound',
            )}
          </Box>
        }
      />
      {openDrawer && (
        <EditCatalogInfo
          open={openDrawer}
          onClose={closeDrawer}
          importStatus={drawerData}
        />
      )}
      {openDialog && (
        <DeleteRepositoryDialog
          open={openDialog}
          closeDialog={closeDialog}
          repository={deleteComponent as AddRepositoryData}
        />
      )}
    </>
  );
};
