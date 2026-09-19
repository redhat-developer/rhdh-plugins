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

import { useApp } from '@backstage/core-plugin-api';
import Box from '@mui/material/Box';
import MuiIcon from '@mui/material/Icon';
import { SxProps, Theme } from '@mui/material/styles';
import { SvgIconProps } from '@mui/material/SvgIcon';

import { ShapesOutlinedIcon } from '../../icons/ShapesOutlinedIcon';
import {
  resolveQuickstartIconId,
  shouldUseMaterialLigature,
  toMaterialLigature,
} from './quickstartIconIds';

export interface QuickstartIconProps {
  icon: string;
  size?: SvgIconProps['fontSize'];
  sx?: SxProps<Theme>;
}

const flexSx = (sx?: SxProps<Theme>): SxProps<Theme> =>
  (sx
    ? [{ display: 'flex', alignItems: 'center' }, sx]
    : { display: 'flex', alignItems: 'center' }) as SxProps<Theme>;

/**
 * Renders a quickstart icon using the same resolution order as global-header
 * `HeaderIcon`, with an extra Material-ligature step for legacy quickstart
 * config ids and lowercase icon names.
 */
export const QuickstartIcon = ({
  icon,
  size = 'medium',
  sx,
}: QuickstartIconProps) => {
  const app = useApp();

  if (!icon) {
    return null;
  }

  const resolvedIconId = resolveQuickstartIconId(icon);
  const SystemIcon = app.getSystemIcon(resolvedIconId);
  if (SystemIcon) {
    return (
      <Box sx={flexSx(sx)}>
        <SystemIcon fontSize={size} />
      </Box>
    );
  }

  if (icon.startsWith('<svg')) {
    const svgDataUri = `data:image/svg+xml;base64,${btoa(icon)}`;
    return (
      <MuiIcon fontSize={size} sx={sx}>
        <img src={svgDataUri} alt="" />
      </MuiIcon>
    );
  }

  if (
    icon.startsWith('https://') ||
    icon.startsWith('http://') ||
    icon.startsWith('/') ||
    icon.startsWith('data:image/')
  ) {
    return (
      <MuiIcon fontSize={size} baseClassName="material-icons-outlined" sx={sx}>
        <img src={icon} alt="" height="100%" width="100%" />
      </MuiIcon>
    );
  }

  if (shouldUseMaterialLigature(icon)) {
    return (
      <MuiIcon fontSize={size} baseClassName="material-icons-outlined" sx={sx}>
        {toMaterialLigature(icon)}
      </MuiIcon>
    );
  }

  // eslint-disable-next-line no-console
  console.warn(
    `QuickstartIcon: unregistered icon id "${icon}". Register via IconBundleBlueprint, app.getSystemIcon(), or use an image/SVG URL.`,
  );

  return (
    <Box aria-hidden sx={flexSx(sx)}>
      <ShapesOutlinedIcon fontSize={size} />
    </Box>
  );
};
