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

import { createTranslationRef } from '@backstage/core-plugin-api/alpha';

/**
 * Sign-in page messages (English). Same key shape as legacy RHDH app signIn for compatibility.
 *
 * @alpha
 */
export const signInTranslationRef = createTranslationRef({
  id: 'plugin.app-auth.sign-in',
  messages: {
    signIn: {
      page: {
        title: 'Select a sign-in method',
      },
      config: {
        missingAuthEnvironment: {
          error:
            'Missing required app configuration: auth.environment must be set',
          panelTitle: 'Sign-in is not available',
          description:
            'Set {{ authEnvKey }} in your app configuration (for example {{ devEnv }} for local use or {{ prodEnv }} in deployed environments). Without it, the app cannot safely determine which sign-in options to offer.',
        },
      },
      providers: {
        auth0: {
          title: 'Auth0',
          message: 'Sign in using Auth0',
        },
        atlassian: {
          title: 'Atlassian',
          message: 'Sign in using Atlassian',
        },
        microsoft: {
          title: 'Microsoft',
          message: 'Sign in using Microsoft',
        },
        bitbucket: {
          title: 'Bitbucket',
          message: 'Sign in using Bitbucket',
        },
        bitbucketServer: {
          title: 'Bitbucket Server',
          message: 'Sign in using Bitbucket Server',
        },
        github: {
          title: 'GitHub',
          message: 'Sign in using GitHub',
        },
        gitlab: {
          title: 'GitLab',
          message: 'Sign in using GitLab',
        },
        google: {
          title: 'Google',
          message: 'Sign in using Google',
        },
        oidc: {
          title: 'OIDC',
          message: 'Sign in using OIDC',
        },
        keycloak: {
          title: 'Keycloak',
          message: 'Sign in using Keycloak',
        },
        pingfederate: {
          title: 'PingFederate',
          message: 'Sign in using PingFederate',
        },
        okta: {
          title: 'Okta',
          message: 'Sign in using Okta',
        },
        onelogin: {
          title: 'OneLogin',
          message: 'Sign in using OneLogin',
        },
        saml: {
          title: 'SAML',
          message: 'Sign in using SAML',
        },
      },
    },
  },
});
