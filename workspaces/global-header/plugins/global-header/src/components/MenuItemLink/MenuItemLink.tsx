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

import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from '../../hooks/useTranslation';
import { MenuItemLinkContent } from './MenuItemLinkContent';
import { translateWithFallback } from '../../utils/translationUtils';

/**
 * Header Icon Button properties
 * @public
 */
export interface MenuItemLinkProps {
  to: string;
  title?: string;
  titleKey?: string;
  subTitle?: string;
  subTitleKey?: string;
  icon?: string;
  tooltip?: string;
}

export const MenuItemLink = ({
  to,
  title,
  titleKey,
  subTitle,
  subTitleKey,
  icon,
  tooltip,
}: MenuItemLinkProps) => {
  const { t } = useTranslation();
  const isExternalLink = Boolean(
    to && (to.startsWith('http://') || to.startsWith('https://')),
  );

  const translatedTitle = translateWithFallback(t, titleKey, title);
  const translatedSubTitle = translateWithFallback(t, subTitleKey, subTitle);

  const headerLinkContent = () => (
    <MenuItemLinkContent
      icon={icon}
      label={translatedTitle}
      subLabel={translatedSubTitle}
      isExternalLink={isExternalLink}
    />
  );

  return (
    <>
      {tooltip && (
        <Tooltip title={tooltip}>
          <div>{headerLinkContent()}</div>
        </Tooltip>
      )}
      {!tooltip && headerLinkContent()}
    </>
  );
};
