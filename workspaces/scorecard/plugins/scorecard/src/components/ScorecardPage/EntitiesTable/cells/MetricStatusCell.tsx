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

import { memo } from 'react';

import Box from '@mui/material/Box';
import { useTranslation } from '../../../../hooks/useTranslation';

export const MetricStatusCell = memo(
  ({ status, theme }: { status: string | undefined; theme: any }) => {
    const { t } = useTranslation();

    let translatedStatus = t(`thresholds.${status}` as any, {});
    if (translatedStatus === `thresholds.${status}` && status) {
      translatedStatus = status?.charAt(0).toUpperCase() + status?.slice(1);
    }
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            width: 10,
            height: 10,
            backgroundColor: status
              ? theme.palette[status]?.main ?? theme.palette.success.main
              : theme.palette.success.main,
            flexShrink: 0,
          }}
        />
        {(status && translatedStatus) || '--'}
      </Box>
    );
  },
);
