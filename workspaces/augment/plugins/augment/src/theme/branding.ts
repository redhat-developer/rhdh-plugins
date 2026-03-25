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

/**
 * Branding Utilities
 *
 * Helpers for working with branding configuration.
 * The primary branding hook is in hooks/useBranding.ts which fetches
 * branding from the backend API (app-config.yaml).
 *
 * This file provides:
 * - Default branding values
 * - URL sanitization for safe DOM injection
 */

export type { BrandingConfig } from '@red-hat-developer-hub/backstage-plugin-augment-common';
export { DEFAULT_BRANDING } from '@red-hat-developer-hub/backstage-plugin-augment-common';

/**
 * Validates a URL is safe for DOM injection (src, href).
 * Rejects javascript:, data:, vbscript: and other non-http(s) protocols.
 * Returns the URL string if valid, undefined otherwise.
 */
export function sanitizeBrandingUrl(
  url: string | undefined,
): string | undefined {
  if (!url || url.trim().length === 0) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return url;
    }
    return undefined;
  } catch {
    return undefined;
  }
}
