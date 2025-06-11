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
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { format } from 'date-fns';

const CustomTooltip = ({
  active,
  payload,
  label,
  grouping,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  grouping?: string;
}) => {
  const theme = useTheme();

  if (active && payload?.length) {
    const date = label ? new Date(label) : new Date();
    return (
      <Paper
        elevation={1}
        sx={{
          padding: '12px 16px',
          boxShadow: 4,
          borderRadius: 2,
        }}
      >
        <Typography
          sx={{
            fontSize: '0.875rem',
            fontWeight: 500,
            marginBottom: '12px',
          }}
        >
          {grouping === 'hourly'
            ? format(date, 'MMMM dd, yyyy hh:mm a')
            : format(date, 'MMMM, dd yyyy')}
        </Typography>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box mr={3}>
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: theme.palette.text.secondary,
              }}
            >
              Returning users
            </Typography>
            <Typography
              sx={{
                fontSize: '2.5rem',
                fontWeight: 500,
                color: '#009596',
                lineHeight: 1.2,
              }}
            >
              {payload[0]?.value}
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: theme.palette.text.secondary,
              }}
            >
              New users
            </Typography>
            <Typography
              sx={{
                fontSize: '2.5rem',
                fontWeight: 500,
                color: '#009596',
                lineHeight: 1.2,
              }}
            >
              {payload[1]?.value}
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  }
  return null;
};

export default CustomTooltip;
