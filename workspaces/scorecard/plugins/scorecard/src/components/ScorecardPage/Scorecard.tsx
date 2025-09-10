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

import { ChartDonut } from '@patternfly/react-charts/victory';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';

interface ScorecardProps {
  cardTitle: string;
  description: string;
  loading: boolean;
  statusColor: string;
  StatusIcon: React.ElementType;
  value: number;
  thresholds: { key: string; expression: string }[];
}

const Scorecard = ({
  cardTitle,
  description,
  loading,
  statusColor,
  StatusIcon,
  value,
  thresholds,
}: ScorecardProps) => {
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
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" style={{ fontWeight: 500 }}>
            {cardTitle}
          </Typography>
        </Box>
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
                <ChartDonut
                  constrainToVisibleArea
                  data={[{ x: cardTitle, y: value === 0 ? 1 : value }]}
                  height={200}
                  width={200}
                  colorScale={[statusColor]}
                />
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
                  <StatusIcon sx={{ color: statusColor, fontSize: 24 }} />
                  <Typography
                    variant="h6"
                    style={{ color: statusColor, fontWeight: 600 }}
                  >
                    {value}
                  </Typography>
                </Box>
              </>
            )}
          </Box>

          <Box sx={{ p: 0 }}>
            {thresholds.map(({ key, expression }) => (
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
                        error: 'red',
                        warning: 'orange',
                        success: 'green',
                      }[key] || 'green',
                    marginRight: 8,
                  }}
                />
                <Typography variant="body2">
                  {key} {expression && `${expression}`}
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
