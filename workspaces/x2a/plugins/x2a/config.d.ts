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
  x2a?: {
    scm?: {
      /**
       * The one host each SCM OAuth provider is registered against.
       *
       * Backstage auth providers are configured per provider type, not per
       * host, so the access token they issue is valid for a single host only.
       * X2A hands a token to a host only if that host equals the value set
       * here, so it must match the auth provider's `audience` (GitLab) or
       * `enterpriseInstanceUrl` (GitHub Enterprise). A bare host or a URL
       * (`https://gitlab.example.com`, so the GitLab `audience` can be copied
       * as is); only its host is used. A non-default port is part of the host
       * (`host:8443`).
       * There is no default: when unset, no host of that type can be
       * authenticated. Bitbucket Cloud is always `bitbucket.org`.
       *
       * @deepVisibility frontend
       */
      authHosts?: {
        github?: string;
        gitlab?: string;
      };
    };
  };
}
