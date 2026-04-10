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

import { useEffect } from 'react';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import { useMetric } from '../../../hooks/useMetric';
import { useMetricDisplayLabels } from '../../../hooks/useMetricDisplayLabels';
import { useTranslation } from '../../../hooks/useTranslation';

interface EntitiesTableStateRowProps {
  colSpan: number;
  error?: Error;
  metricId?: string;
  noEntities?: boolean;
  setMetricTitle?: (title: string) => void;
}

export const EntitiesTableStateRow = ({
  colSpan,
  error,
  metricId,
  setMetricTitle,
  noEntities = false,
}: EntitiesTableStateRowProps) => {
  const { t } = useTranslation();

  const { metric } = useMetric({ metricId: metricId as string });

  const { title: metricTitle } = useMetricDisplayLabels(metric);

  useEffect(() => {
    if (setMetricTitle) {
      setMetricTitle(metricTitle ?? '');
    }
  }, [metricTitle, setMetricTitle]);

  const isMissingPermission = error?.message?.includes('NotAllowedError');
  const noEntitiesFound = !isMissingPermission && !error && noEntities;

  let content = null;
  if (isMissingPermission) {
    content = t('entitiesPage.missingPermission');
  } else if (noEntitiesFound) {
    content = t('entitiesPage.noDataFound');
  }

  return (
    <TableRow key="entities-table-state-row">
      <TableCell colSpan={colSpan} align="center">
        {content}
      </TableCell>
    </TableRow>
  );
};
