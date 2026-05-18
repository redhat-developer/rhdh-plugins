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

import { Route, Routes } from 'react-router-dom';

import { configApiRef, useApi } from '@backstage/core-plugin-api';

import { LightspeedPage } from './LightspeedPage';

/**
 * @public
 */
export const Router = () => {
  const configApi = useApi(configApiRef);
  const notebooksEnabled =
    configApi.getOptionalBoolean('lightspeed.notebooks.enabled') ?? false;

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
    </Routes>
  );
};
