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
import { styled, useTheme } from '@mui/material/styles';

interface ScorecardProps {
  cardTitle: string;
  description: string;
  loading: boolean;
  statusColor: string;
  StatusIcon: React.ElementType;
  value?: MetricValue;
  thresholds?: ThresholdResult;
}

const StyledCircle = styled('circle')(
  ({ theme, statusColor }: { theme: any; statusColor: string }) => ({
    stroke: theme.palette[statusColor.split('.')[0]].main,
  }),
);

const Scorecard = ({
  cardTitle,
  description,
  loading,
  statusColor,
  StatusIcon,
  value,
  thresholds,
}: ScorecardProps) => {
  const theme = useTheme();

  return (
    <Card
      style={{
        width: '364px',
        borderRadius: 8,
        border: '2px solid #0000001f',
        boxShadow: 'none',
      }}
    >
      <CardContent style={{ padding: 0 }}>
        <CardHeader
          title={cardTitle}
          titleTypographyProps={{ variant: 'h6', fontWeight: 500 }}
          sx={{ pb: 2 }}
        />
        <Divider />
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="textSecondary">
            {description}
          </Typography>
        </Box>

        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{ p: 2 }}
        >
          <Box position="relative" width={200} height={200}>
            {loading ? (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <CircularProgress />
              </Box>
            ) : (
              <>
                <svg width="200" height="200">
                  <StyledCircle
                    cx="100"
                    cy="100"
                    r="75"
                    strokeWidth="10"
                    fill="none"
                    statusColor={statusColor}
                    theme={theme}
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
                  <StatusIcon
                    sx={{
                      color: (muiTheme: any) =>
                        muiTheme.palette[statusColor.split('.')[0]].main,
                      fontSize: 24,
                    }}
                  />
                  <Typography
                    variant="h6"
                    sx={{
                      color: (muiTheme: any) =>
                        muiTheme.palette[statusColor.split('.')[0]].main,
                      fontWeight: 600,
                    }}
                  >
                    {value}
                  </Typography>
                </Box>
              </>
            )}
          </Box>

          <Box sx={{ p: 0 }}>
            {thresholds?.definition.rules.map(({ key, expression }) => (
              <div
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    backgroundColor:
                      {
                        error: theme.palette.error.main,
                        warning: theme.palette.warning.main,
                        success: theme.palette.success.main,
                      }[key] || theme.palette.success.main,
                    marginRight: 8,
                  }}
                />
                <Typography variant="body2">
                  {key.charAt(0).toUpperCase() + key.slice(1)}{' '}
                  {expression && `${expression}`}
                </Typography>
              </div>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Scorecard;
