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

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';

import type { EntityMetricDetail } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableFooter from '@mui/material/TableFooter';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import CircularProgress from '@mui/material/CircularProgress';

import { useOwnershipEntityRefs } from '../../../hooks/useOwnershipEntityRefs';
import { useAggregatedScorecardEntities } from '../../../hooks/useAggregatedScorecardEntities';
import { useAggregatedScorecard } from '../../../hooks/useAggregatedScorecard';
import { useEntityMetadataMap } from '../../../hooks/useEntityMetadataMap';
import {
  SCORECARD_ENTITIES_TABLE_HEADERS,
  SCORECARD_LOADING_ARIA_LABEL,
} from '../../../utils';
import { useTranslation } from '../../../hooks/useTranslation';

import { EntitiesTableStateRow } from './EntitiesTableStateRow';
import { EntitiesTableWrapper } from './EntitiesTableWrapper';
import { EntitiesTableHeader } from './EntitiesTableHeader';
import { EntitiesTableFooter } from './EntitiesTableFooter';
import { EntitiesRow } from './EntitiesRow';

interface EntitiesTableProps {
  metricId?: string;
  aggregationId?: string;
  setMetricTitle: (title: string) => void;
  setMetricNotFound?: (notFound: boolean) => void;
}

export const EntitiesTable = ({
  metricId,
  aggregationId,
  setMetricTitle,
  setMetricNotFound,
}: EntitiesTableProps) => {
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const { t } = useTranslation();

  const [sortState, setSortState] = useState<{
    orderBy: string | null;
    order: 'asc' | 'desc';
  }>({
    orderBy: null,
    order: 'asc',
  });

  const { orderBy, order } = sortState;

  const { ownershipEntityRefs, loading: ownershipLoading } =
    useOwnershipEntityRefs();

  // TODO: Remove metricId once we deprecate it. We need to keep it for backward compatibility.
  const resolvedMetricId = aggregationId || metricId || '';

  const {
    aggregatedScorecardEntities,
    loadingData: loadingDataEntities,
    error: entitiesError,
  } = useAggregatedScorecardEntities({
    metricId: metricId as string,
    page,
    pageSize: rowsPerPage,
    ownershipEntityRefs,
    orderBy,
    order,
    enabled: !ownershipLoading,
  });

  const { data: aggregatedScorecard } = useAggregatedScorecard({
    aggregationId: resolvedMetricId,
    enabled: !!metricId && !ownershipLoading && !loadingDataEntities,
  });

  const thresholdRules = aggregatedScorecard?.result?.thresholds?.rules ?? [];

  useEffect(() => {
    if (entitiesError?.message?.includes('NotFoundError')) {
      setMetricNotFound?.(true);
    }
  }, [entitiesError, setMetricNotFound]);

  useEffect(() => {
    setMetricTitle(aggregatedScorecard?.metadata?.title ?? '');
  }, [aggregatedScorecard?.metadata?.title, setMetricTitle]);

  const handleChangeRowsPerPage = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(Number(event.target.value));
    },
    [],
  );

  const handleSortRequest = useCallback((columnId: string) => {
    setSortState(prev =>
      prev.orderBy !== columnId
        ? { orderBy: columnId, order: 'asc' }
        : { ...prev, order: prev.order === 'asc' ? 'desc' : 'asc' },
    );
  }, []);

  const entityRefs = useMemo(
    () =>
      aggregatedScorecardEntities?.entities?.map(
        (entity: { entityRef: string }) => entity.entityRef,
      ) ?? [],
    [aggregatedScorecardEntities],
  );

  const { entityMetadataMap } = useEntityMetadataMap(entityRefs);

  const entities = aggregatedScorecardEntities?.entities ?? [];

  const total = aggregatedScorecardEntities?.pagination?.total ?? 0;
  const entitiesTableTitle =
    total > 0
      ? t('entitiesPage.entitiesTable.titleWithCount', { count: total } as any)
      : t('entitiesPage.entitiesTable.title');

  return (
    <EntitiesTableWrapper title={entitiesTableTitle} isError={!!entitiesError}>
      <Table sx={{ width: '100%', tableLayout: 'fixed' }}>
        <EntitiesTableHeader
          orderBy={orderBy}
          order={order}
          onSortRequest={handleSortRequest}
        />

        <TableBody>
          {(ownershipLoading || loadingDataEntities) && (
            <TableRow key="entities-table-loading-row">
              <TableCell
                colSpan={SCORECARD_ENTITIES_TABLE_HEADERS.length}
                align="center"
              >
                <CircularProgress aria-label={SCORECARD_LOADING_ARIA_LABEL} />
              </TableCell>
            </TableRow>
          )}

          {!ownershipLoading && !loadingDataEntities && entitiesError && (
            <EntitiesTableStateRow
              colSpan={SCORECARD_ENTITIES_TABLE_HEADERS.length}
              error={entitiesError}
              metricId={metricId}
              setMetricTitle={setMetricTitle}
            />
          )}

          {!ownershipLoading &&
            !loadingDataEntities &&
            !entitiesError &&
            entities.length === 0 && (
              <EntitiesTableStateRow
                colSpan={SCORECARD_ENTITIES_TABLE_HEADERS.length}
                metricId={metricId}
                setMetricTitle={setMetricTitle}
                noEntities={entities.length === 0}
              />
            )}

          {!ownershipLoading &&
            !loadingDataEntities &&
            entities.length > 0 &&
            entities.map((entity: EntityMetricDetail) => (
              <EntitiesRow
                key={entity.entityRef}
                entity={entity}
                entityMetadataMap={entityMetadataMap}
                thresholdRules={thresholdRules}
              />
            ))}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell
              colSpan={SCORECARD_ENTITIES_TABLE_HEADERS.length}
              sx={{
                padding: 0,
              }}
            >
              <EntitiesTableFooter
                count={aggregatedScorecardEntities?.pagination?.total ?? 0}
                page={page}
                rowsPerPage={rowsPerPage}
                handleChangePage={(_event, newPage) => setPage(newPage)}
                handleChangeRowsPerPage={handleChangeRowsPerPage}
              />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </EntitiesTableWrapper>
  );
};
