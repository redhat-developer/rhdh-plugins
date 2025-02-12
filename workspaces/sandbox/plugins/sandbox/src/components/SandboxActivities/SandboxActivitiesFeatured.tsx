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
import Typography from '@mui/material/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { ItemCardGrid } from '@backstage/core-components';
import { Box } from '@material-ui/core';
import { SandboxActivitiesCard } from './SandboxActivitiesCard';

const useStyles = makeStyles(theme => ({
  root: {
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '36px 240px 48px 60px',
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
  },
}));

export const SandboxActivitiesFeatured: React.FC = () => {
  const classes = useStyles();

  return (
    <Box className={classes.root}>
      <Typography
        variant="h3"
        color="textPrimary"
        style={{ fontWeight: 700, marginBottom: '32px' }}
        gutterBottom
      >
        Featured
      </Typography>
      <ItemCardGrid>
        {[...Array(3).keys()].map(index => (
          <SandboxActivitiesCard index={index} />
        ))}
      </ItemCardGrid>
    </Box>
  );
};
