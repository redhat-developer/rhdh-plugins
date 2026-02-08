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
 *
 * @public
 * An array of scopes, or a scope string formatted according to the
 * auth provider, which is typically a space separated list.
 */
export type OAuthScope = string | string[];

/**
 * Descriptor for authentication token configuration
 */
export type AuthTokenDescriptor = {
  /**
   * The provider is the same as in the same provider that appears in the auth section of the app-config.yaml file.
   * The built in providers supported are: github, gitlab and microsoft.
   * The provider matching is case insensitive (e.g., provider: 'github' matches header: 'X-Authorization-Github')
   * For custom provider the same applies (e.g., provider: 'my-custom-provider' matches header: 'X-Authorization-My-Custom-Provider')
   */
  provider: string;

  /**
   * Backstage apiRef id for custom authentication provider. Must match the backstage ApiRef id of the custom provider plugin.
   */
  customProviderApiId?: string;

  /**
   * OAuth scope for token permissions (e.g., 'repo' for GitHub repository write permissions)
   */
  scope?: OAuthScope;

  /**
   * Type of authentication token to request. If not provided, the default is 'oauth'.
   */
  tokenType?: 'openId' | 'oauth';
};
