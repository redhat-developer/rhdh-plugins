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

/**
 * Performance boundary for the single critical first-paint header async chunk.
 *
 * This module contains only components required for initial header rendering.
 * It is intentionally imported through a single dynamic import
 * (`loadHeaderBundle()` in `loaders.ts`) so all critical header UI is emitted
 * into one async chunk rather than creating one network request per toolbar
 * extension.
 *
 * Interaction-only UI (dropdown menus, search result rows, etc.) must not be
 * added here — use separate loaders in `loaders.ts`.
 *
 * Do not statically import from sync entrypoints (`index.ts`, `plugin.ts`,
 * `blueprints.tsx`, `globalHeaderModule.tsx`).
 *
 * @internal
 */

export * from './onMount';
