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

import { styled } from '@mui/material/styles';
import {
  Alert,
  AlertActionCloseButton,
  AlertGroup,
  AlertVariant,
  type AlertProps,
} from '@patternfly/react-core';

const ToastAlerts = styled(AlertGroup)(({ theme }) => ({
  '--pf-v6-c-alert-group--m-toast--InsetInlineEnd': theme.spacing(2.5),
  '--pf-v6-c-alert-group--m-toast--InsetBlockStart': theme.spacing(2.5),
  '--pf-v6-c-alert-group--m-toast--MaxWidth': '350px',
  '--pf-v6-c-alert-group--m-toast--ZIndex': '9999',
}));

const ToastAlert = styled(Alert)({
  maxWidth: '350px',
  '& .pf-v6-c-alert__title': {
    margin: 0,
  },
});

type ToastAlertGroupProps = {
  alerts: Partial<AlertProps>[];
  onRemoveAlert: (key: React.Key) => void;
};

export const ToastAlertGroup = ({
  alerts,
  onRemoveAlert,
}: ToastAlertGroupProps) => {
  if (alerts.length === 0) return null;

  return (
    <ToastAlerts hasAnimations isToast isLiveRegion>
      {alerts.map(({ key, title, variant }) => (
        <ToastAlert
          key={key}
          variant={AlertVariant[variant ?? 'success']}
          title={title}
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
    </ToastAlerts>
  );
};
