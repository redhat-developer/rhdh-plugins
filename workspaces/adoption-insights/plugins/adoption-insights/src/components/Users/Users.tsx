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
import React from 'react';

import {
  Cell,
  Label,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MuiTooltip from '@mui/material/Tooltip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';

import CardWrapper from '../CardWrapper';

const totalUsers = 4578;
const loggedInUsers = 1789;
const loggedInPercentage = Math.round((loggedInUsers / totalUsers) * 100);

const data = [
  { name: 'Logged-in users', value: 4578, color: '#00AEEF' },
  { name: 'Licensed', value: 4578 - 1789, color: '#E5E5E5' },
];

const CustomTooltip = ({ active, payload, percentage }: any) => {
  if (active && payload?.length) {
    const { name, value } = payload[0];

    return (
      <Paper
        elevation={1}
        sx={{
          backgroundColor: 'white',
          padding: '8px',
          borderRadius: '4px',
          boxShadow: '0px 0px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #ddd',
        }}
      >
        <Typography style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>
          {name}
        </Typography>
        <Typography style={{ fontSize: '12px', margin: 0 }}>
          {value.toLocaleString()} users
        </Typography>
        <Typography style={{ fontSize: '12px', margin: 0 }}>
          {percentage}%
        </Typography>
      </Paper>
    );
  }
  return null;
};

const InfoComponent = () => {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', mr: 2 }}>
      <MuiTooltip
        title={
          <Box sx={{ textAlign: 'center', width: '238px' }}>
            Set the number of licensed users in the app-config.yaml
          </Box>
        }
        placement="left"
        componentsProps={{
          tooltip: {
            sx: {
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              bgcolor: '#151515',
              color: 'white',
              fontSize: 14,
              p: 1.5,
            },
          },
        }}
      >
        <IconButton>
          <InfoOutlinedIcon
            sx={{ color: theme.palette.text.secondary, fontSize: 28 }}
          />
        </IconButton>
      </MuiTooltip>
    </Box>
  );
};

const Users = () => {
  const theme = useTheme();

  return (
    <CardWrapper title="Total number of users" filter={<InfoComponent />}>
      <Box
        display="flex"
        alignItems="center"
        gap={2}
        justifyContent="flex-start"
      >
        <Box display="flex" alignItems="center" flex={7}>
          <Box sx={{ width: '100%', maxWidth: '240px' }}>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="60%"
                  outerRadius="70%"
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  {data.map(entry => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}

                  <Label
                    value={loggedInUsers.toLocaleString()}
                    position="center"
                    style={{
                      fontSize: '24px',
                      fill: theme.palette.text.primary,
                      textAnchor: 'middle',
                    }}
                  />
                  <Label
                    value={`of ${totalUsers.toLocaleString()}`}
                    position="center"
                    dy={20}
                    style={{
                      fontSize: '14px',
                      textAnchor: 'middle',
                      fill: theme.palette.text.secondary,
                    }}
                  />
                </Pie>
                <Tooltip
                  content={<CustomTooltip percentage={loggedInPercentage} />}
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>

          <List dense>
            <ListItem key="logged-in users" disableGutters>
              <ListItemIcon sx={{ minWidth: 24 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    bgcolor: '#00AEEF',
                    borderRadius: '2px',
                  }}
                />
              </ListItemIcon>
              <ListItemText primary="Logged-in users" />
            </ListItem>
            <ListItem key="licensed users" disableGutters>
              <ListItemIcon sx={{ minWidth: 24 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    bgcolor: '#E5E5E5',
                    borderRadius: '2px',
                  }}
                />
              </ListItemIcon>
              <ListItemText primary="Licensed" />
            </ListItem>
          </List>
        </Box>

        <Box flex={3} gap={2}>
          <Typography variant="h1" fontWeight="bold" sx={{ fontSize: '54px' }}>
            {loggedInPercentage}%
          </Typography>
          <Typography variant="body1" color="textSecondary">
            have logged in
          </Typography>
        </Box>
      </Box>
    </CardWrapper>
  );
};

export default Users;
