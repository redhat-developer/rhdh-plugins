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

import { ErrorPage, Progress } from '@backstage/core-components';
import React from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import { OptimizationsPage } from './pages/optimizations/OptimizationsPage';
import { OptimizationsBreakdownPage } from './pages/optimizations-breakdown/OptimizationsBreakdownPage';
import { OpenShiftPage } from './pages/openshift/OpenShiftPage';
import { usePatternFlyTheme } from './hooks/usePatternFlyTheme';
import { useResourceOptimizationAccess } from './hooks/useResourceOptimizationAccess';

function RequireOptimizationsAccess({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { optimizationsAllowed, costManagementAllowed, loading } =
    useResourceOptimizationAccess();

  if (loading) {
    return <Progress />;
  }
  if (!optimizationsAllowed) {
    return (
      <Navigate
        to={
          costManagementAllowed
            ? '/redhat-resource-optimization/ocp'
            : '/catalog'
        }
        replace
      />
    );
  }
  return <>{children}</>;
}

function RequireCostManagementAccess({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { optimizationsAllowed, costManagementAllowed, loading } =
    useResourceOptimizationAccess();

  if (loading) {
    return <Progress />;
  }
  if (!costManagementAllowed) {
    return (
      <Navigate
        to={optimizationsAllowed ? '/redhat-resource-optimization' : '/catalog'}
        replace
      />
    );
  }
  return <>{children}</>;
}

/** @public */
export function Router() {
  // Apply PatternFly dark theme globally for the entire plugin
  usePatternFlyTheme();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <RequireOptimizationsAccess>
            <OptimizationsPage />
          </RequireOptimizationsAccess>
        }
      />
      <Route
        path="/ocp"
        element={
          <RequireCostManagementAccess>
            <OpenShiftPage />
          </RequireCostManagementAccess>
        }
      />
      <Route
        path="/:id/*"
        element={
          <RequireOptimizationsAccess>
            <OptimizationsBreakdownPage />
          </RequireOptimizationsAccess>
        }
      />
      <Route
        path="*"
        element={<ErrorPage status="404" statusMessage="Page not found" />}
      />
    </Routes>
  );
}
