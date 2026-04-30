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
import { usePersistedPageSize } from '../../hooks/usePersistedPageSize';
import { TableColumn, Progress } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { Box, Chip, Typography } from '@material-ui/core';
import type { ServiceType } from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { catalogApiRef } from '../../apis';
import { DcmSearchTableCard } from '../../components/dcmTabListHelpers';
import { useDcmStyles } from '../../components/dcmStyles';
import emptyIllustration from '../../assets/environments-empty-state.png';
import { DcmDataCenterTabEmptyState } from '../../components/DcmDataCenterTabEmptyState';
import { DcmEmptyCell, TruncatedText } from '../../components/TruncatedText';

// ── Tab content ─────────────────────────────────────────────────────────────

export function ServiceTypesTabContent() {
  const classes = useDcmStyles();
  const catalogApi = useApi(catalogApiRef);

  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = usePersistedPageSize('service-types');

  const load = useCallback(() => {
    setLoading(true);
    catalogApi
      .listServiceTypes()
      .then(res => setServiceTypes(res.results ?? []))
      .catch(() => setServiceTypes([]))
      .finally(() => setLoading(false));
  }, [catalogApi]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return serviceTypes;
    const q = search.toLowerCase();
    return serviceTypes.filter(
      st =>
        (st.service_type ?? '').toLowerCase().includes(q) ||
        (st.api_version ?? '').toLowerCase().includes(q) ||
        (st.uid ?? '').toLowerCase().includes(q),
    );
  }, [serviceTypes, search]);

  const paginated = useMemo(() => {
    const start = page * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const columns = useMemo<TableColumn<ServiceType>[]>(
    () => [
      {
        title: 'Service type',
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
        title: 'API version',
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
        title: 'Path',
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
        title: 'Created',
        field: 'create_time',
        render: st =>
          st.create_time ? (
            <Typography variant="body2">
              {new Date(st.create_time).toLocaleDateString()}
            </Typography>
          ) : (
            <Typography variant="caption" color="textSecondary">
              —
            </Typography>
          ),
      },
    ],
    [classes],
  );

  if (loading) return <Progress />;

  return (
    <Box className={classes.root}>
      {serviceTypes.length === 0 ? (
        <DcmDataCenterTabEmptyState
          title="No service types defined"
          description="Service types define the template schema for catalog items."
          illustrationSrc={emptyIllustration}
        />
      ) : (
        <DcmSearchTableCard<ServiceType>
          title={`Service types (${filtered.length})`}
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
