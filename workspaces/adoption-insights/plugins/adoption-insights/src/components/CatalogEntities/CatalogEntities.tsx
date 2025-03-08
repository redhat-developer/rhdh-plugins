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
import React from 'react';

import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableFooter from '@mui/material/TableFooter';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';

import CardWrapper from '../CardWrapper';
import {
  CATALOG_ENTITIES_TABLE_HEADERS,
  CATALOG_ENTITIES_TITLE,
} from '../../utils/constants';
import { useCatalogEntities } from '../../hooks/useCatalogEntities';
import TableFooterPagination from '../CardFooter';
import { getCatalogEntityKinds, getLastUsedDay } from '../../utils/utils';
import { CatalogEntities as CatalogEntitiesType } from '../../types';

const Filter = ({
  selectedOption,
  handleChange,
  catalogEntitiesData,
}: {
  selectedOption: string;
  handleChange: (event: SelectChangeEvent<string>) => void;
  catalogEntitiesData: CatalogEntitiesType[];
}) => {
  const menuItems = getCatalogEntityKinds(catalogEntitiesData);

  return (
    <Box sx={{ m: 2, minWidth: 160 }}>
      <FormControl fullWidth>
        <InputLabel id="kind-select">Select kind</InputLabel>
        <Select
          labelId="kind-select"
          renderValue={(selected: string) =>
            selected.length === 0 ? 'Select kind' : selected
          }
          value={selectedOption}
          onChange={handleChange}
          label="Select kind"
        >
          {menuItems.map(kind => (
            <MenuItem key={kind} value={kind}>
              {kind}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

const CatalogEntities = () => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(3);
  const [selectedOption, setSelectedOption] = React.useState('');

  const { catalogEntities, loading } = useCatalogEntities({
    limit: rowsPerPage,
    kind: selectedOption,
  });

  const handleChangePage = React.useCallback(
    (_event: unknown, newPage: number) => {
      setPage(newPage);
    },
    [],
  );

  const handleChangeRowsPerPage = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setRowsPerPage(+event.target.value);
      setPage(0);
    },
    [],
  );

  const handleChange = React.useCallback((event: SelectChangeEvent<string>) => {
    setSelectedOption(event.target.value);
  }, []);

  const visibleCatalogEntities = React.useMemo(() => {
    return catalogEntities.data?.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );
  }, [catalogEntities, page, rowsPerPage]);

  return (
    <CardWrapper
      title={CATALOG_ENTITIES_TITLE}
      filter={
        <Filter
          selectedOption={selectedOption}
          handleChange={handleChange}
          catalogEntitiesData={visibleCatalogEntities}
        />
      }
    >
      <Table aria-labelledby="Catalog entities" sx={{ width: '100%' }}>
        <TableHead>
          <TableRow>
            {CATALOG_ENTITIES_TABLE_HEADERS.map(header => (
              <TableCell
                key={header.id}
                align="left"
                sx={{
                  borderBottom: theme => `1px solid ${theme.palette.grey[300]}`,
                }}
              >
                {header.title}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={CATALOG_ENTITIES_TABLE_HEADERS.length}
                align="center"
              >
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : (
            visibleCatalogEntities?.map(entity => (
              <TableRow
                key={entity.name}
                sx={{
                  '&:nth-of-type(odd)': { backgroundColor: 'inherit' },
                  borderBottom: theme => `1px solid ${theme.palette.grey[300]}`,
                }}
              >
                <TableCell>{entity.name}</TableCell>
                <TableCell>{entity.kind}</TableCell>
                <TableCell>{getLastUsedDay(entity.last_used)}</TableCell>
                <TableCell>{Number(entity.count).toLocaleString()}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell
              colSpan={CATALOG_ENTITIES_TABLE_HEADERS.length}
              sx={{ padding: 0 }}
            >
              <TableFooterPagination
                count={catalogEntities.data?.length}
                rowsPerPage={rowsPerPage}
                page={page}
                handleChangePage={handleChangePage}
                handleChangeRowsPerPage={handleChangeRowsPerPage}
              />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </CardWrapper>
  );
};

export default CatalogEntities;
