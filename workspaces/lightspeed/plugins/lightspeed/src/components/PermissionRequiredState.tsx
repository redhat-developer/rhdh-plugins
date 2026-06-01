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

import { Fragment } from 'react';

import { Typography } from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';

import { useTranslation } from '../hooks/useTranslation';
import { PermissionRequiredIcon } from './PermissionRequiredIcon';
import { Trans } from './Trans';

const useStyles = makeStyles(theme =>
  createStyles({
    root: {
      display: 'flex',
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.palette.background.default,
      containerType: 'inline-size',
    },
    layout: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: theme.spacing(2),
      padding: theme.spacing(4),
      width: '100%',
      '@container (min-width: 600px)': {
        flexDirection: 'row',
        textAlign: 'left',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: theme.spacing(4, 8),
      },
    },
    textColumn: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
      order: 2,
      '@container (min-width: 600px)': {
        order: 1,
        flex: 1,
      },
    },
    imageColumn: {
      order: 1,
      '@container (min-width: 600px)': {
        order: 2,
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
      },
    },
    title: {
      fontSize: 'clamp(1.5rem, 3cqi, 2.5rem)',
      fontWeight: 300,
    },
    description: {
      fontSize: 'clamp(0.875rem, 1.5cqi, 1.125rem)',
      color: theme.palette.text.secondary,
      '& b': {
        fontWeight: 500,
        color: theme.palette.text.primary,
      },
    },
    action: {
      marginTop: theme.spacing(1),
    },
  }),
);

interface PermissionRequiredStateProps {
  subject: string;
  permissions: string[];
  action: JSX.Element;
}

const PermissionRequiredState = ({
  subject,
  permissions,
  action,
}: PermissionRequiredStateProps) => {
  const classes = useStyles();
  const { t } = useTranslation();

  const permissionsList = (
    <>
      {permissions.map((perm, i) => (
        <Fragment key={perm}>
          <b>{perm}</b>
          {i < permissions.length - 1 && ' and '}
        </Fragment>
      ))}
    </>
  );

  return (
    <div className={classes.root}>
      <div className={classes.layout}>
        <div className={classes.textColumn}>
          <Typography variant="h3" className={classes.title}>
            {t('permission.required.title')}
          </Typography>
          <Typography variant="subtitle1" className={classes.description}>
            <Trans
              message="permission.required.description"
              components={{
                '<subject/>': <>{subject}</>,
                '<permissions/>': permissionsList,
              }}
            />
          </Typography>
          <div className={classes.action}>{action}</div>
        </div>
        <div className={classes.imageColumn}>
          <PermissionRequiredIcon />
        </div>
      </div>
    </div>
  );
};
export default PermissionRequiredState;
