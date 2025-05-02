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
import { SignInPageProps, useApi } from '@backstage/core-plugin-api';
import {
  SignInPage,
  SignInProviderConfig,
  Progress,
} from '@backstage/core-components';
import { useLocation, useNavigate } from 'react-router-dom';
import React, { useEffect } from 'react';
import { useState } from 'react';
import { getIdentityResponse } from './helpers';
import { keycloakApiRef } from '../../api';

export type Props = SignInPageProps & {
  provider: SignInProviderConfig;
};

export const RHSSOSignInPage = () => {
  const authApi = useApi(keycloakApiRef);
  const navigate = useNavigate();
  const location = useLocation();

  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSignInStatus = async () => {
      try {
        const identityResponse = await getIdentityResponse(authApi);
        if (!identityResponse) {
          // Not logged in with SSO
          setIsSignedIn(false);
        } else {
          // They are logged in
          setIsSignedIn(true);
        }
      } catch (err: any) {
        setIsSignedIn(false);
        throw err;
      }
    };
    checkSignInStatus();
  }, [authApi]);

  const handleSignInSuccess = () => {
    setIsSignedIn(true);
    navigate(location.pathname);
    window.location.reload();
  };

  if (isSignedIn === null) {
    return <Progress />;
  }

  return (
    <SignInPage
      auto
      onSignInSuccess={() => handleSignInSuccess()}
      provider={{
        id: 'oidc',
        title: 'Red Hat SSO',
        message: 'Sign in using your Red Hat SSO account',
        apiRef: keycloakApiRef,
      }}
    />
  );
};
