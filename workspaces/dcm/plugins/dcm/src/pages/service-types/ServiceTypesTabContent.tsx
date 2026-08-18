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

import { useMemo, useState } from 'react';
import { usePersistedPageSize } from '../../hooks/usePersistedPageSize';
import { usePaginatedFetch } from '../../hooks/usePaginatedFetch';
import { TableColumn, Progress } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { Box, Button, Chip, Typography } from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';
import type { ServiceType } from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { catalogApiRef } from '../../apis';
import { DcmSearchTableCard } from '../../components/dcmTabListHelpers';
import { useDcmStyles } from '../../components/dcmStyles';
import emptyIllustration from '../../assets/environments-empty-state.png';
import { DcmDataCenterTabEmptyState } from '../../components/DcmDataCenterTabEmptyState';
import { DcmEmptyCell, TruncatedText } from '../../components/TruncatedText';
import { useTranslation } from '../../hooks/useTranslation';

// ── Tab content ─────────────────────────────────────────────────────────────

export function ServiceTypesTabContent() {
  const classes = useDcmStyles();
  const catalogApi = useApi(catalogApiRef);
  const { t } = useTranslation();

  const [pageSize, setPageSize] = usePersistedPageSize('service-types');
  const [search, setSearch] = useState('');

  const {
    data,
    loading,
    error,
    hasNext,
    hasPrev,
    goNext,
    goPrev,
    resetToFirstPage,
  } = usePaginatedFetch<ServiceType>({
    fetchFn: ({ pageToken, pageSize: ps }) =>
      catalogApi
        .listServiceTypes({ page_token: pageToken, max_page_size: ps })
        .then(res => ({
          items: res.results ?? [],
          nextPageToken: res.next_page_token ?? '',
        })),
    pageSize,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      st =>
        (st.service_type ?? '').toLowerCase().includes(q) ||
        (st.api_version ?? '').toLowerCase().includes(q) ||
        (st.uid ?? '').toLowerCase().includes(q),
    );
  }, [data, search]);

  const columns = useMemo<TableColumn<ServiceType>[]>(
    () => [
      {
        title: t('serviceTypes.columns.serviceType'),
        field: 'service_type',
        render: st => (
          <Box className={classes.nameCellBox}>
            <TruncatedText
              text={st.service_type}
              variant="body2"
              bold
              maxWidth={220}
              fallback={<DcmEmptyCell />}
            />
            {st.uid && (
              <TruncatedText
                text={st.uid}
                variant="caption"
                color="textSecondary"
                bold={false}
                maxWidth={220}
                fallback={<DcmEmptyCell />}
              />
            )}
          </Box>
        ),
      },
      {
        title: t('serviceTypes.columns.apiVersion'),
        field: 'api_version',
        render: st => (
          <Chip
            label={st.api_version}
            size="small"
            className={classes.apiVersionChip}
          />
        ),
      },
      {
        title: t('serviceTypes.columns.path'),
        field: 'path',
        render: st => (
          <TruncatedText
            text={st.path}
            variant="caption"
            color="textSecondary"
            bold={false}
            maxWidth={200}
            fallback={<DcmEmptyCell />}
          />
        ),
      },
      {
        title: t('serviceTypes.columns.created'),
        field: 'create_time',
        render: st =>
          st.create_time ? (
            <Typography variant="body2">
              {new Date(st.create_time).toLocaleDateString()}
            </Typography>
          ) : (
            <Typography variant="caption" color="textSecondary">
              -
            </Typography>
          ),
      },
    ],
    [classes, t],
  );

  if (loading && data.length === 0) return <Progress />;

  if (error) {
    return (
      <Box p={2}>
        <MuiAlert
          severity="error"
          variant="outlined"
          action={
            <Button color="inherit" size="small" onClick={resetToFirstPage}>
              {t('common.retry')}
            </Button>
          }
        >
          {error}
        </MuiAlert>
      </Box>
    );
  }

  return (
    <Box className={classes.root}>
      {data.length === 0 && !hasPrev ? (
        <DcmDataCenterTabEmptyState
          title={t('serviceTypes.emptyTitle')}
          description={t('serviceTypes.emptyDescription')}
          illustrationSrc={emptyIllustration}
        />
      ) : (
        <DcmSearchTableCard<ServiceType>
          title={(t as any)('serviceTypes.cardTitle', {
            count: filtered.length,
          })}
          data={filtered}
          columns={columns}
          totalCount={filtered.length}
          page={1}
          pageSize={pageSize}
          setPage={() => {}}
          setPageSize={setPageSize}
          search={search}
          setSearch={setSearch}
          cursorPagination={{
            hasNext,
            hasPrev,
            onNext: goNext,
            onPrev: goPrev,
            loading,
            pageSize,
            onPageSizeChange: setPageSize,
          }}
        />
      )}
    </Box>
  );
}
