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
