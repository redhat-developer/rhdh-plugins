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

import type { PieData } from '../../types';
import Stack from '@mui/material/Stack';
import { useTranslation } from '../../../hooks/useTranslation';
import { formatAggregationScoreDetail, TooltipContent } from './TooltipContent';

export const LegendTooltipContent = ({
  row,
  maxPossible,
}: {
  row: PieData;
  maxPossible: number | undefined;
}) => {
  const { t } = useTranslation();
  const count = row.value;
  const unitScore = row.score ?? 0;
  const rowTotal = count * unitScore;
  const percentLabel =
    maxPossible && maxPossible > 0
      ? `${((rowTotal / maxPossible) * 100).toFixed(1).replace(/\.0$/, '')}%`
      : '—';

  return (
    <Stack direction="column">
      <TooltipContent
        label={t('metric.averageLegendTooltipEntitiesEach', {
          count,
          score: formatAggregationScoreDetail(unitScore),
        } as any)}
      />
      <TooltipContent
        label={t('metric.averageLegendTooltipRowTotal', {
          total: formatAggregationScoreDetail(rowTotal),
        } as any)}
        value={percentLabel}
      />
    </Stack>
  );
};
