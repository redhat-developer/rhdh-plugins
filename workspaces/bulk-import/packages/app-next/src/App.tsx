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

import { createApp } from '@backstage/frontend-defaults';

// Import the new frontend system plugin for bulk-import
// This provides:
// - NavItemBlueprint: Adds "Bulk import" to the sidebar
// - PageBlueprint: Provides the /bulk-import page
// - ApiBlueprint: Provides the BulkImportAPI
import bulkImportPlugin from '@red-hat-developer-hub/backstage-plugin-bulk-import/alpha';

/**
 * app-next: A minimal Backstage app using the New Frontend System (NFS)
 *
 * This app is used to test the migrated bulk-import plugin with:
 * - createFrontendPlugin
 * - PageBlueprint
 * - NavItemBlueprint
 * - ApiBlueprint
 *
 * To run: yarn --cwd packages/app-next start
 */
const app = createApp({
  features: [
    // The bulk-import plugin for the new frontend system
    // This automatically registers:
    // - Nav item in sidebar (via NavItemBlueprint)
    // - Page at /bulk-import (via PageBlueprint)
    // - API for backend communication (via ApiBlueprint)
    bulkImportPlugin,
  ],
});

// Export the app root element (not a component)
// In NFS, createRoot() returns a React element, not a component
export default app.createRoot();
