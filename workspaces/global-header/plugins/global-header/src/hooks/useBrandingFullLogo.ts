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

import { configApiRef, useApi } from '@backstage/core-plugin-api';

import type { LogoURLs } from '../components/CompanyLogo/types';
import { useAppBarBackgroundScheme } from './useAppBarBackgroundScheme';

/**
 * Resolves the configured branding logo URI from `app.branding.fullLogo`.
 *
 * When `fullLogo` is an object, the variant for the current app bar
 * background scheme (`light` or `dark`) is selected. An optional `logo`
 * prop takes precedence over config, matching {@link CompanyLogoProps}.
 *
 * @public
 */
export const useBrandingFullLogo = (logo?: LogoURLs): string | undefined => {
  const appBarBackgroundScheme = useAppBarBackgroundScheme();
  const configApi = useApi(configApiRef);

  const fullLogo = configApi.getOptional<LogoURLs>('app.branding.fullLogo');
  const fullLogoURI =
    typeof fullLogo === 'string'
      ? fullLogo
      : fullLogo?.[appBarBackgroundScheme];

  const propsLogoURI =
    typeof logo === 'string' ? logo : logo?.[appBarBackgroundScheme];

  return propsLogoURI ?? fullLogoURI ?? undefined;
};
