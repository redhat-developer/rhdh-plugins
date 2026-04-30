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

import { FC, ReactNode } from 'react';

import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import Tooltip from '@mui/material/Tooltip';

import { useTranslation } from '../../../hooks/useTranslation';

interface EntitiesTableWrapperProps {
  children: ReactNode;
  title: string;
  /** When true, show a warning that at least one visible entity had a metric calculation failure. */
  showCalculationWarning?: boolean;
}

export const EntitiesTableWrapper: FC<EntitiesTableWrapperProps> = ({
  children,
  title,
  showCalculationWarning = false,
}) => {
  const { t } = useTranslation();

  return (
    <Paper elevation={1} sx={{ borderRadius: '1rem', width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          variant="h3"
          sx={{
            p: 3,
            display: 'flex',
            alignItems: 'center',
            fontWeight: 'bold',
          }}
        >
          {title}
          {showCalculationWarning && (
            <Tooltip
              title={t('metric.someEntitiesNotReportingValues')}
              arrow
              placement="right"
              sx={{
                ml: 0.5,
                cursor: 'pointer',
              }}
            >
              <ReportProblemOutlinedIcon color="warning" fontSize="small" />
            </Tooltip>
          )}
        </Typography>
      </Box>
      <Box sx={{ pl: 3, pr: 3 }}>{children}</Box>
    </Paper>
  );
};
