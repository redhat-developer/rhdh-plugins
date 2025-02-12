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
import { makeStyles, Theme } from '@material-ui/core';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import React from 'react';

const useStyles = makeStyles((theme: Theme) => ({
  footer: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
  },
}));

export const SandboxCatalogFooter = () => {
  const classes = useStyles();
  return (
    <Box className={classes.footer} component="footer">
      <Typography variant="body1" color="textPrimary" align="center">
        Have an activation code?
        <Link
          href="https://developers.redhat.com/rhdh/overview"
          target="_blank"
          underline="none"
        >
          {' '}
          Click here
        </Link>
      </Typography>
    </Box>
  );
};
