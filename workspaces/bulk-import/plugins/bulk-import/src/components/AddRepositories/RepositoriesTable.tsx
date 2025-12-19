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

import type { ChangeEvent, MouseEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import { makeStyles } from '@mui/styles';
import { useFormikContext } from 'formik';

import { useRepositories } from '../../hooks';
import { useTranslation } from '../../hooks/useTranslation';
import {
  AddedRepositories,
  AddRepositoriesFormValues,
  AddRepositoryData,
  Order,
  RepositoryStatus,
} from '../../types';
import {
  evaluateRowForOrg,
  evaluateRowForRepo,
  filterSelectedForActiveDrawer,
  filterSelectedRepositoriesOnActivePage,
  getComparator,
  updateWithNewSelectedRepositories,
} from '../../utils/repository-utils';
import { AddRepositoriesDrawer } from './AddRepositoriesDrawer';
import { RepositoriesHeader } from './RepositoriesHeader';
import { RepositoriesTableBody } from './RepositoriesTableBody';

const useStyles = makeStyles(() => ({
  repositoriesTableFixedColumns: {
    '& th:nth-child(1), & td:nth-child(1)': {
      width: '20%',
    },
    '& th:nth-child(2), & td:nth-child(2)': {
      width: '30%',
    },
    '& th:nth-child(3), & td:nth-child(3)': {
      width: '20%',
    },
    '& th:nth-child(4), & td:nth-child(4)': {
      width: '30%',
    },
  },
}));

export const RepositoriesTable = ({
  searchString,
  page,
  setPage,
  showOrganizations = false,
  drawerOrganization,
  isApprovalToolGitlab = false,
  updateSelectedReposInDrawer,
}: {
  searchString: string;
  page?: number;
  setPage?: (page: number) => void;
  showOrganizations?: boolean;
  drawerOrganization?: string;
  isApprovalToolGitlab?: boolean;
  updateSelectedReposInDrawer?: (repos: AddedRepositories) => void;
}) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const { setFieldValue, values, setStatus } =
    useFormikContext<AddRepositoriesFormValues>();
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<string>();
  const [selected, setSelected] = useState<AddedRepositories>({});
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tableData, setTableData] = useState<AddRepositoryData[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeOrganization, setActiveOrganization] =
    useState<AddRepositoryData | null>();
  const [localPage, setLocalPage] = useState(0);
  const [drawerPage, setDrawerPage] = useState(0);

  const { loading, data, error } = useRepositories({
    showOrganizations,
    orgName: drawerOrganization,
    page: (drawerOrganization ? drawerPage : localPage) + 1,
    querySize: rowsPerPage,
    searchString,
    approvalTool: values.approvalTool,
  });

  useEffect(() => {
    if (drawerOrganization) {
      setDrawerPage(0);
    } else {
      setLocalPage(page || 0);
    }
  }, [drawerOrganization, localPage, page]);

  useEffect(() => {
    if (drawerOrganization) {
      setSelected(values.repositories);
    }
  }, [drawerOrganization, values?.repositories]);

  // Sync local selected state with form values
  useEffect(() => {
    if (!drawerOrganization) {
      setSelected(values.repositories || {});
    }
  }, [values.repositories, drawerOrganization]);

  useEffect(() => {
    if (showOrganizations) {
      setTableData(Object.values(data?.organizations || {}));
    } else {
      setTableData(Object.values(data?.repositories || {}));
    }
  }, [data, showOrganizations]);

  const filteredData = useMemo(() => {
    let filteredRows = !showOrganizations
      ? evaluateRowForRepo(tableData, values.repositories)
      : evaluateRowForOrg(tableData, values.repositories);

    filteredRows = [...(filteredRows || [])]?.sort(
      getComparator(order, orderBy as string),
    );

    return filteredRows;
  }, [tableData, order, orderBy, values?.repositories, showOrganizations]);

  const handleRequestSort = (_event: MouseEvent<unknown>, property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const updateSelectedRepositories = useCallback(
    (newSelected: AddedRepositories) => {
      setFieldValue(
        'repositories',
        updateWithNewSelectedRepositories(values.repositories, newSelected),
      );
    },
    [setFieldValue, values],
  );

  const effectivePage = drawerOrganization ? drawerPage : page || 0;
  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    effectivePage > 0 ? Math.max(0, rowsPerPage - tableData.length) : 0;

  const handleClickAllForRepositoriesTable = (drawer?: boolean) => {
    let newSelectedRows: AddedRepositories = { ...selected };

    const rowsEligibleForSelection = filteredData.filter(
      r => !values.excludedRepositories[r.id],
    );
    const isAllSelected = rowsEligibleForSelection.every(
      row => selected[row.id],
    );

    rowsEligibleForSelection.forEach(row => {
      if (isAllSelected) {
        delete newSelectedRows[row.id];
      } else {
        if (!drawer) {
          setFieldValue(
            `repositories.${row.repoName}.catalogInfoYaml.status`,
            RepositoryStatus.Ready,
          );
        }
        newSelectedRows = { ...newSelectedRows, [row.id]: row };
      }
    });

    setSelected(newSelectedRows);
    if (drawer) {
      updateSelectedReposInDrawer?.(newSelectedRows);
    } else {
      updateSelectedRepositories(newSelectedRows);
    }
  };
  const handleSelectAllClick = (_event: ChangeEvent<HTMLInputElement>) => {
    if (drawerOrganization) {
      handleClickAllForRepositoriesTable(true);
    } else {
      handleClickAllForRepositoriesTable();
    }
  };

  const updateSelection = (newSelected: AddedRepositories) => {
    setSelected(newSelected);
    setStatus(null);

    if (drawerOrganization && updateSelectedReposInDrawer) {
      // Update in the context of the drawer
      updateSelectedReposInDrawer(newSelected);
    } else {
      // Update outside the drawer, in main context
      updateSelectedRepositories(newSelected);
    }
  };

  const handleClick = (_event: MouseEvent, repo: AddRepositoryData) => {
    let newSelected;
    if (selected[repo.id]) {
      newSelected = { ...selected };
      delete newSelected[repo.id];
    } else {
      newSelected = { ...selected, [repo.id]: repo };
    }
    updateSelection(newSelected);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    if (drawerOrganization) {
      setDrawerPage(newPage);
    } else {
      setLocalPage(newPage);
      if (setPage) {
        setPage(newPage);
      }
    }
  };

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    if (drawerOrganization) {
      setDrawerPage(0);
    } else {
      setLocalPage(0);
      if (setPage) {
        setPage(0);
      }
    }
  };

  const handleOrgRowSelected = useCallback((org: AddRepositoryData) => {
    setActiveOrganization(org);
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setActiveOrganization(null);
  }, [setIsOpen]);

  const handleUpdatesFromDrawer = useCallback(
    (drawerSelected: AddedRepositories) => {
      if (drawerSelected) {
        setSelected(drawerSelected);
        updateSelectedRepositories(drawerSelected);
      }
    },
    [updateSelectedRepositories, setSelected],
  );

  const selectedForActiveDrawer = useMemo(
    () => filterSelectedForActiveDrawer(tableData || [], selected),
    [tableData, selected],
  );
  const selectedRepositoriesOnActivePage = useMemo(
    () => filterSelectedRepositoriesOnActivePage(filteredData, selected),
    [filteredData, selected],
  );
  const getRowCount = () => {
    if (drawerOrganization) {
      return tableData?.filter(
        r =>
          !Object.keys(values.excludedRepositories).find(
            ex => ex === r.repoName,
          ),
      )?.length;
    }
    return tableData?.length;
  };

  const ariaLabel = () => {
    if (drawerOrganization) {
      return 'drawer-repositories-table';
    }
    if (showOrganizations) {
      return 'organizations-table';
    }
    return 'repositories-table';
  };

  return (
    <>
      <TableContainer style={{ padding: '0 24px', height: '100%' }}>
        {error && Object.keys(error).length > 0 && (
          <div style={{ paddingBottom: '16px' }}>
            <Alert severity="error">
              <AlertTitle>{error?.name}</AlertTitle>
              {error?.message ||
                (Array.isArray(error?.errors) && error.errors.length > 1
                  ? error?.errors?.join('\n')
                  : error.errors)}
            </Alert>
          </div>
        )}
        <Table
          style={{ minWidth: 750, height: '70%' }}
          size="small"
          data-testid={ariaLabel()}
          className={classes.repositoriesTableFixedColumns}
        >
          <RepositoriesHeader
            numSelected={
              drawerOrganization
                ? Object.keys(selectedForActiveDrawer).length
                : selectedRepositoriesOnActivePage.length
            }
            isDataLoading={loading}
            order={order}
            orderBy={orderBy}
            onSelectAllClick={handleSelectAllClick}
            onRequestSort={handleRequestSort}
            rowCount={getRowCount() || 0}
            showOrganizations={drawerOrganization ? false : showOrganizations}
            isRepoSelectDrawer={!!drawerOrganization}
            isApprovalToolGitlab={isApprovalToolGitlab}
          />
          <RepositoriesTableBody
            loading={loading}
            ariaLabel={ariaLabel()}
            rows={filteredData}
            emptyRows={emptyRows}
            onOrgRowSelected={handleOrgRowSelected}
            onClick={handleClick}
            selectedRepos={selected}
            isDrawer={!!drawerOrganization}
            isApprovalToolGitlab={isApprovalToolGitlab}
            showOrganizations={showOrganizations}
          />
        </Table>
        {!isOpen && tableData?.length > 0 && (
          <TablePagination
            style={{ height: '30%' }}
            rowsPerPageOptions={[
              { value: 5, label: t('table.pagination.rows5') },
              { value: 10, label: t('table.pagination.rows10') },
              { value: 20, label: t('table.pagination.rows20') },
              { value: 50, label: t('table.pagination.rows50') },
              { value: 100, label: t('table.pagination.rows100') },
            ]}
            component="div"
            count={
              (showOrganizations
                ? data?.totalOrganizations
                : data?.totalRepositories) || 0
            }
            rowsPerPage={rowsPerPage}
            page={effectivePage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage={null}
          />
        )}
      </TableContainer>
      {showOrganizations && activeOrganization && (
        <AddRepositoriesDrawer
          title={`${t('addRepositories.selectedLabel')} ${isApprovalToolGitlab ? t('addRepositories.selectedProjects') : t('addRepositories.selectedRepositories')}`}
          orgData={activeOrganization}
          onSelect={handleUpdatesFromDrawer}
          open={isOpen}
          onClose={handleClose}
        />
      )}
    </>
  );
};
