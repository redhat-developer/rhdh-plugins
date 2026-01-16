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

import LockOutlined from '@mui/icons-material/LockOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';

import { useTranslation } from '../../hooks/useTranslation';

const useStyles = makeStyles()(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(4),
  },
  icon: {
    fontSize: '4rem',
    color: theme.palette.warning.main,
    marginBottom: theme.spacing(2),
  },
  title: {
    marginBottom: theme.spacing(1),
    fontWeight: 500,
  },
  description: {
    color: theme.palette.text.secondary,
    textAlign: 'center',
    maxWidth: '600px',
    marginBottom: theme.spacing(3),
  },
  permissionBox: {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(3),
    fontFamily: 'monospace',
    fontSize: '0.875rem',
  },
  actionButton: {
    marginTop: theme.spacing(1),
  },
}));

export interface PermissionDeniedPanelProps {
  /** The title to display */
  title?: string;
  /** The description explaining why access is denied */
  description?: string;
  /** The permission(s) needed to access this resource */
  requiredPermission?: string;
  /** Optional action to go back */
  onGoBack?: () => void;
}

/**
 * A clean UI panel to display when a user doesn't have permission to access a resource.
 * Similar to the Argo CD plugin's permission denied screen.
 */
export const PermissionDeniedPanel: React.FC<PermissionDeniedPanelProps> = ({
  title,
  description,
  requiredPermission,
  onGoBack,
}) => {
  const { t } = useTranslation();
  const { classes } = useStyles();

  const defaultTitle = t('permissions.accessDenied');
  const defaultDescription = t('permissions.accessDeniedDescription');

  return (
    <EmptyState
      missing="info"
      title={title || defaultTitle}
      description={
        <Box className={classes.container}>
          <LockOutlined className={classes.icon} />
          <Typography variant="body1" className={classes.description}>
            {description || defaultDescription}
          </Typography>
          {requiredPermission && (
            <Box className={classes.permissionBox}>
              <Typography variant="caption" color="textSecondary">
                {t('permissions.requiredPermission')}:
              </Typography>
              <Typography variant="body2" component="code">
                {requiredPermission}
              </Typography>
            </Box>
          )}
          <Typography variant="body2" color="textSecondary">
            {t('permissions.contactAdmin')}
          </Typography>
          {onGoBack && (
            <Button
              variant="outlined"
              color="primary"
              onClick={onGoBack}
              className={classes.actionButton}
            >
              {t('common.goBack')}
            </Button>
          )}
        </Box>
      }
    />
  );
};

PermissionDeniedPanel.displayName = 'PermissionDeniedPanel';

/**
 * Helper function to check if an error is an access denied error
 */
export const isAccessDeniedError = (error: Error | undefined): boolean => {
  if (!error) return false;
  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('access denied') ||
    message.includes('unauthorized') ||
    message.includes('not allowed') ||
    message.includes('permission')
  );
};

/**
 * Helper function to extract the required permission from an error message
 */
export const extractRequiredPermission = (
  error: Error | undefined,
): string | undefined => {
  if (!error?.message) return undefined;
  // Look for permission names in single quotes
  const match = error.message.match(/'([^']*permission[^']*)'/i);
  return match?.[1];
};
