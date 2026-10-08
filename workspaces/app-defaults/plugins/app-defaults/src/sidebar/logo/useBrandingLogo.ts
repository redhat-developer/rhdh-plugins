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

import { configApiRef, useApi } from '@backstage/frontend-plugin-api';

import { useAppBarBackgroundScheme } from './useAppBarBackgroundScheme';
import type { LogoURLs } from './types';

const useBrandingLogo = (
  key: 'app.branding.fullLogo' | 'app.branding.iconLogo',
  logo?: LogoURLs,
): string | undefined => {
  const scheme = useAppBarBackgroundScheme();
  const configApi = useApi(configApiRef);

  const configured = configApi.getOptional<LogoURLs>(key);
  const configuredURI =
    typeof configured === 'string' ? configured : configured?.[scheme];
  const propsURI = typeof logo === 'string' ? logo : logo?.[scheme];

  return propsURI ?? configuredURI ?? undefined;
};

/**
 * Resolves the full logo URI from `app.branding.fullLogo` for the current
 * app bar background scheme. An explicit `logo` takes precedence over config.
 * Mirrors `useBrandingFullLogo` of the global header.
 *
 * @public
 */
export const useBrandingFullLogo = (logo?: LogoURLs): string | undefined =>
  useBrandingLogo('app.branding.fullLogo', logo);

/**
 * Resolves the icon logo URI from `app.branding.iconLogo` for the current
 * app bar background scheme. An explicit `logo` takes precedence over config.
 *
 * @public
 */
export const useBrandingIconLogo = (logo?: LogoURLs): string | undefined =>
  useBrandingLogo('app.branding.iconLogo', logo);
