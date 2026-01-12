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

const Tooltip = ({ active, payload, licensed_users }: any) => {
  if (active && payload?.length) {
    // Calculate percentage based on the actual value in the segment
    // Since the data now correctly represents each segment, we can calculate directly
    const percent = Math.round((payload[0].value / licensed_users) * 100);

    const { value } = payload[0];

    return (
      <Paper
        elevation={1}
        sx={{
          padding: '8px',
          borderRadius: '4px',
          boxShadow: '0px 0px 6px rgba(0, 0, 0, 0.1)',
          border: theme => `1px solid ${theme.palette.grey[300]}`,
        }}
      >
        <Typography
          style={{ fontSize: '0.875rem', margin: 0, fontWeight: '500' }}
        >
          {value.toLocaleString('en-US')}
        </Typography>
        <Typography
          style={{
            fontSize: '2rem',
            margin: 0,
            color: '#009596',
            fontWeight: '500',
          }}
        >
          {percent}%
        </Typography>
      </Paper>
    );
  }
  return null;
};

export default Tooltip;
