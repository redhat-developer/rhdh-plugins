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

import Stack from '@mui/material/Stack';
import { TooltipContent } from './TooltipContent';
import { useTranslation } from '../../../hooks/useTranslation';

export const DonutChartTooltipContent = ({
  weightedSum,
  maxPossible,
}: {
  weightedSum: number | undefined;
  maxPossible: number | undefined;
}) => {
  const { t } = useTranslation();

  return (
    <Stack direction="row" spacing={3}>
      <TooltipContent
        label={t('metric.averageCenterTooltipTotalLabel')}
        value={weightedSum}
      />
      <TooltipContent
        label={t('metric.averageCenterTooltipMaxLabel')}
        value={maxPossible}
      />
    </Stack>
  );
};
