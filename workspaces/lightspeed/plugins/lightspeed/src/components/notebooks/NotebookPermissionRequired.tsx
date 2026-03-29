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

import { Button, Grid, Typography } from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';

import { useTranslation } from '../../hooks/useTranslation';
import permissionRequired from '../../images/permission-required.svg';

const useStyles = makeStyles(theme =>
  createStyles({
    root: {
      padding: theme.spacing(4),
      height: '100%',
      maxWidth: 1592,
      margin: 'auto',
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: 400,
      marginBottom: theme.spacing(2),
    },
    description: {
      fontSize: '1rem',
      color: theme.palette.text.secondary,
      marginBottom: theme.spacing(3),
      lineHeight: 1.5,
    },
    goBackButton: {
      borderColor: theme.palette.primary.main,
      color: theme.palette.primary.main,
      borderRadius: 999,
      textTransform: 'none',
      paddingLeft: theme.spacing(3),
      paddingRight: theme.spacing(3),
    },
    illustration: {
      width: '100%',
      maxWidth: 600,
      height: 'auto',
    },
  }),
);

interface NotebookPermissionRequiredProps {
  onGoBack: () => void;
}

export const NotebookPermissionRequired = ({
  onGoBack,
}: NotebookPermissionRequiredProps) => {
  const classes = useStyles();
  const { t } = useTranslation();

  return (
    <div className={classes.root}>
      <Grid
        container
        spacing={4}
        alignItems="center"
        justifyContent="center"
        style={{ height: '100%' }}
      >
        <Grid item xs={12} md={6}>
          <Typography variant="h4" className={classes.title}>
            {t('permission.notebooks.title')}
          </Typography>
          <Typography className={classes.description}>
            {t('permission.notebooks.description')}
          </Typography>
          <Button
            variant="outlined"
            className={classes.goBackButton}
            onClick={onGoBack}
          >
            {t('permission.notebooks.goBack')}
          </Button>
        </Grid>
        <Grid item xs={12} md={6} style={{ textAlign: 'right' }}>
          <img
            src={permissionRequired as any}
            alt={t('icon.permissionRequired.alt')}
            className={classes.illustration}
          />
        </Grid>
      </Grid>
    </div>
  );
};
