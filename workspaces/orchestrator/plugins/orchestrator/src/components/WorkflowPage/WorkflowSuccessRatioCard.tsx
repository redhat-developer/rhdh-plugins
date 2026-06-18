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

import { InfoCard } from '@backstage/core-components';

import InfoOutlined from '@mui/icons-material/InfoOutlined';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';

import { WorkflowOverviewDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { VALUE_UNAVAILABLE } from '../../constants';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCompactCount } from '../../utils/formatCompactCount';
import { useIsDarkMode } from '../../utils/isDarkMode';

const DONUT_SIZE = 120;
const DONUT_RADIUS = 40;
const DONUT_STROKE = 12;

const useStyles = makeStyles<{ isDarkMode: boolean }>()(
  (theme, { isDarkMode }) => ({
    headerIcon: {
      color: isDarkMode ? theme.palette.grey[400] : theme.palette.grey[700],
    },
    legendSwatch: {
      width: 12,
      height: 12,
      borderRadius: 2,
      flexShrink: 0,
    },
  }),
);

const SuccessRatioDonut = ({
  successCount,
  totalCount,
}: {
  successCount: number;
  totalCount: number;
}) => {
  const theme = useTheme();
  const successColor = theme.palette.success.main;
  const errorColor = theme.palette.error.main;

  const circumference = 2 * Math.PI * DONUT_RADIUS;
  const safeTotal = Math.max(totalCount, 1);
  const successLength = (successCount / safeTotal) * circumference;

  return (
    <Box
      sx={{
        position: 'relative',
        width: DONUT_SIZE,
        height: DONUT_SIZE,
        flexShrink: 0,
      }}
    >
      <svg
        width={DONUT_SIZE}
        height={DONUT_SIZE}
        viewBox="0 0 100 100"
        role="img"
        aria-hidden
      >
        <circle
          cx="50"
          cy="50"
          r={DONUT_RADIUS}
          fill="none"
          stroke={errorColor}
          strokeWidth={DONUT_STROKE}
        />
        <circle
          cx="50"
          cy="50"
          r={DONUT_RADIUS}
          fill="none"
          stroke={successColor}
          strokeWidth={DONUT_STROKE}
          strokeDasharray={`${successLength} ${circumference}`}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          px: 1,
        }}
      >
        <Typography
          variant="subtitle2"
          component="div"
          sx={{ fontWeight: 700 }}
        >
          {formatCompactCount(successCount)}
        </Typography>
        <Typography variant="caption" color="text.secondary" component="div">
          of {formatCompactCount(totalCount)}
        </Typography>
      </Box>
    </Box>
  );
};

export const WorkflowSuccessRatioCard = ({
  workflowOverview,
  loading,
}: {
  workflowOverview?: WorkflowOverviewDTO;
  loading: boolean;
}) => {
  const { t } = useTranslation();
  const isDarkMode = useIsDarkMode();
  const { classes } = useStyles({ isDarkMode });
  const theme = useTheme();

  const stats = workflowOverview?.workflowRunStats;
  const successCount = stats?.successCount ?? 0;
  const totalCount =
    stats?.totalCount ?? successCount + (stats?.errorCount ?? 0);
  const hasStats =
    stats !== undefined &&
    totalCount > 0 &&
    stats.successRatio !== undefined &&
    Number.isFinite(stats.successRatio);
  const successPercent = hasStats
    ? Math.round((stats.successRatio ?? 0) * 100)
    : undefined;

  const title = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      <Typography
        component="span"
        variant="inherit"
        sx={{ fontWeight: 'bold' }}
      >
        {t('workflow.successRatio')}
      </Typography>
      <Tooltip title={t('workflow.successRatioDescription')}>
        <IconButton
          size="large"
          aria-label={t('workflow.successRatioDescription')}
          sx={{ mr: '8px', p: 0.5 }}
        >
          <InfoOutlined fontSize="small" className={classes.headerIcon} />
        </IconButton>
      </Tooltip>
    </Box>
  );

  const renderBody = () => {
    if (loading) {
      return <Skeleton variant="rounded" height={140} />;
    }
    if (!hasStats) {
      return <Typography>{VALUE_UNAVAILABLE}</Typography>;
    }
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          flexWrap: 'wrap',
        }}
      >
        <SuccessRatioDonut
          successCount={successCount}
          totalCount={totalCount}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              className={classes.legendSwatch}
              sx={{ backgroundColor: theme.palette.success.main }}
            />
            <Typography variant="body2">
              {t('workflow.statsSuccess')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              className={classes.legendSwatch}
              sx={{ backgroundColor: theme.palette.error.main }}
            />
            <Typography variant="body2">{t('workflow.statsFailed')}</Typography>
          </Box>
        </Box>
        <Box>
          <Typography
            variant="h3"
            component="div"
            sx={{ fontWeight: 700, lineHeight: 1.1 }}
          >
            {successPercent}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('workflow.runSuccess')}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
      <InfoCard
        title={title}
        titleTypographyProps={{ component: 'div', style: { width: '100%' } }}
      >
        {renderBody()}
      </InfoCard>
    </Box>
  );
};
