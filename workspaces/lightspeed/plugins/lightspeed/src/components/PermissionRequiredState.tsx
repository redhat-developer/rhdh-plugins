/*
 * Copyright 2024 The Backstage Authors
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

import { EmptyState } from '@backstage/core-components';

import { Button, Typography } from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { PermissionRequiredIcon } from './PermissionRequiredIcon';

const useStyles = makeStyles(() =>
  createStyles({
    permissionError: {
      display: 'flex',
      height: '100%',
      alignItems: 'center',
      padding: '100px',
    },
  }),
);

const PermissionRequiredState = () => {
  const classes = useStyles();

  return (
    <div className={classes.permissionError}>
      <EmptyState
        title="Missing permissions"
        description={
          <Typography variant="subtitle1">
            To view lightspeed plugin, contact your administrator to give the{' '}
            <b>lightspeed.conversations.read</b> and{' '}
            <b>lightspeed.conversations.create</b> permissions.
          </Typography>
        }
        missing={{ customImage: <PermissionRequiredIcon /> }}
        action={
          <Button
            variant="outlined"
            color="primary"
            target="_blank"
            href="https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/lightspeed/plugins/lightspeed/README.md#permission-framework-support"
          >
            Read more &nbsp; <OpenInNewIcon />
          </Button>
        }
      />
    </div>
  );
};
export default PermissionRequiredState;
