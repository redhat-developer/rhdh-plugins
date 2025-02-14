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
import Tooltip from '@mui/material/Tooltip';
import { Link } from 'react-router-dom';
import { MenuItemLinkContent } from './MenuItemLinkContent';

/**
 * Header Icon Button properties
 * @public
 */
export interface MenuItemLinkProps {
  to: string;
  title?: string;
  subTitle?: string;
  icon?: string;
  tooltip?: string;
}

export const MenuItemLink = ({
  to,
  title,
  subTitle,
  icon,
  tooltip,
}: MenuItemLinkProps) => {
  const headerLinkContent = () => (
    <Link
      to={to}
      style={{
        color: 'inherit',
        textDecoration: 'none',
        width: '100%',
      }}
    >
      <MenuItemLinkContent icon={icon} label={title} subLabel={subTitle} />
    </Link>
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
