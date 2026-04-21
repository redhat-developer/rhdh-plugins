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
import { InfoCard, Table } from '@backstage/core-components';
import { Box } from '@material-ui/core';
import {
  DCM_ENTITY_TABLE_COLUMNS,
  DcmTableFilterField,
  useDcmEntityListState,
} from '../../../components/DcmEntitiesTable';
import type {
  ServiceSpec,
  ServiceSpecEntityRow,
} from '../../../data/service-specs';
import { MOCK_SERVICE_SPEC_ENTITIES } from '../../../data/service-specs';
import { useDcmStyles } from '../../../components/dcmStyles';

export function SpecEntitiesTab(props: Readonly<{ spec: ServiceSpec }>) {
  const { spec } = props;
  const classes = useDcmStyles();

  const allEntitiesForSpec = useMemo(
    () => MOCK_SERVICE_SPEC_ENTITIES.filter(e => e.specId === spec.id),
    [spec.id],
  );

  const { filter, setFilter, filteredEntities, entityRowCount } =
    useDcmEntityListState<ServiceSpecEntityRow>(allEntitiesForSpec);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    setPage(0);
  }, [filter, spec.id]);

  const paginatedEntities = useMemo(() => {
    const start = page * pageSize;
    return filteredEntities.slice(start, start + pageSize);
  }, [filteredEntities, page, pageSize]);

  const handlePageChange = useCallback(
    (newPage: number, newPageSize: number) => {
      setPage(newPage);
      setPageSize(newPageSize);
    },
    [],
  );

  const handleRowsPerPageChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(0);
  }, []);

  return (
    <InfoCard
      title={`Entities (${entityRowCount})`}
      action={
        <DcmTableFilterField
          filter={filter}
          setFilter={setFilter}
          classes={classes}
        />
      }
      className={classes.tableCard}
    >
      <Box className={classes.cardContent}>
        <Table<ServiceSpecEntityRow>
          data={paginatedEntities}
          columns={DCM_ENTITY_TABLE_COLUMNS}
          options={{
            paging: true,
            pageSize,
            pageSizeOptions: [5, 10, 25, 50],
            search: false,
            sorting: true,
            padding: 'default',
            toolbar: false,
          }}
          totalCount={filteredEntities.length}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          localization={{
            pagination: {
              labelRowsPerPage: 'rows',
            },
          }}
        />
      </Box>
    </InfoCard>
  );
}
