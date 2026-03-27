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

/**
 * Information about an OIDC provider for creating custom resolvers.
 * @public
 */
export type OidcProviderInfo = {
  /** The annotation key to use for matching the user's sub claim */
  userIdKey: string;
  /** The name of the identity provider (for error messages) */
  providerName: string;
};

/**
 * Creates an OIDC sign-in resolver that looks up the user using a specific annotation key.
 *
 * This resolver extracts the `sub` claim from the OIDC token and matches it against
 * a catalog user entity annotation.
 *
 * @param provider - Configuration for the OIDC provider
 * @returns A sign-in resolver factory
 * @public
 */
export const createOidcSubClaimResolver = (provider: OidcProviderInfo) =>
  createSignInResolverFactory({
    optionsSchema: z
      .object({
        dangerouslyAllowSignInWithoutUserInCatalog: z.boolean().optional(),
      })
      .optional() as any,
    create(options?: { dangerouslyAllowSignInWithoutUserInCatalog?: boolean }) {
      return async (
        info: SignInInfo<OAuthAuthenticatorResult<OidcAuthResult>>,
        ctx,
      ) => {
        const sub = info.result.fullProfile.userinfo.sub;
        if (!sub) {
          throw new Error(
            `The user profile from ${provider.providerName} is missing a 'sub' claim, likely due to a misconfiguration in the provider. Please contact your system administrator for assistance.`,
          );
        }

        const idToken = info.result.fullProfile.tokenset.id_token;
        if (!idToken) {
          throw new Error(
            `The user ID token from ${provider.providerName} is missing. Please contact your system administrator for assistance.`,
          );
        }

        const subFromIdToken = decodeJwt(idToken)?.sub;
        if (sub !== subFromIdToken) {
          throw new Error(
            `There was a problem verifying your identity with ${provider.providerName} due to a mismatching 'sub' claim. Please contact your system administrator for assistance.`,
          );
        }

        return await ctx.signInWithCatalogUser(
          {
            annotations: { [provider.userIdKey]: sub },
          },
          {
            dangerousEntityRefFallback:
              options?.dangerouslyAllowSignInWithoutUserInCatalog
                ? { entityRef: sub }
                : undefined,
          },
        );
      };
    },
  });
