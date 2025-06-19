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
import { Link } from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import DefaultLogo from './DefaultLogo';
import Box from '@mui/material/Box';
import { useAppBarBackgroundScheme } from '../../hooks/useAppBarBackgroundScheme';

const LogoRender = ({
  base64Logo,
  defaultLogo,
}: {
  base64Logo: string | undefined;
  defaultLogo: JSX.Element;
}) => {
  return base64Logo ? (
    <img
      data-testid="home-logo"
      src={base64Logo}
      alt="Home logo"
      style={{
        display: 'block',
        maxHeight: '40px',
        maxWidth: '150px',
      }}
    />
  ) : (
    defaultLogo
  );
};

/**
 * An interface representing the URLs for light and dark variants of a logo.
 * @public
 */
export interface LogoURLs {
  /** The logo that will be used in global headers with a light-coloured background */
  light: string;
  /** The logo that will be used in global headers with a dark-coloured background */
  dark: string;
}

/** the type of app.branding.fullLogo */
type fullLogo = string | LogoURLs | undefined;

/**
 * @public
 */
export interface CompanyLogoProps {
  /** An object containing the logo URLs */
  logo?: LogoURLs;
  /** The route to link the logo to */
  to?: string;
  /** This prop is not used by this component. */
  layout?: CSSProperties;
}

/**
 * Gets a themed image based on the current theme.
 */
const useFullLogo = (lightLogoURL?: string, darkLogoURL?: string) => {
  const appBarBackgroundScheme = useAppBarBackgroundScheme();

  const configApi = useApi(configApiRef);

  /** The fullLogo config specified by Red Hat Developer Hub */
  const fullLogo = configApi.getOptional<fullLogo>('app.branding.fullLogo');

  /** The dark theme full logo config */
  const darkLogoFullBase64URI =
    darkLogoURL ?? (typeof fullLogo === 'string' ? fullLogo : fullLogo?.dark);

  /** The light theme full logo config */
  const lightLogoFullBase64URI =
    lightLogoURL ??
    (typeof fullLogo === 'string' ? undefined : fullLogo?.light);

  return appBarBackgroundScheme === 'dark'
    ? darkLogoURL ?? darkLogoFullBase64URI
    : lightLogoURL ?? lightLogoFullBase64URI ?? darkLogoFullBase64URI;
};

export const CompanyLogo = ({ logo, to = '/' }: CompanyLogoProps) => {
  const logoURL = useFullLogo(logo?.light, logo?.dark);

  return (
    <Box
      sx={{
        width: '224px',
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
        <LogoRender base64Logo={logoURL} defaultLogo={<DefaultLogo />} />
      </Link>
    </Box>
  );
};
