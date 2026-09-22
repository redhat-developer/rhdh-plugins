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
 * The URLs for the light and dark variants of a logo, or a single URL used
 * for both. Mirrors the `LogoURLs` type of the global header.
 *
 * @public
 */
export type LogoURLs =
  | {
      /** The logo used on a light-coloured background. */
      light: string;
      /** The logo used on a dark-coloured background. */
      dark: string;
    }
  | string
  | undefined;

/**
 * Props for {@link CompanyLogo}.
 *
 * @public
 */
export interface CompanyLogoProps {
  /** Logo shown while the sidebar is open. Overrides `app.branding.fullLogo`. */
  fullLogo?: LogoURLs;
  /** Logo shown while the sidebar is collapsed. Overrides `app.branding.iconLogo`. */
  iconLogo?: LogoURLs;
  /** The route the logo links to. Defaults to `/`. */
  to?: string;
  /**
   * Width of the full logo. Defaults to `app.branding.fullLogoWidth` or
   * 170px. Set it explicitly for encoded SVGs without an intrinsic width.
   */
  width?: string | number;
  /** Maximum height of the full logo. Defaults to 40px. */
  height?: string | number;
}
