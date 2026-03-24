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

import type { Config } from '@backstage/config';
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { BrandingConfig } from '@red-hat-developer-hub/backstage-plugin-augment-common';

/**
 * Load branding overrides from app-config.yaml (augment.branding).
 * Returns only the fields explicitly set in YAML; consumers merge
 * with DEFAULT_BRANDING to get a complete BrandingConfig.
 *
 * @param config - Backstage config (e.g. RootConfigService)
 * @param _logger - Logger (reserved for future use)
 * @returns Partial branding overrides, or empty object if not configured
 */
export function loadBrandingOverrides(
  config: Config,
  _logger: LoggerService,
): Partial<BrandingConfig> {
  const bc = config.getOptionalConfig('augment.branding');
  if (!bc) return {};

  const result: Partial<BrandingConfig> = {};
  const str = (k: string) => bc.getOptionalString(k);

  const appName = str('appName');
  if (appName) result.appName = appName;
  const tagline = str('tagline');
  if (tagline) result.tagline = tagline;
  const inputPlaceholder = str('inputPlaceholder');
  if (inputPlaceholder) result.inputPlaceholder = inputPlaceholder;
  const primaryColor = str('primaryColor');
  if (primaryColor) result.primaryColor = primaryColor;
  const secondaryColor = str('secondaryColor');
  if (secondaryColor) result.secondaryColor = secondaryColor;
  const successColor = str('successColor');
  if (successColor) result.successColor = successColor;
  const warningColor = str('warningColor');
  if (warningColor) result.warningColor = warningColor;
  const errorColor = str('errorColor');
  if (errorColor) result.errorColor = errorColor;
  const infoColor = str('infoColor');
  if (infoColor) result.infoColor = infoColor;
  const logoUrl = str('logoUrl');
  if (logoUrl) result.logoUrl = logoUrl;
  const faviconUrl = str('faviconUrl');
  if (faviconUrl) result.faviconUrl = faviconUrl;
  const botAvatarUrl = str('botAvatarUrl');
  if (botAvatarUrl) result.botAvatarUrl = botAvatarUrl;

  const themePreset = str('themePreset');
  if (themePreset) result.themePreset = themePreset;

  return result;
}
