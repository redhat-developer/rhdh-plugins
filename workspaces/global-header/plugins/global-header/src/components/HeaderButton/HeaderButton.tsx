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

import type { CSSProperties } from 'react';
import { LinkButton } from '@backstage/core-components';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { HeaderIcon } from '../HeaderIcon/HeaderIcon';

/**
 * @public
 */
export interface HeaderButtonProps {
  title: string;
  tooltip?: string;
  color?: 'inherit' | 'primary' | 'secondary' | 'default';
  size?: 'small' | 'medium' | 'large';
  variant?: 'text' | 'outlined' | 'contained';
  ariaLabel?: string;
  startIcon?: string;
  endIcon?: string;
  externalLinkIcon?: boolean;
  to: string;
  layout?: CSSProperties;
}

/**
 * @public
 */
export const HeaderButton = ({
  title,
  tooltip,
  color = 'inherit',
  size = 'small',
  variant,
  ariaLabel,
  startIcon,
  endIcon,
  externalLinkIcon = true,
  to,
  layout,
}: HeaderButtonProps) => {
  const button = (
    <LinkButton
      color={color}
      size={size}
      variant={variant}
      aria-label={ariaLabel}
      startIcon={startIcon ? <HeaderIcon icon={startIcon} size={size} /> : null}
      endIcon={endIcon ? <HeaderIcon icon={endIcon} size={size} /> : null}
      externalLinkIcon={externalLinkIcon}
      to={to}
    >
      {title}
    </LinkButton>
  );

  if (tooltip) {
    return (
      <Box sx={layout}>
        <Tooltip title={tooltip}>
          <div>{button}</div>
        </Tooltip>
      </Box>
    );
  }

  return <Box sx={layout}>{button}</Box>;
};
