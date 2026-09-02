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
import type { ComponentType, SVGProps } from 'react';

import {
  Link,
  sidebarConfig,
  useSidebarOpenState,
} from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import {
  LogoFull,
  LogoIcon,
} from '@red-hat-developer-hub/backstage-plugin-theme';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

type LogoURLs =
  | string
  | {
      light?: string;
      dark?: string;
    };

function useBrandingUri(
  key: 'app.branding.fullLogo' | 'app.branding.iconLogo',
) {
  const configApi = useApi(configApiRef);
  const theme = useTheme();
  const scheme =
    (
      theme.palette as {
        rhdh?: { general?: { appBarBackgroundScheme?: string } };
      }
    )?.rhdh?.general?.appBarBackgroundScheme === 'light'
      ? 'light'
      : 'dark';
  const value = configApi.getOptional<LogoURLs>(key);
  if (typeof value === 'string') {
    return value;
  }
  return value?.[scheme] ?? value?.light ?? value?.dark;
}

const LogoRender = ({
  base64Logo,
  DefaultLogo,
  width,
  height,
}: {
  base64Logo: string | undefined;
  DefaultLogo: ComponentType<SVGProps<SVGSVGElement>>;
  width: string | number;
  height?: string | number;
}) => {
  return base64Logo ? (
    <img
      data-testid="sidebar-home-logo"
      src={base64Logo}
      alt="Home logo"
      style={{
        objectFit: 'contain',
        objectPosition: 'left',
        maxHeight: height,
      }}
      width={width}
    />
  ) : (
    <DefaultLogo width={width} />
  );
};

export const SidebarLogo = () => {
  const { isOpen } = useSidebarOpenState();
  const configApi = useApi(configApiRef);
  const fullLogoURL = useBrandingUri('app.branding.fullLogo');
  const iconLogoURL = useBrandingUri('app.branding.iconLogo');
  const fullLogoWidth = configApi
    .getOptional('app.branding.fullLogoWidth')
    ?.toString();
  const drawerWidth = isOpen
    ? sidebarConfig.drawerWidthOpen
    : sidebarConfig.drawerWidthClosed;

  return (
    <Box
      sx={{
        width: drawerWidth,
        height: 3 * sidebarConfig.logoHeight,
        display: 'flex',
        flexFlow: 'row nowrap',
        alignItems: 'center',
        mb: '-14px',
      }}
    >
      <Link
        to="/"
        underline="none"
        aria-label="Home"
        style={{
          width: drawerWidth,
          marginLeft: 24,
        }}
      >
        {isOpen ? (
          <LogoRender
            base64Logo={fullLogoURL}
            DefaultLogo={LogoFull}
            width={fullLogoWidth ?? 170}
            height={40}
          />
        ) : (
          <LogoRender
            base64Logo={iconLogoURL}
            DefaultLogo={LogoIcon}
            width={28}
          />
        )}
      </Link>
    </Box>
  );
};
