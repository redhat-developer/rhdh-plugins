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

import { EmptyState } from '@backstage/core-components';

import { Typography } from '@material-ui/core';

import { useTranslation } from '../hooks/useTranslation';
import { createStyles, makeStyles } from '../utils/makeStyles';
import { PermissionRequiredIcon } from './PermissionRequiredIcon';
import { Trans } from './Trans';

const useStyles = makeStyles(theme =>
  createStyles({
    permissionError: {
      display: 'flex',
      height: '100%',
      alignItems: 'center',
      padding: '100px',
      backgroundColor: theme.palette.background.default,
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
    <div className={classes.permissionError}>
      <EmptyState
        title={t('permission.required.title')}
        description={
          <Typography variant="subtitle1">
            <Trans
              message="permission.required.description"
              components={{
                '<subject/>': <>{subject}</>,
                '<permissions/>': permissionsList,
              }}
            />
          </Typography>
        }
        missing={{ customImage: <PermissionRequiredIcon /> }}
        action={action}
      />
    </div>
  );
};
export default PermissionRequiredState;
