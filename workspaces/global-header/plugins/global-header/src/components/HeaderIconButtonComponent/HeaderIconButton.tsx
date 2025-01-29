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
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { HeaderIcon } from './HeaderIcon';
import { Link } from 'react-router-dom';

/**
 * Header Icon Button properties
 * @public
 */
export interface HeaderIconButtonProps {
  icon: string;
  to?: string;
  tooltip?: string;
}

export const HeaderIconButton = ({
  icon,
  tooltip,
  to,
}: HeaderIconButtonProps) => {
  return (
    <Tooltip title={tooltip ?? icon}>
      <IconButton
        color="inherit"
        aria-label="help"
        sx={{ mr: 1.5 }}
        {...(to ? { component: Link, to } : {})}
      >
        {tooltip !== 'Support' && <HeaderIcon icon={icon} />}
      </IconButton>
    </Tooltip>
  );
};
