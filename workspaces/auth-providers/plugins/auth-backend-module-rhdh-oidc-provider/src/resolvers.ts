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

import type { OidcAuthResult } from '@backstage/plugin-auth-backend-module-oidc-provider';
import {
  createSignInResolverFactory,
  type SignInInfo,
  type OAuthAuthenticatorResult,
} from '@backstage/plugin-auth-node';

import { decodeJwt } from 'jose';
import { z } from 'zod';

import { createOidcSubClaimResolver, OidcProviderInfo } from './resolverUtils';

const KEYCLOAK_INFO: OidcProviderInfo = {
  userIdKey: 'keycloak.org/id',
  providerName: 'Keycloak',
};

const PING_IDENTITY_INFO: OidcProviderInfo = {
  userIdKey: 'pingidentity.org/id',
  providerName: 'Ping Identity',
};

const LDAP_UUID_ANNOTATION = 'backstage.io/ldap-uuid';

/**
 * Additional RHDH-specific sign-in resolvers.
 *
 * @public
 */
export namespace rhdhSignInResolvers {
  /**
   * An OIDC resolver that looks up the user using their preferred_username
   * claim as the entity name.
   */
  export const preferredUsernameMatchingUserEntityName =
    createSignInResolverFactory({
      optionsSchema: z
        .object({
          dangerouslyAllowSignInWithoutUserInCatalog: z.boolean().optional(),
        })
        .optional() as any,
      create(options?: {
        dangerouslyAllowSignInWithoutUserInCatalog?: boolean;
      }) {
        return async (
          info: SignInInfo<OAuthAuthenticatorResult<OidcAuthResult>>,
          ctx,
        ) => {
          const userId = info.result.fullProfile.userinfo.preferred_username;
          if (!userId) {
            throw new Error(`OIDC user profile does not contain a username`);
          }

          return ctx.signInWithCatalogUser(
            {
              entityRef: { name: userId },
            },
            {
              dangerousEntityRefFallback:
                options?.dangerouslyAllowSignInWithoutUserInCatalog
                  ? { entityRef: userId }
                  : undefined,
            },
          );
        };
      },
    });

  /**
   * An OIDC resolver that looks up the user using their Keycloak user ID.
   *
   * Matches the `sub` claim from the ID token against the `keycloak.org/id`
   * annotation on catalog User entities.
   */
  export const oidcSubClaimMatchingKeycloakUserId =
    createOidcSubClaimResolver(KEYCLOAK_INFO);

  /**
   * An OIDC resolver that looks up the user using their Ping Identity user ID.
   *
   * Matches the `sub` claim from the ID token against the `pingidentity.org/id`
   * annotation on catalog User entities.
   */
  export const oidcSubClaimMatchingPingIdentityUserId =
    createOidcSubClaimResolver(PING_IDENTITY_INFO);

  /**
   * An OIDC resolver that looks up the user using an LDAP UUID.
   *
   * Matches a custom LDAP UUID claim from the ID token against the
   * `backstage.io/ldap-uuid` annotation on catalog User entities.
   *
   * Validates that the UUID in the userinfo matches the UUID in the ID token.
   */
  export const oidcLdapUuidMatchingAnnotation = createSignInResolverFactory({
    optionsSchema: z
      .object({
        dangerouslyAllowSignInWithoutUserInCatalog: z.boolean().optional(),
        ldapUuidKey: z.string().optional(),
      })
      .optional() as any,
    create(options?: {
      dangerouslyAllowSignInWithoutUserInCatalog?: boolean;
      ldapUuidKey?: string;
    }) {
      return async (
        info: SignInInfo<OAuthAuthenticatorResult<OidcAuthResult>>,
        ctx,
      ) => {
        const uuidKey = options?.ldapUuidKey ?? 'ldap_uuid';
        const uuid = info.result.fullProfile.userinfo[uuidKey] as string;
        if (!uuid) {
          throw new Error(
            `The user profile from LDAP is missing the UUID, likely due to a misconfiguration in the provider. Please contact your system administrator for assistance.`,
          );
        }

        const idToken = info.result.fullProfile.tokenset.id_token;
        if (!idToken) {
          throw new Error(
            `The user ID token from LDAP is missing. Please contact your system administrator for assistance.`,
          );
        }

        const uuidFromIdToken = decodeJwt(idToken)?.[uuidKey];
        if (uuid !== uuidFromIdToken) {
          throw new Error(
            `There was a problem verifying your identity with LDAP due to mismatching UUID. Please contact your system administrator for assistance.`,
          );
        }

        return ctx.signInWithCatalogUser(
          {
            annotations: { [LDAP_UUID_ANNOTATION]: uuid },
          },
          {
            dangerousEntityRefFallback:
              options?.dangerouslyAllowSignInWithoutUserInCatalog
                ? { entityRef: uuid }
                : undefined,
          },
        );
      };
    },
  });
}
