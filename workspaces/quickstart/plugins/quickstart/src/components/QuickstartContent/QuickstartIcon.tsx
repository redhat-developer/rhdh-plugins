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

import type { ComponentType, CSSProperties } from 'react';
import { useApp } from '@backstage/core-plugin-api';
import { Box } from '@backstage/ui';
import { RiApps2Line } from '@remixicon/react';

import {
  resolveQuickstartIconId,
  shouldUseMaterialLigature,
  toMaterialLigature,
} from './quickstartIconIds';

export type QuickstartIconSize = 'small' | 'medium' | 'large';

export interface QuickstartIconProps {
  icon: string;
  size?: QuickstartIconSize;
  className?: string;
  style?: CSSProperties;
}

const pixelSize = (size: QuickstartIconSize): number => {
  switch (size) {
    case 'small':
      return 20;
    case 'large':
      return 35;
    case 'medium':
    default:
      return 24;
  }
};

const sizeStyle = (size: QuickstartIconSize): CSSProperties => {
  const px = pixelSize(size);
  return { width: px, height: px, fontSize: px, display: 'inline-flex' };
};

const toInlineSvgDataUri = (rawSvg: string): string =>
  `data:image/svg+xml;base64,${btoa(rawSvg)}`;

const isRemoteOrPathImage = (value: string): boolean =>
  /^(https?:\/\/|\/|data:image\/)/.test(value);

type QuickstartImageIconProps = {
  src: string;
  size: QuickstartIconSize;
  className?: string;
  style?: CSSProperties;
};

/** Renders an icon from an image `src` (URL, path, or data URI). */
const QuickstartImageIcon = ({
  src,
  size,
  className,
  style,
}: QuickstartImageIconProps) => (
  <Box className={className} style={{ ...sizeStyle(size), ...style }}>
    <img
      src={src}
      alt=""
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  </Box>
);

type SystemIconProps = {
  fontSize?: QuickstartIconSize;
  className?: string;
  style?: CSSProperties;
};

/**
 * Renders quickstart icons from system icons, image/SVG URLs, or Material
 * ligatures for legacy config ids. Falls back to a Remix apps icon.
 */
export const QuickstartIcon = ({
  icon,
  size = 'medium',
  className,
  style,
}: QuickstartIconProps) => {
  const app = useApp();

  if (!icon) {
    return null;
  }

  const resolvedIconId = resolveQuickstartIconId(icon);
  const SystemIcon = app.getSystemIcon(resolvedIconId) as
    | ComponentType<SystemIconProps>
    | undefined;
  if (SystemIcon) {
    return (
      <Box className={className} style={style}>
        <SystemIcon fontSize={size} />
      </Box>
    );
  }

  if (icon.startsWith('<svg')) {
    return (
      <QuickstartImageIcon
        src={toInlineSvgDataUri(icon)}
        size={size}
        className={className}
        style={style}
      />
    );
  }

  if (isRemoteOrPathImage(icon)) {
    return (
      <QuickstartImageIcon
        src={icon}
        size={size}
        className={className}
        style={style}
      />
    );
  }

  if (shouldUseMaterialLigature(icon)) {
    return (
      <Box
        className={['material-icons-outlined', className]
          .filter(Boolean)
          .join(' ')}
        style={{
          ...sizeStyle(size),
          lineHeight: 1,
          overflow: 'hidden',
          ...style,
        }}
      >
        {toMaterialLigature(icon)}
      </Box>
    );
  }

  // eslint-disable-next-line no-console
  console.warn(
    `QuickstartIcon: unregistered icon id "${icon}". Register via IconBundleBlueprint, app.getSystemIcon(), or use an image/SVG URL.`,
  );

  return (
    <Box
      aria-hidden
      className={className}
      style={style}
      data-testid="QuickstartIconFallback"
    >
      <RiApps2Line size={pixelSize(size)} />
    </Box>
  );
};
