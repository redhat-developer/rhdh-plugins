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
import { ChartDonut, ChartThemeColor } from '@patternfly/react-charts/victory';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';

export const Scorecard = () => {
  const openPRs = 22;

  // Determine status
  let statusColor = ChartThemeColor.gray;

  if (openPRs >= 10 && openPRs <= 50) {
    statusColor = '#F0AB00';
  } else if (openPRs > 50) {
    statusColor = '#C9190B';
  }

  return (
    <Card
      style={{
        width: '364px',
        borderRadius: 8,
        border: '2px solid #ffffff1f', // #0000001f
        boxShadow: 'none',
      }}
    >
      <CardContent style={{ padding: 0 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" style={{ fontWeight: 500 }}>
            Github open PRs
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Current count of open Pull Requests for a given GitHub repository.
          </Typography>
        </Box>

        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{ p: 2 }}
        >
          <Box position="relative" width={200} height={200}>
            {/* ChartDonut */}
            <ChartDonut
              ariaDesc="Open PRs donut chart"
              ariaTitle="Open PRs"
              constrainToVisibleArea
              data={[{ x: 'Open PRs', y: openPRs }]}
              height={200}
              width={200}
              colorScale={[statusColor]}
            />

            {/* Overlay Content */}
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
              <WarningAmberIcon sx={{ color: statusColor, fontSize: 28 }} />
              <Typography
                variant="h6"
                style={{ color: statusColor, fontWeight: 600 }}
              >
                {openPRs}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ p: 0 }}>
            <div
              style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: '#3E8635',
                  marginRight: 8,
                }}
              />
              <Typography variant="body2">Ideal &lt; 10</Typography>
            </div>
            <div
              style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: '#F0AB00',
                  marginRight: 8,
                }}
              />
              <Typography variant="body2">Warning 10-50</Typography>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: '#C9190B',
                  marginRight: 8,
                }}
              />
              <Typography variant="body2">Critical &gt; 50</Typography>
            </div>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Scorecard;
