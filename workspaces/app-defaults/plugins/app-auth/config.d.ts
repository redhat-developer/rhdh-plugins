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

export interface Config {
  /**
   * Optional override for which sign-in provider buttons appear and in what order.
   * When omitted, provider ids are taken from the keys of `auth.providers`.
   * @visibility frontend
   */
  signInPage?: string | string[];

  auth?: {
    /**
     * Provider map used by the NFS SignInPage to decide which buttons to show.
     * Provider *keys* must be frontend-visible; backend-only schemas (e.g. the
     * guest provider module) otherwise strip them and the page shows
     * "Sign-in is not available" with no Enter button.
     */
    providers?: {
      /**
       * Guest sign-in. Presence of this key (even as `{}`) enables the Guest
       * card on the sign-in page.
       * @visibility frontend
       */
      guest?: object;
    };
  };
}
