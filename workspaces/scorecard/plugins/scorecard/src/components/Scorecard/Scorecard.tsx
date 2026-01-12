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

import {
  MetricValue,
  ThresholdResult,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import { styled, useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from '../../hooks/useTranslation';

interface ScorecardProps {
  cardTitle: string;
  description: string;
  loading: boolean;
  statusColor: string;
  StatusIcon: React.ElementType;
  value: MetricValue | null;
  thresholds?: ThresholdResult;
  isMetricDataError?: boolean;
  metricDataError?: string;
  isThresholdError?: boolean;
  thresholdError?: string;
}

const StyledCircle = styled('circle')(
  ({
    theme,
    statusColor,
    isError,
  }: {
    theme: any;
    statusColor: string;
    isError: boolean;
  }) => {
    const [paletteKey, shade] = statusColor.split('.');
    return {
      stroke: isError
        ? theme.palette.rhdh.general.cardBorderColor
        : theme.palette?.[paletteKey]?.[shade] ?? statusColor,
    };
  },
);

const Scorecard = ({
  cardTitle,
  description,
  loading,
  statusColor,
  StatusIcon,
  value,
  thresholds,
  isMetricDataError = false,
  metricDataError,
  isThresholdError = false,
  thresholdError,
}: ScorecardProps) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Card sx={{ width: '405px' }} role="article">
      <CardHeader title={cardTitle} titleTypographyProps={{ mb: 0 }} />
      <Divider />
      <CardContent>
        <Box sx={{ px: 1, pb: 2 }}>
          <Typography variant="body2" color="textSecondary">
            {description}
          </Typography>
        </Box>

        <Box sx={{ px: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Box
                  position="relative"
                  width={160}
                  height={160}
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor:
                      isMetricDataError || isThresholdError
                        ? 'pointer'
                        : 'default',
                  }}
                >
                  {loading ? (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <CircularProgress size={120} />
                    </Box>
                  ) : (
                    <Tooltip
                      title={
                        // eslint-disable-next-line no-nested-ternary
                        isMetricDataError
                          ? metricDataError
                          : isThresholdError
                          ? thresholdError
                          : undefined
                      }
                      arrow
                      slotProps={{
                        tooltip: {
                          sx: {
                            cursor:
                              isMetricDataError || isThresholdError
                                ? 'pointer'
                                : 'default',
                          },
                        },
                      }}
                    >
                      <Box position="relative" width={160} height={160}>
                        <svg width="160" height="160">
                          <StyledCircle
                            cx="80"
                            cy="80"
                            r="75"
                            strokeWidth="10"
                            fill="none"
                            statusColor={statusColor}
                            theme={theme}
                            isError={isMetricDataError || isThresholdError}
                          />
                        </svg>
                        <Box
                          position="absolute"
                          top="50%"
                          left="50%"
                          sx={{
                            transform: 'translate(-50%, -50%)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                          }}
                        >
                          {!isMetricDataError && !isThresholdError && (
                            <StatusIcon
                              sx={{
                                color: (muiTheme: any) =>
                                  muiTheme.palette[statusColor.split('.')[0]][
                                    statusColor.split('.')[1]
                                  ],
                                fontSize: 20,
                              }}
                            />
                          )}
                          <Typography
                            variant="h6"
                            sx={{
                              color: (muiTheme: any) => {
                                if (isMetricDataError || isThresholdError) {
                                  return muiTheme.palette[
                                    statusColor.split('.')[0]
                                  ]?.[statusColor.split('.')[1]]?.[
                                    statusColor.split('.')[2]
                                  ];
                                }
                                return muiTheme.palette[
                                  statusColor.split('.')[0]
                                ]?.[statusColor.split('.')[1]];
                              },
                              fontWeight:
                                isMetricDataError || isThresholdError
                                  ? 400
                                  : 500,
                              textAlign: 'center',
                              fontSize:
                                isMetricDataError || isThresholdError ? 14 : 24,
                            }}
                          >
                            {isMetricDataError &&
                              t('errors.metricDataUnavailable')}
                            {!isMetricDataError &&
                              isThresholdError &&
                              t('errors.invalidThresholds')}
                            {!isThresholdError && !isMetricDataError && value}
                          </Typography>
                        </Box>
                      </Box>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} sx={{ p: 2, paddingRight: 0 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  pl: 1.5,
                  pt: 2,
                }}
              >
                {thresholds?.definition?.rules.length === 0 ||
                thresholds?.definition?.rules === undefined ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        backgroundColor: theme.palette.grey['400'],
                        flexShrink: 0,
                      }}
                    />{' '}
                    --
                  </Box>
                ) : (
                  thresholds?.definition?.rules.map(({ key, expression }) => (
                    <Box
                      key={key}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          backgroundColor:
                            {
                              error: theme.palette.error.main,
                              warning: theme.palette.warning.main,
                              success: theme.palette.success.main,
                            }[key] || theme.palette.success.main,
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          wordBreak: 'break-word',
                          lineHeight: 1.2,
                        }}
                      >
                        {(() => {
                          const translated = t(`thresholds.${key}` as any, {});
                          // If translation returns the key itself, fallback to capitalized key
                          return translated === `thresholds.${key}`
                            ? key.charAt(0).toUpperCase() + key.slice(1)
                            : translated;
                        })()}{' '}
                        {expression && `${expression}`}
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Scorecard;
