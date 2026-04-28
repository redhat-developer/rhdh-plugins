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

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { Link } from '@backstage/core-components';
import { useTranslation } from '../../../hooks/useTranslation';

type CardSubheaderProps = {
  aggregationId: string;
  scorecardId: string;
  entitiesCount: number;
  entitiesConsidered?: number;
  calculationErrorCount?: number;
};

export const CardSubheader = ({
  aggregationId,
  scorecardId,
  entitiesCount,
  entitiesConsidered = entitiesCount,
  calculationErrorCount = 0,
}: CardSubheaderProps) => {
  const { t } = useTranslation();
  const totalEntities = Math.max(0, entitiesConsidered);
  const inferredErrorCount = Math.max(0, totalEntities - entitiesCount);
  const effectiveErrorCount = Math.max(
    calculationErrorCount,
    inferredErrorCount,
  );
  const hasCalculationErrors = effectiveErrorCount > 0;
  const healthyEntitiesCount = Math.max(0, totalEntities - effectiveErrorCount);
  const ratioTemplate = t('metric.homepageEntityHealthRatio');
  const entitiesLabel = hasCalculationErrors
    ? ratioTemplate
        .replace('{{healthy}}', String(healthyEntitiesCount))
        .replace('{{total}}', String(totalEntities))
    : t('thresholds.entities', { count: entitiesCount });

  const linkNode = (
    <Link
      to={`/scorecard/aggregations/${encodeURIComponent(
        aggregationId,
      )}/metrics/${encodeURIComponent(scorecardId)}`}
    >
      {entitiesLabel}
    </Link>
  );

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
      {hasCalculationErrors ? (
        <Tooltip
          enterDelay={1500}
          title={t('metric.someEntitiesNotReportingValues')}
          arrow
          placement="right"
        >
          {linkNode}
        </Tooltip>
      ) : (
        linkNode
      )}
    </Box>
  );
};
