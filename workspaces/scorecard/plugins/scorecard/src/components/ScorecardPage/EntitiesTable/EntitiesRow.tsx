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

import type { EntityMetricDetail } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import { useTheme } from '@mui/material/styles';

import { getLastUpdatedLabel } from '../../../utils';
import { useTranslation } from '../../../hooks/useTranslation';
import { EntityMetadataMap } from '../../../components/types';

import { MetricStatusCell } from './cells/MetricStatusCell';
import { OwnerCell } from './cells/OwnerCell';
import { EntityNameCell } from './cells/EntityNameCell';

export const EntitiesRow = ({
  entity,
  entityMetadataMap,
}: {
  entity: EntityMetricDetail;
  entityMetadataMap: EntityMetadataMap;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <TableRow
      key={entity.entityRef}
      sx={{
        '&:nth-of-type(odd)': { backgroundColor: 'inherit' },
        borderBottom: (muiTheme: any) =>
          `1px solid ${muiTheme.palette.grey[300]}`,
      }}
    >
      <TableCell width="12%">
        <MetricStatusCell status={entity?.status ?? undefined} theme={theme} />
      </TableCell>

      <TableCell width="8%">
        {entity.metricValue || entity.metricValue === 0
          ? entity.metricValue
          : t('entitiesPage.entitiesTable.unavailable')}
      </TableCell>

      <TableCell width="28%">
        <EntityNameCell
          entityRef={entity.entityRef}
          entityMetadata={entityMetadataMap[entity.entityRef]}
        />
      </TableCell>

      <TableCell width="20%">
        <OwnerCell ownerRef={entity.owner} />
      </TableCell>

      <TableCell width="12%">{entity.entityKind}</TableCell>

      <TableCell width="20%">
        {entity.timestamp ? getLastUpdatedLabel(entity.timestamp) : '--'}
      </TableCell>
    </TableRow>
  );
};
