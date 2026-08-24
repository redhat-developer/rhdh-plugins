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

import { Link } from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import Box from '@mui/material/Box';
import { defaultFullLogo } from '../../defaults/defaultFullLogo';
import { useAppBarBackgroundScheme } from '../../hooks/useAppBarBackgroundScheme';
import { useBrandingFullLogo } from '../../hooks/useBrandingFullLogo';
import { CompanyLogoProps } from './types';

export type { CompanyLogoProps, LogoURLs } from './types';

const LogoRender = ({
  logoUri,
  width = 150,
  height = 40,
}: {
  logoUri: string;
  width?: number | string;
  height?: number | string;
}) => {
  return (
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
};

export const CompanyLogo = ({
  logo,
  width,
  height,
  to = '/',
}: CompanyLogoProps) => {
  const appBarBackgroundScheme = useAppBarBackgroundScheme();
  const logoURL =
    useBrandingFullLogo(logo) ?? defaultFullLogo[appBarBackgroundScheme];
  const configApi = useApi(configApiRef);
  const fullLogoWidth = configApi.getOptional<number | string>(
    'app.branding.fullLogoWidth',
  );
  return (
    <Box
      data-testid="global-header-company-logo"
      sx={{
        minWidth: '200px',
        marginRight: '13px', // align with BackstageContent
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
      }}
    >
      <Link
        to={to}
        underline="none"
        aria-label="Home"
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
        }}
      >
        <LogoRender
          logoUri={logoURL}
          width={width ?? fullLogoWidth}
          height={height}
        />
      </Link>
    </Box>
  );
};
