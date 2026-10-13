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
import {
  appThemeApiRef,
  configApiRef,
  useApi,
} from '@backstage/frontend-plugin-api';
import Box from '@mui/material/Box';
import RedHatDeveloperHubLogo from './RedHatDeveloperHubLogo';

/**
 * An interface representing the URLs for light and dark variants of a logo.
 * @public
 */
export type LogoURLs = Record<string, string> | string;

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
}

/**
 * Company logo for the global header app bar.
 *
 * @public
 */
export const CompanyLogo = (props: CompanyLogoProps) => {
  const configApi = useApi(configApiRef);
  const themeApi = useApi(appThemeApiRef);

  const themeId = themeApi.getActiveThemeId();
  const themeVariant = themeApi
    .getInstalledThemes()
    .find(theme => theme.id === themeId)?.variant;
  const logoURLs =
    props.logo ?? configApi.getOptional<LogoURLs>('app.branding.fullLogo');
  const logoURI =
    (typeof logoURLs === 'string' ? logoURLs : null) ??
    (typeof logoURLs === 'object'
      ? logoURLs?.[themeId!] ?? logoURLs?.[themeVariant!]
      : null);

  const to = props.to ?? '/';
  const width =
    props.width ??
    configApi.getOptional<number | string>('app.branding.fullLogoWidth') ??
    150;
  const height = props.height ?? 40;

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
        {logoURI ? (
          <img
            data-testid="home-logo"
            src={logoURI}
            alt="Home logo"
            style={{
              objectFit: 'contain',
              objectPosition: 'left',
              maxHeight: height,
            }}
            width={width}
          />
        ) : (
          <RedHatDeveloperHubLogo
            textFill={themeVariant === 'dark' ? 'white' : 'black'}
          />
        )}
      </Link>
    </Box>
  );
};
