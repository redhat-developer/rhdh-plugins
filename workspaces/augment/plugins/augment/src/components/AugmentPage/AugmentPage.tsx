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

import { AppStateProvider } from './AppStateProvider';
import { AppShell } from './AppShell';
import { AugmentErrorBoundary } from './AugmentErrorBoundary';

/**
 * Main entry point for the Augment plugin page.
 *
 * Architecture:
 * - AugmentErrorBoundary: catches unhandled errors
 * - AppStateProvider: centralizes all app state (sessions, admin, branding, status)
 * - AppShell: layout frame (security gate, fonts, branding)
 *   - AppRouter: delegates to ChatView or AdminLayout based on viewMode
 */
export const AugmentPage = () => (
  <AugmentErrorBoundary>
    <AppStateProvider>
      <AppShell />
    </AppStateProvider>
  </AugmentErrorBoundary>
);
