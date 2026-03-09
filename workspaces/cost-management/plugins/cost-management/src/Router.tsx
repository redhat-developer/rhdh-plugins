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

import { ErrorPage } from '@backstage/core-components';
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { OptimizationsPage } from './pages/optimizations/OptimizationsPage';
import { OptimizationsBreakdownPage } from './pages/optimizations-breakdown/OptimizationsBreakdownPage';
import { OpenShiftPage } from './pages/openshift/OpenShiftPage';
import { usePatternFlyTheme } from './hooks/usePatternFlyTheme';

/** @public */
export function Router() {
  // Apply PatternFly dark theme globally for the entire plugin
  usePatternFlyTheme();

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/cost-management/optimizations" replace />}
      />
      <Route path="/optimizations" element={<OptimizationsPage />} />
      <Route path="/openshift" element={<OpenShiftPage />} />
      <Route
        path="/optimizations/:id/*"
        element={<OptimizationsBreakdownPage />}
      />
      <Route
        path="*"
        element={<ErrorPage status="404" statusMessage="Page not found" />}
      />
    </Routes>
  );
}
