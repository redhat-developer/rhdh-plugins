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

import {
  oidcAuthenticator,
  oidcSignInResolvers,
} from '@backstage/plugin-auth-backend-module-oidc-provider';
import {
  commonSignInResolvers,
  createOAuthProviderFactory,
} from '@backstage/plugin-auth-node';

import { rhdhSignInResolvers } from '../resolvers';

/**
 * PingFederate OIDC provider factory with RHDH-specific sign-in resolvers.
 *
 * This factory extends the standard Backstage OIDC provider with additional
 * resolvers for PingFederate and LDAP authentication.
 *
 * Default sign in resolver: oidcLdapUuidMatchingAnnotation.
 * Users can override this in app-config.yaml by specifying a different resolver.
 *
 * @public
 */
export const pingFederateProviderFactory = createOAuthProviderFactory({
  authenticator: oidcAuthenticator,
  signInResolverFactories: {
    preferredUsernameMatchingUserEntityName:
      rhdhSignInResolvers.preferredUsernameMatchingUserEntityName,
    oidcLdapUuidMatchingAnnotation:
      rhdhSignInResolvers.oidcLdapUuidMatchingAnnotation,
    oidcSubClaimMatchingPingIdentityUserId:
      rhdhSignInResolvers.oidcSubClaimMatchingPingIdentityUserId,
    // Include upstream OIDC resolvers
    ...oidcSignInResolvers,
    ...commonSignInResolvers,
  },
});
