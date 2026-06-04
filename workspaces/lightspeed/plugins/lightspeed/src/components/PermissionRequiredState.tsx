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

import { styled } from '@mui/material/styles';

import { useTranslation } from '../hooks/useTranslation';
import { PermissionRequiredIcon } from './PermissionRequiredIcon';
import { Trans } from './Trans';

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  minHeight: '100%',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.background.default,
  containerType: 'inline-size',
  '& [class*="BackstageEmptyState-root"]': {
    alignItems: 'center',
    padding: theme.spacing(4),
  },
  '& [class*="MuiTypography-h5"]': {
    fontSize: 'clamp(1.875rem, 3.75cqi, 3.125rem)',
    fontWeight: 400,
  },
  '& [class*="MuiTypography-body1"]': {
    fontSize: '1em',
    color: theme.palette.text.secondary,
    '& b': {
      fontWeight: 500,
      color: theme.palette.text.primary,
    },
  },
  '@container (max-width: 899px)': {
    '& [class*="BackstageEmptyState-root"]': {
      textAlign: 'center',
    },
    '& [class*="MuiGrid-grid-md-6"]': {
      maxWidth: '100%',
      flexBasis: '100%',
    },
    '& [class*="BackstageEmptyState-imageContainer"]': {
      order: -1,
      display: 'flex',
      justifyContent: 'center',
      marginBottom: theme.spacing(-4),
    },
  },
}));

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
    <Root>
      <EmptyState
        title={t('permission.required.title')}
        description={
          <Trans
            message="permission.required.description"
            components={{
              '<subject/>': <>{subject}</>,
              '<permissions/>': permissionsList,
            }}
          />
        }
        missing={{ customImage: <PermissionRequiredIcon /> }}
        action={action}
      />
    </Root>
  );
};
export default PermissionRequiredState;
