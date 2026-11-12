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

import { Link as BackstageLink } from '@backstage/core-components';

import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import { HeaderIcon } from '../HeaderIcon/HeaderIcon';
import { useTranslation } from '../../hooks/useTranslation';
import { translateWithFallback } from '../../utils/translationUtils';

/**
 * Props for the header icon button building block.
 *
 * @public
 */
export interface HeaderIconButtonProps {
  /** Visible / accessible title for the button. */
  title: string;
  /** Translation key used when resolving the button title. */
  titleKey?: string;
  /** Icon identifier passed to `HeaderIcon`. */
  icon: string;
  /** Tooltip shown on hover. Defaults to the resolved title. */
  tooltip?: string;
  /** MUI `IconButton` color. */
  color?: 'inherit' | 'primary' | 'secondary' | 'default';
  /** MUI `IconButton` size. */
  size?: 'small' | 'medium' | 'large';
  /** Explicit `aria-label`. Defaults to the resolved title. */
  ariaLabel?: string;
  /** Navigation target for the icon button link. */
  to: string;
}

const Link = (props: any) => (
  <BackstageLink {...props} color="inherit" externalLinkIcon={false} />
);

/**
 * Icon button building block for global-header toolbar actions.
 *
 * Exported publicly as `GlobalHeaderIconButton` from the
 * `/global-header-components` package entry.
 *
 * @public
 */
export const HeaderIconButton = ({
  title,
  titleKey,
  icon,
  tooltip,
  color = 'inherit',
  size = 'small',
  ariaLabel,
  to,
}: HeaderIconButtonProps) => {
  const { t } = useTranslation();
  const displayTitle = translateWithFallback(t, titleKey, title);
  if (!displayTitle) {
    // eslint-disable-next-line no-console
    console.warn('HeaderIconButton has no title:', { icon, to });
  }

  const linkProps = { to } as IconButtonProps;

  return (
    <Tooltip title={tooltip ?? displayTitle}>
      <div>
        <IconButton
          LinkComponent={Link}
          color={color}
          size={size}
          aria-label={ariaLabel ?? displayTitle}
          {...linkProps}
        >
          <HeaderIcon icon={icon} size={size} />
        </IconButton>
      </div>
    </Tooltip>
  );
};
