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

import { Link, useSidebarOpenState } from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/frontend-plugin-api';
import Box from '@mui/material/Box';

import { defaultFullLogo } from './defaultFullLogo';
import { defaultIconLogo } from './defaultIconLogo';
import { useAppBarBackgroundScheme } from './useAppBarBackgroundScheme';
import { useBrandingFullLogo, useBrandingIconLogo } from './useBrandingLogo';
import type { CompanyLogoProps } from './types';

const DEFAULT_FULL_LOGO_WIDTH = 170;
const DEFAULT_FULL_LOGO_HEIGHT = 40;
const ICON_LOGO_SIZE = 28;

const LogoRender = ({
  logoUri,
  width,
  height,
}: {
  logoUri: string;
  width: number | string;
  height: number | string;
}) => (
  <img
    data-testid="home-logo"
    src={logoUri}
    alt="Home logo"
    style={{
      objectFit: 'contain',
      objectPosition: 'left',
      maxHeight: height,
    }}
    width={width}
  />
);

/**
 * Sidebar logo that links to the home page. Renders the full logo while the
 * sidebar is open and the icon logo while it is collapsed, picking the
 * light or dark variant for the current app bar background scheme.
 *
 * Logos come from `app.branding.fullLogo` and `app.branding.iconLogo`
 * (a URL, or `{ light, dark }`), overridable through props, with the RHDH
 * defaults as fallback. `app.branding.fullLogoWidth` sets the full logo
 * width. Registered by default as `sidebar-element:app/logo`.
 *
 * @public
 */
export const CompanyLogo = ({
  fullLogo,
  iconLogo,
  to = '/',
  width,
  height = DEFAULT_FULL_LOGO_HEIGHT,
}: CompanyLogoProps) => {
  const { isOpen } = useSidebarOpenState();
  const scheme = useAppBarBackgroundScheme();
  const configApi = useApi(configApiRef);

  const fullLogoURI = useBrandingFullLogo(fullLogo) ?? defaultFullLogo[scheme];
  const iconLogoURI = useBrandingIconLogo(iconLogo) ?? defaultIconLogo;
  const fullLogoWidth =
    width ??
    configApi.getOptional<number | string>('app.branding.fullLogoWidth') ??
    DEFAULT_FULL_LOGO_WIDTH;

  return (
    <Box
      data-testid="sidebar-company-logo"
      sx={{
        display: 'flex',
        alignItems: 'center',
        margin: '24px 0 6px 24px',
      }}
    >
      <Link
        to={to}
        underline="none"
        aria-label="Home"
        style={{ display: 'flex', alignItems: 'center' }}
      >
        {isOpen ? (
          <LogoRender
            logoUri={fullLogoURI}
            width={fullLogoWidth}
            height={height}
          />
        ) : (
          <LogoRender
            logoUri={iconLogoURI}
            width={ICON_LOGO_SIZE}
            height={ICON_LOGO_SIZE}
          />
        )}
      </Link>
    </Box>
  );
};
