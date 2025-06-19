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
import { configApiRef, useApiHolder } from '@backstage/core-plugin-api';
import { Link as BackstageLink } from '@backstage/core-components';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import HelpIcon from '@mui/icons-material/HelpOutline';

/**
 * @public
 */
export interface SupportButtonProps {
  title?: string;
  tooltip?: string;
  color?:
    | 'inherit'
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning';
  size?: 'small' | 'medium' | 'large';
  to?: string;
  layout?: CSSProperties;
}

// Backstage Link automatically detects external links and emits analytic events.
const Link = (props: any) => (
  <BackstageLink {...props} color="inherit" externalLinkIcon={false} />
);

/**
 * @public
 */
export const SupportButton = ({
  title = 'Support',
  tooltip,
  color = 'inherit',
  size = 'small',
  to,
  layout,
}: SupportButtonProps) => {
  const apiHolder = useApiHolder();
  const config = apiHolder.get(configApiRef);
  const supportUrl = to ?? config?.getOptionalString('app.support.url');

  if (!supportUrl) {
    return null;
  }

  const isExternalLink =
    supportUrl.startsWith('http://') || supportUrl.startsWith('https://');

  return (
    <Box sx={layout}>
      <Tooltip
        title={tooltip ?? `${title}${isExternalLink ? ' (external link)' : ''}`}
      >
        <div>
          <IconButton
            component={Link}
            color={color}
            size={size}
            to={supportUrl}
            aria-label={title}
          >
            <HelpIcon fontSize={size} />
          </IconButton>
        </div>
      </Tooltip>
    </Box>
  );
};
