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
 * Help dropdown. Collects menu items from the `'help'` target.
 *
 * @internal
 */
export const HelpDropdown = () => {
  const { t } = useTranslation();
  return (
    <GlobalHeaderDropdown
      target="help"
      trackValidity
      isIconButton
      tooltip={t('help.tooltip')}
      buttonContent={<HeaderIcon icon="help_outline" size="medium" />}
      buttonProps={{ color: 'inherit' }}
      emptyState={
        <DropdownEmptyState
          title={t('help.noSupportLinks')}
          subTitle={t('help.noSupportLinksSubtitle')}
          icon={
            <Box sx={{ color: 'text.disabled', fontSize: 64, lineHeight: 1 }}>
              <HeaderIcon icon="support_agent" size="large" />
            </Box>
          }
        />
      }
    />
  );
};
