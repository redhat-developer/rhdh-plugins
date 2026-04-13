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

import { type PropsWithChildren } from 'react';
import { Box, Typography, makeStyles } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
  field: {
    marginBottom: theme.spacing(2.5),
    '&:last-child': {
      marginBottom: 0,
    },
  },
  label: {
    display: 'block',
    fontSize: theme.typography.pxToRem(12),
    fontWeight: 400,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.75),
    lineHeight: 1.4,
  },
  value: {
    fontSize: theme.typography.pxToRem(14),
    fontWeight: 400,
    color: theme.palette.text.primary,
    lineHeight: 1.5,
  },
}));

export type OverviewFieldProps = PropsWithChildren<{
  label: string;
}>;

/** Stacked label + value used in Overview cards (environments, service specs, etc.). */
export function OverviewField({ label, children }: OverviewFieldProps) {
  const classes = useStyles();
  return (
    <Box className={classes.field}>
      <Typography component="p" className={classes.label}>
        {label}
      </Typography>
      <Typography component="div" className={classes.value}>
        {children}
      </Typography>
    </Box>
  );
}
