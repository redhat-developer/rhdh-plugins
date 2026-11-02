/*
 * Copyright The Backstage Authors
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

import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined';

import { ExtensionsPluginInstallStatus } from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import { useTranslation } from '../hooks/useTranslation';

const statusRowSx = {
  direction: 'row' as const,
  alignItems: 'center' as const,
  spacing: 0.5,
};

export const RestartRequiredStatus = () => {
  const { t } = useTranslation();

  return (
    <Tooltip title={t('tooltips.restartRequired')} describeChild>
      <Stack {...statusRowSx} data-testid="restart-required-status">
        <PendingOutlinedIcon sx={{ fontSize: '16px', color: '#2B9AF3' }} />
        <Typography variant="body2">{t('status.restartRequired')}</Typography>
      </Stack>
    </Tooltip>
  );
};

export const PluginInstallStatusIndicator = ({
  installStatus,
  restartRequired,
}: {
  installStatus?: ExtensionsPluginInstallStatus;
  restartRequired?: boolean;
}) => {
  const { t } = useTranslation();

  if (restartRequired) {
    return <RestartRequiredStatus />;
  }

  if (
    !installStatus ||
    installStatus === ExtensionsPluginInstallStatus.NotInstalled
  ) {
    return null;
  }

  switch (installStatus) {
    case ExtensionsPluginInstallStatus.Installed:
    case ExtensionsPluginInstallStatus.UpdateAvailable:
      return (
        <Stack {...statusRowSx}>
          <CheckCircleOutlineIcon sx={{ fontSize: '16px', color: '#3E8635' }} />
          <Typography variant="body2">{t('status.installed')}</Typography>
        </Stack>
      );

    case ExtensionsPluginInstallStatus.Disabled:
      return (
        <Stack {...statusRowSx}>
          <Typography
            variant="body2"
            sx={{ fontSize: '16px', color: '#6A6E73', fontWeight: 'bold' }}
          >
            --
          </Typography>
          <Typography variant="body2">{t('status.disabled')}</Typography>
        </Stack>
      );

    default:
      return null;
  }
};
