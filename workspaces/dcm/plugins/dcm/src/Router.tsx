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

import { ErrorBoundary, ErrorPage } from '@backstage/core-components';
import { Routes, Route, useParams } from 'react-router-dom';
import { DcmClientsProvider } from './api/DcmClientsContext';
import { useTranslation } from './hooks/useTranslation';
import { DataCenterPage } from './pages/data-center/DataCenterPage';
import {
  policiesRouteRef,
  serviceTypesRouteRef,
  catalogItemsRouteRef,
  catalogItemInstancesRouteRef,
  resourcesRouteRef,
} from './routes';

const VALID_SUB_PATHS = new Set([
  '',
  ...[
    policiesRouteRef,
    serviceTypesRouteRef,
    catalogItemsRouteRef,
    catalogItemInstancesRouteRef,
    resourcesRouteRef,
  ].map(ref => ref.path.replace(/^\//, '')),
]);

function DcmRouteGuard() {
  const params = useParams();
  const { t } = useTranslation();
  const subPath = params['*'] ?? '';

  if (!VALID_SUB_PATHS.has(subPath)) {
    return <ErrorPage status="404" statusMessage={t('page.notFound')} />;
  }

  return <DataCenterPage />;
}

/**
 * Plugin-level router. All DCM routes are defined here (app mounts at /dcm/*).
 *
 * @public
 */
export function Router() {
  return (
    <ErrorBoundary>
      <DcmClientsProvider>
        <Routes>
          <Route path="*" element={<DcmRouteGuard />} />
        </Routes>
      </DcmClientsProvider>
    </ErrorBoundary>
  );
}
