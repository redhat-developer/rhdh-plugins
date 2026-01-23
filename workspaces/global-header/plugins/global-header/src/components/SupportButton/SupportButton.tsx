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

import { configApiRef, useApiHolder } from '@backstage/core-plugin-api';
import { Link } from '@backstage/core-components';
import MenuItem from '@mui/material/MenuItem';
import { MenuItemLink } from '../MenuItemLink/MenuItemLink';
import { CSSProperties } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { translateWithFallback } from '../../utils/translationUtils';

interface SupportLink {
  url: string;
  title: string;
}

interface SupportItem {
  title: string;
  icon?: string;
  links: SupportLink[];
}

/**
 * @public
 */
export interface SupportButtonProps {
  icon?: string;
  title?: string;
  titleKey?: string;
  to?: string;
  items?: SupportItem[];
  tooltip?: string;
  style?: CSSProperties;
  onClick?: () => void;
}
/**
 * @public
 */
export const SupportButton = ({
  title = 'Support',
  titleKey = 'help.supportTitle',
  to,
  items,
  icon = 'support',
  tooltip,
  style,
  onClick = () => {},
}: SupportButtonProps) => {
  const apiHolder = useApiHolder();
  const config = apiHolder.get(configApiRef);
  const { t } = useTranslation();

  const displayTitle = translateWithFallback(t, titleKey, title);
  const supportUrl = to ?? config?.getOptionalString('app.support.url');

  const supportItems =
    items ??
    (config
      ?.getOptionalConfigArray('app.support.items')
      ?.map(item => ({
        title: item.getString('title'),
        icon: item.getOptionalString('icon'),
        links: item.getConfigArray('links').map(link => ({
          url: link.getString('url'),
          title: link.getString('title'),
        })),
      })) as SupportItem[] | undefined);

  if (supportItems && supportItems.length > 0) {
    return (
      <>
        {supportItems.map((item: SupportItem) =>
          item.links.map((link: SupportLink) => (
            <MenuItem
              key={link.url}
              to={link.url}
              component={Link}
              sx={{ width: '100%', color: 'inherit', ...style }}
              onClick={onClick}
              data-testid="support-button"
            >
              <MenuItemLink
                to={link.url}
                title={link.title}
                icon={item.icon ?? icon}
                tooltip={tooltip}
              />
            </MenuItem>
          )),
        )}
      </>
    );
  }

  if (!supportUrl) {
    return null;
  }

  return (
    <MenuItem
      to={supportUrl}
      component={Link}
      sx={{ width: '100%', color: 'inherit', ...style }}
      onClick={onClick}
      data-testid="support-button"
    >
      <MenuItemLink
        to={supportUrl}
        title={displayTitle}
        icon={icon}
        tooltip={tooltip}
      />
    </MenuItem>
  );
};
