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

import { Navigate, Route, Routes } from 'react-router-dom';

import { ErrorPage } from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';

import { LIGHTSPEED_PATH } from '../const';
import { useIaChatPermission } from '../hooks/useIaChatPermission';
import { LightspeedPage } from './LightspeedPage';

const UnknownIntelligentAssistantRoute = () => {
  const { allowed: hasChatAccess, loading: chatPermissionLoading } =
    useIaChatPermission();

  if (chatPermissionLoading) {
    return null;
  }

  if (hasChatAccess) {
    return <Navigate to={LIGHTSPEED_PATH} replace />;
  }

  return <ErrorPage status="404" statusMessage="Page not found" />;
};

/**
 * @public
 */
export const Router = () => {
  const configApi = useApi(configApiRef);
  const notebooksEnabled =
    configApi.getOptionalBoolean('intelligent-assistant.notebooks.enabled') ??
    false;

  return (
    <Routes>
      <Route path="/" element={<LightspeedPage />} />
      <Route
        path="/conversation/:conversationId"
        element={<LightspeedPage />}
      />
      {notebooksEnabled && (
        <>
          <Route path="/notebooks" element={<LightspeedPage />} />
          <Route path="/notebooks/:notebookId" element={<LightspeedPage />} />
        </>
      )}
      <Route path="*" element={<UnknownIntelligentAssistantRoute />} />
    </Routes>
  );
};
