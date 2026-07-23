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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { importHistoryRouteRef } from '../routes';
import { AddRepositoriesPage } from './AddRepositories/AddRepositoriesPage';
import { ImportHistoryPage } from './Repositories/ImportHistoryPage';

const queryClient = new QueryClient();

/**
 *
 * @public
 */
export const Router = () => (
  <QueryClientProvider client={queryClient}>
    <Routes>
      <Route path="/" element={<AddRepositoriesPage />} />
      <Route
        path={importHistoryRouteRef.path}
        element={<ImportHistoryPage />}
      />
      {/* Redirect any undefined paths to the root */}
      <Route path="*" element={<Navigate to="/bulk-import" replace />} />
    </Routes>
  </QueryClientProvider>
);
