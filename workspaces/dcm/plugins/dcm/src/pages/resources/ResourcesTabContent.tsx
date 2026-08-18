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
import { TableColumn, Progress } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { Box, Button, Chip, Typography } from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';
import type { ServiceTypeInstance } from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { resourcesApiRef } from '../../apis';
import { DcmSearchTableCard } from '../../components/dcmTabListHelpers';
import { useDcmStyles } from '../../components/dcmStyles';
import emptyIllustration from '../../assets/environments-empty-state.png';
import { DcmDataCenterTabEmptyState } from '../../components/DcmDataCenterTabEmptyState';
import { DcmEmptyCell, TruncatedText } from '../../components/TruncatedText';
import { usePersistedPageSize } from '../../hooks/usePersistedPageSize';
import { usePaginatedFetch } from '../../hooks/usePaginatedFetch';
import { useTranslation } from '../../hooks/useTranslation';

export function ResourcesTabContent() {
  const classes = useDcmStyles();
  const resourcesApi = useApi(resourcesApiRef);
  const { t } = useTranslation();

  const [pageSize, setPageSize] = usePersistedPageSize('resources');
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
  } = usePaginatedFetch<ServiceTypeInstance>({
    fetchFn: ({ pageToken, pageSize: ps }) =>
      resourcesApi
        .listServiceTypeInstances({ page_token: pageToken, max_page_size: ps })
        .then(res => ({
          items: res.instances ?? [],
          nextPageToken: res.next_page_token ?? '',
        })),
    pageSize,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      inst =>
        (inst.id ?? '').toLowerCase().includes(q) ||
        (inst.spec?.service_type ?? '').toLowerCase().includes(q) ||
        (inst.provider_name ?? '').toLowerCase().includes(q) ||
        (inst.status ?? '').toLowerCase().includes(q),
    );
  }, [data, search]);

  const columns = useMemo<TableColumn<ServiceTypeInstance>[]>(
    () => [
      {
        title: t('resources.columns.id'),
        field: 'id',
        render: inst => (
          <TruncatedText
            text={inst.id}
            variant="body2"
            bold
            maxWidth={280}
            fallback={<DcmEmptyCell />}
          />
        ),
      },
      {
        title: t('resources.columns.serviceType'),
        field: 'spec.service_type',
        render: inst =>
          inst.spec?.service_type ? (
            <Chip
              label={inst.spec.service_type}
              size="small"
              className={classes.apiVersionChip}
            />
          ) : (
            <DcmEmptyCell />
          ),
      },
      {
        title: t('resources.columns.provider'),
        field: 'provider_name',
        render: inst => (
          <TruncatedText
            text={inst.provider_name}
            variant="body2"
            bold={false}
            maxWidth={200}
            fallback={<DcmEmptyCell />}
          />
        ),
      },
      {
        title: t('resources.columns.status'),
        field: 'status',
        render: inst =>
          inst.status ? (
            <Typography variant="body2">{inst.status}</Typography>
          ) : (
            <DcmEmptyCell />
          ),
      },
      {
        title: t('resources.columns.created'),
        field: 'create_time',
        render: inst =>
          inst.create_time ? (
            <Typography variant="body2">
              {new Date(inst.create_time).toLocaleDateString()}
            </Typography>
          ) : (
            <DcmEmptyCell />
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
          title={t('resources.emptyTitle')}
          description={t('resources.emptyDescription')}
          illustrationSrc={emptyIllustration}
        />
      ) : (
        <DcmSearchTableCard<ServiceTypeInstance>
          title={(t as any)('resources.cardTitle', { count: filtered.length })}
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
