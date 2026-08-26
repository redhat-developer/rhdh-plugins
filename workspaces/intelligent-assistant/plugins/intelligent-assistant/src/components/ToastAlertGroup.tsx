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

import { makeStyles } from '@material-ui/core';
import {
  Alert,
  AlertActionCloseButton,
  AlertGroup,
  AlertVariant,
  type AlertProps,
} from '@patternfly/react-core';

const useStyles = makeStyles(theme => ({
  toastAlertGroup: {
    '--pf-v6-c-alert-group--m-toast--InsetInlineEnd': `${theme.spacing(2.5)}px`,
    '--pf-v6-c-alert-group--m-toast--InsetBlockStart': `${theme.spacing(2.5)}px`,
    '--pf-v6-c-alert-group--m-toast--MaxWidth': '350px',
    '--pf-v6-c-alert-group--m-toast--ZIndex': '9999',
  },
  toastAlert: {
    maxWidth: '350px',
    '& .pf-v6-c-alert__title': {
      margin: 0,
    },
  },
}));

type ToastAlertGroupProps = {
  alerts: Partial<AlertProps>[];
  onRemoveAlert: (key: React.Key) => void;
};

export const ToastAlertGroup = ({
  alerts,
  onRemoveAlert,
}: ToastAlertGroupProps) => {
  const classes = useStyles();

  if (alerts.length === 0) return null;

  return (
    <AlertGroup
      hasAnimations
      isToast
      isLiveRegion
      className={classes.toastAlertGroup}
    >
      {alerts.map(({ key, title, variant }) => (
        <Alert
          key={key}
          variant={AlertVariant[variant ?? 'success']}
          title={title}
          className={classes.toastAlert}
          timeout={2000}
          onTimeout={() => onRemoveAlert(key as React.Key)}
          actionClose={
            <AlertActionCloseButton
              title={title as string}
              variantLabel={`${variant ?? 'success'} alert`}
              onClose={() => onRemoveAlert(key as React.Key)}
            />
          }
        />
      ))}
    </AlertGroup>
  );
};
