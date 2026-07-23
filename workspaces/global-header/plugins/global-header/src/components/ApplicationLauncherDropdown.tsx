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

import Box from '@mui/material/Box';

import { HeaderIcon } from '../../components/HeaderIcon/HeaderIcon';
import { useTranslation } from '../../hooks/useTranslation';
import { DropdownEmptyState } from '../../components/HeaderDropdownComponent/DropdownEmptyState';
import { GlobalHeaderDropdown } from './GlobalHeaderDropdown';

/**
 * Application Launcher dropdown. Collects menu items from the `'app-launcher'`
 * target.
 *
 * @internal
 */
export const ApplicationLauncherDropdown = () => {
  const { t } = useTranslation();
  return (
    <GlobalHeaderDropdown
      target="app-launcher"
      isIconButton
      tooltip={t('applicationLauncher.tooltip')}
      buttonContent={<HeaderIcon icon="apps" size="medium" />}
      emptyState={
        <DropdownEmptyState
          title={t('applicationLauncher.noLinksTitle')}
          subTitle={t('applicationLauncher.noLinksSubtitle')}
          icon={
            <Box sx={{ color: 'text.disabled', fontSize: 64, lineHeight: 1 }}>
              <HeaderIcon icon="app_registration" size="large" />
            </Box>
          }
        />
      }
    />
  );
};
