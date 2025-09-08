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
import { ResponseErrorPanel } from '@backstage/core-components';
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
import { useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';

import CardWrapper from '../CardWrapper';
import InfoComponent from './Info';
import CustomTooltip from './Tooltip';
import { useUsers } from '../../hooks/useUsers';
import EmptyChartState from '../Common/EmptyChartState';
import { useTranslation } from '../../hooks/useTranslation';

const Users = () => {
  const theme = useTheme();
  const { t } = useTranslation();

  const { users, loading, error } = useUsers();

  if (error) {
    return (
      <CardWrapper title={t('users.title')} filter={<InfoComponent />}>
        <ResponseErrorPanel error={error} />
      </CardWrapper>
    );
  }

  if (
    (!users || users.data?.length === 0 || (!users.data?.[0] && !loading)) &&
    !error
  ) {
    return (
      <CardWrapper title={t('users.title')} filter={<InfoComponent />}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={80}
        >
          <EmptyChartState />
        </Box>
      </CardWrapper>
    );
  }

  const { logged_in_users = 0, licensed_users = 0 } = users?.data?.[0] ?? {};

  const loggedInPercentage =
    logged_in_users && licensed_users
      ? Math.round((Number(logged_in_users) / Number(licensed_users)) * 100) ||
        0
      : 0;

  const data = [
    {
      name: t('users.loggedInUsers'),
      value: Number(logged_in_users),
      color: '#00AEEF',
    },
    {
      name: t('users.licensedNotLoggedIn'),
      value: Number(licensed_users) - Number(logged_in_users),
      color: '#E5E5E5',
    },
  ];

  return (
    <CardWrapper title={t('users.title')} filter={<InfoComponent />}>
      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height={200}
        >
          <CircularProgress />
        </Box>
      ) : (
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
                      value={logged_in_users.toLocaleString('en-US')}
                      position="center"
                      style={{
                        fontSize: '24px',
                        fill: theme.palette.text.primary,
                        textAnchor: 'middle',
                      }}
                    />
                    <Label
                      value={t('users.ofTotal' as any, {
                        total: licensed_users.toLocaleString('en-US'),
                      })}
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
                    content={
                      <CustomTooltip
                        licensed_users={licensed_users}
                        logged_in_users={logged_in_users}
                      />
                    }
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
                <ListItemText primary={t('users.loggedInUsers')} />
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
                <ListItemText primary={t('users.licensedNotLoggedIn')} />
              </ListItem>
            </List>
          </Box>

          <Box flex={3} gap={2}>
            <Typography
              variant="h1"
              fontWeight="bold"
              sx={{ fontSize: '54px' }}
            >
              {loggedInPercentage}%
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {t('users.haveLoggedIn')}
            </Typography>
          </Box>
        </Box>
      )}
    </CardWrapper>
  );
};

export default Users;
