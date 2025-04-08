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

import { EmptyState } from '@backstage/core-components';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import { PermissionRequiredIcon } from './PermissionRequiredIcon';

const PermissionRequiredState = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        alignItems: 'center',
        padding: '100px',
      }}
    >
      <EmptyState
        title="Missing permissions"
        description={
          <Typography variant="subtitle1" component="span">
            To view Adoption Insights plugin, contact your administrator to give
            the <b>adoption-insights.events.read</b> permissions.
          </Typography>
        }
        missing={{ customImage: <PermissionRequiredIcon /> }}
        action={
          <Button
            variant="outlined"
            color="primary"
            target="_blank"
            href="https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/adoption-insights/plugins/adoption-insights/README.md#permission-framework-support"
          >
            Read more &nbsp; <OpenInNewIcon />
          </Button>
        }
      />
    </Box>
  );
};

export default PermissionRequiredState;
