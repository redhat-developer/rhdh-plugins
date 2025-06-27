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
  width = 150,
  height = 40,
}: {
  base64Logo: string | undefined;
  defaultLogo: JSX.Element;
  width?: number | string;
  height?: number | string;
}) => {
  return base64Logo ? (
    <img
      data-testid="home-logo"
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
    defaultLogo
  );
};

/**
 * An interface representing the URLs for light and dark variants of a logo.
 * @public
 */
export type LogoURLs =
  | {
      /** The logo that will be used in global headers with a light-coloured background */
      light: string;
      /** The logo that will be used in global headers with a dark-coloured background */
      dark: string;
    }
  | string
  | undefined;

/**
 * @public
 */
export interface CompanyLogoProps {
  /** An object containing the logo URLs */
  logo?: LogoURLs;
  /** The route to link the logo to */
  to?: string;
  /**
   * The width of the logo in pixels (defaults to 150px). This prop fixes an
   * issue where encoded SVGs without an explicit width would not render.
   * You likely do not need to set this prop, but we recommend setting it
   * to a value under 200px.
   */
  width?: string | number;
  /**
   * The maximum height of the logo in pixels (defaults to 40px).
   * Note that changing this value may result in changes in the height of the global header.
   **/
  height?: string | number;
  /** This prop is not used by this component. */
  layout?: CSSProperties;
}

/**
 * Gets a themed image based on the current theme.
 */
const useFullLogo = (logo: LogoURLs): string | undefined => {
  const appBarBackgroundScheme = useAppBarBackgroundScheme();

  const configApi = useApi(configApiRef);

  /** The fullLogo config specified by app.branding.fullLogo */
  const fullLogo = configApi.getOptional<LogoURLs>('app.branding.fullLogo');

  /** The URI of the logo specified by app.branding.fullLogo */
  const fullLogoURI =
    typeof fullLogo === 'string'
      ? fullLogo
      : fullLogo?.[appBarBackgroundScheme];

  /** The URI of the logo specified by CompanyLogo props */
  const propsLogoURI =
    typeof logo === 'string' ? logo : logo?.[appBarBackgroundScheme];

  return propsLogoURI ?? fullLogoURI ?? undefined;
};

export const CompanyLogo = ({
  logo,
  width,
  height,
  to = '/',
}: CompanyLogoProps) => {
  const logoURL = useFullLogo(logo);
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
          base64Logo={logoURL}
          defaultLogo={<DefaultLogo />}
          width={width ?? fullLogoWidth}
          height={height}
        />
      </Link>
    </Box>
  );
};
