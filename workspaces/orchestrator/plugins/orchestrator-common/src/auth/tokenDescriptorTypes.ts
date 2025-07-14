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
import { OAuthScope } from '@backstage/core-plugin-api';

/**
 * Source Control Management token providers supported by the system
 */
export type ScmTokenProvider = 'gitlab' | 'github';

/**
 * Authentication token providers supported by the system
 */
export type TokenProvider = ScmTokenProvider | 'microsoft';

/**
 * Descriptor for authentication token configuration
 */
export type AuthTokenDescriptor = {
  /**
   * Token provider identifier - must match the sonataflow header suffix X-Authorization-<provider>
   * The provider matching is case insensitive (e.g., provider: 'github' matches header: 'X-Authorization-Github')
   * For custom provider the same applies (e.g., provider: 'my-custom-provider' matches header: 'X-Authorization-My-Custom-Provider')
   * Use TokenProvider for built-in providers or a string for custom providers
   */
  provider: TokenProvider | string;

  /**
   * Backstage apiRef id for custom authentication provider. Must match the backstage ApiRef id of the custom provider plugin.
   */
  custonmProviderApiId?: string;

  /**
   * OAuth scope for token permissions (e.g., 'repo' for GitHub repository write permissions)
   */
  scope?: OAuthScope;

  /**
   * Type of authentication token to request
   */
  tokenType: 'openId' | 'oauth';
};
