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

import { Box, Button, Grid, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  root: {
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(4),
  },
  grid: {
    alignItems: 'center',
  },
  copy: {
    paddingRight: theme.spacing(2),
  },
  headline: {
    fontWeight: 700,
    fontSize: theme.typography.pxToRem(20),
    marginBottom: theme.spacing(2),
  },
  body: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(3),
    maxWidth: 520,
    lineHeight: 1.5,
    fontSize: theme.typography.pxToRem(14),
  },
  illustrationWrap: {
    textAlign: 'center',
  },
  illustration: {
    maxWidth: 360,
    width: '100%',
    height: 'auto',
    display: 'inline-block',
    verticalAlign: 'middle',
  },
}));

export type DcmDataCenterTabEmptyStateProps = Readonly<{
  title: string;
  description: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  /** Bundled image URL (e.g. `import x from '...png'`) */
  illustrationSrc: string;
}>;

/**
 * Empty state for Data Center tabs when there is no data yet (not when search filters return no rows).
 */
export function DcmDataCenterTabEmptyState({
  title,
  description,
  primaryActionLabel,
  onPrimaryAction,
  illustrationSrc,
}: DcmDataCenterTabEmptyStateProps) {
  const classes = useStyles();
  return (
    <Box className={classes.root}>
      <Grid container spacing={4} className={classes.grid}>
        <Grid item xs={12} md={6} className={classes.copy}>
          <Typography component="h2" variant="h5" className={classes.headline}>
            {title}
          </Typography>
          <Typography variant="body2" className={classes.body}>
            {description}
          </Typography>
          {primaryActionLabel && onPrimaryAction && (
            <Button
              variant="contained"
              color="primary"
              onClick={onPrimaryAction}
            >
              {primaryActionLabel}
            </Button>
          )}
        </Grid>
        <Grid item xs={12} md={6} className={classes.illustrationWrap}>
          <img src={illustrationSrc} alt="" className={classes.illustration} />
        </Grid>
      </Grid>
    </Box>
  );
}
