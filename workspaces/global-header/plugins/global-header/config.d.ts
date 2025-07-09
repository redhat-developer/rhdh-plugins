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

import '@backstage/config';

declare module '@backstage/config' {
  interface Config {
    app?: {
      branding?: {
        /**
         * Base64 URI for the full logo. If the value is a string, it is used as the logo for both themes.
         * @visibility frontend
         */
        fullLogo?:
          | string
          | {
              /**
               * Base64 URI for the logo in light theme
               * @visibility frontend
               */
              light: string;
              /**
               * Base64 URI for the logo in dark theme
               * @visibility frontend
               */
              dark: string;
            };
        /**
         * Fallback width for the full logo in the global header.
         * Accepts any valid CSS length (e.g. `'200px'`, `'12rem'`).
         * Used only when a `width` prop isn’t supplied through the extension configuration.
         * @visibility frontend
         */
        fullLogoWidth?: string | number;
      };
    };
  }
}
