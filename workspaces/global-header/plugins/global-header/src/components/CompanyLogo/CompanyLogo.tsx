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
 * @public
 */
export interface CompanyLogoProps {
  logo?: string;
  to?: string;
  layout?: CSSProperties;
}

export const CompanyLogo = ({ logo, to = '/' }: CompanyLogoProps) => {
  const configApi = useApi(configApiRef);
  const logoFullBase64URI = configApi.getOptionalString(
    'app.branding.fullLogo',
  );
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
        <LogoRender
          base64Logo={logo ?? logoFullBase64URI}
          defaultLogo={<DefaultLogo />}
        />
      </Link>
    </Box>
  );
};
