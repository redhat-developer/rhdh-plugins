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

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

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
      buttonContent={<HelpOutlineIcon />}
      buttonProps={{ color: 'inherit' }}
      emptyState={
        <DropdownEmptyState
          title={t('help.noSupportLinks')}
          subTitle={t('help.noSupportLinksSubtitle')}
          icon={
            <SupportAgentIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
          }
        />
      }
    />
  );
};
