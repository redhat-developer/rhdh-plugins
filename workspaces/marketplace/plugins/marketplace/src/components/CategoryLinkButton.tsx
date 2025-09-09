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

import type { MouseEvent } from 'react';

import { LinkButton } from '@backstage/core-components';

import Tooltip from '@mui/material/Tooltip';
import { makeStyles } from '@material-ui/core';

import { getCategoryTagDisplayInfo } from '../utils';

const useStyles = makeStyles(() => ({
  pluginCategoryLinkButton: {
    fontWeight: 'normal',
    padding: '2px 6px',
    transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&:hover': {
      borderColor: '#a3a3a3',
      boxShadow: 'inset 0 0 0 1px #a3a3a3',
    },
    '&:focus-visible': {
      borderColor: '#a3a3a3',
      boxShadow: 'inset 0 0 0 1px #a3a3a3',
      outline: '2px solid #06c',
      outlineOffset: '2px',
    },
  },
}));

export interface CategoryLinkButtonProps {
  categoryName: string;
  to: string;
  onClick?: (event: MouseEvent) => void;
  maxLength?: number;
}

export const CategoryLinkButton = ({
  categoryName,
  to,
  onClick,
  maxLength = 25,
}: CategoryLinkButtonProps) => {
  const classes = useStyles();
  const { displayName, tooltipTitle } = getCategoryTagDisplayInfo(
    categoryName,
    {
      maxLength,
    },
  );

  return (
    <Tooltip title={tooltipTitle} arrow>
      <div style={{ display: 'inline-block', minHeight: '28px' }}>
        <LinkButton
          to={to}
          variant="outlined"
          className={classes.pluginCategoryLinkButton}
          onClick={onClick}
        >
          {displayName}
        </LinkButton>
      </div>
    </Tooltip>
  );
};
