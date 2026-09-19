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

import { ErrorBoundary } from '@backstage/core-components';
import type { ReactNode } from 'react';
import { configApiRef, useApi, useApiHolder } from '@backstage/core-plugin-api';
import { Routes, Route } from 'react-router-dom';
import { DataCenterPage } from './pages/data-center/DataCenterPage';
import { oidcAuthApiRef } from './api/AuthApiRefs';
import { setDcmAccessTokenProvider } from './DcmAuth';

function DcmAuthConfigurator({ children }: { children: ReactNode }) {
  const configApi = useApi(configApiRef);
  const apiHolder = useApiHolder();
  const authEnabled = configApi.getOptionalBoolean('dcm.auth.enabled') ?? true;
  const oidcAuthApi = authEnabled ? apiHolder.get(oidcAuthApiRef) : undefined;

  setDcmAccessTokenProvider(
    authEnabled
      ? oidcAuthApi?.getAccessToken.bind(oidcAuthApi) ??
          (() =>
            Promise.reject(
              new Error(
                'DCM authentication is enabled, but the host does not provide internal.auth.oidc.',
              ),
            ))
      : undefined,
  );

  return <>{children}</>;
}

/**
 * Plugin-level router. All DCM routes are defined here (app mounts at /dcm/*).
 *
 * @public
 */
export function Router() {
  return (
    <ErrorBoundary>
      <DcmAuthConfigurator>
        <Routes>
          <Route path="*" element={<DataCenterPage />} />
        </Routes>
      </DcmAuthConfigurator>
    </ErrorBoundary>
  );
}
