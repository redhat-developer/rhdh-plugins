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
import { Link as BackstageLink } from '@backstage/core-components';

import Box from '@mui/material/Box';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import { HeaderIcon } from '../HeaderIcon/HeaderIcon';

/**
 * @public
 */
export interface HeaderIconButtonProps {
  title: string;
  icon: string;
  tooltip?: string;
  color?: 'inherit' | 'primary' | 'secondary' | 'default';
  size?: 'small' | 'medium' | 'large';
  ariaLabel?: string;
  to: string;
  layout?: CSSProperties;
}

// Backstage Link automatically detects external links and emits analytic events.
const Link = (props: any) => (
  <BackstageLink {...props} color="inherit" externalLinkIcon={false} />
);

export const HeaderIconButton = ({
  title,
  icon,
  tooltip,
  color = 'inherit',
  size = 'small',
  ariaLabel,
  to,
  layout,
}: HeaderIconButtonProps) => {
  if (!title) {
    // eslint-disable-next-line no-console
    console.warn('HeaderIconButton has no title:', { icon, to });
  }

  const linkProps = { to } as IconButtonProps;

  return (
    <Box sx={layout}>
      <Tooltip title={tooltip ?? title}>
        <div>
          <IconButton
            LinkComponent={Link}
            color={color}
            size={size}
            aria-label={ariaLabel ?? title}
            {...linkProps} // to={to} isn't supported
          >
            <HeaderIcon icon={icon} size={size} />
          </IconButton>
        </div>
      </Tooltip>
    </Box>
  );
};
