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
import { TableColumn, Progress } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { Box, Button, Chip, Typography } from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';
import type { ServiceTypeInstance } from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { resourcesApiRef } from '../../apis';
import { extractApiError } from '../../utils/extractApiError';
import { DcmSearchTableCard } from '../../components/dcmTabListHelpers';
import { useDcmStyles } from '../../components/dcmStyles';
import emptyIllustration from '../../assets/environments-empty-state.png';
import { DcmDataCenterTabEmptyState } from '../../components/DcmDataCenterTabEmptyState';
import { DcmEmptyCell, TruncatedText } from '../../components/TruncatedText';
import { usePersistedPageSize } from '../../hooks/usePersistedPageSize';
import { useTranslation } from '../../hooks/useTranslation';

export function ResourcesTabContent() {
  const classes = useDcmStyles();
  const resourcesApi = useApi(resourcesApiRef);
  const { t } = useTranslation();

  const [instances, setInstances] = useState<ServiceTypeInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = usePersistedPageSize('resources');

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    resourcesApi
      .listServiceTypeInstances()
      .then(res => setInstances(res.instances ?? []))
      .catch(err => setLoadError(extractApiError(err)))
      .finally(() => setLoading(false));
  }, [resourcesApi]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const filtered = useMemo(() => {
    if (!search.trim()) return instances;
    const q = search.toLowerCase();
    return instances.filter(
      inst =>
        (inst.id ?? '').toLowerCase().includes(q) ||
        (inst.spec?.service_type ?? '').toLowerCase().includes(q) ||
        (inst.provider_name ?? '').toLowerCase().includes(q) ||
        (inst.status ?? '').toLowerCase().includes(q),
    );
  }, [instances, search]);

  const paginated = useMemo(() => {
    const start = page * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

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

  if (loading) return <Progress />;

  if (loadError) {
    return (
      <Box p={2}>
        <MuiAlert
          severity="error"
          variant="outlined"
          action={
            <Button color="inherit" size="small" onClick={load}>
              {t('common.retry')}
            </Button>
          }
        >
          {loadError}
        </MuiAlert>
      </Box>
    );
  }

  return (
    <Box className={classes.root}>
      {instances.length === 0 ? (
        <DcmDataCenterTabEmptyState
          title={t('resources.emptyTitle')}
          description={t('resources.emptyDescription')}
          illustrationSrc={emptyIllustration}
        />
      ) : (
        <DcmSearchTableCard<ServiceTypeInstance>
          title={(t as any)('resources.cardTitle', { count: filtered.length })}
          data={paginated}
          columns={columns}
          totalCount={filtered.length}
          page={page}
          pageSize={pageSize}
          setPage={setPage}
          setPageSize={setPageSize}
          search={search}
          setSearch={setSearch}
        />
      )}
    </Box>
  );
}
