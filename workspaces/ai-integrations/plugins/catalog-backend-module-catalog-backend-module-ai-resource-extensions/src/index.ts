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
 * The catalog-backend-module-ai-resource-extensions backend module for the catalog plugin.
 *
 * @packageDocumentation
 */
export { catalogModuleCatalogBackendModuleAiResourceExtensions as default } from './module';
export {
  AIResourceExtensionsProcessor,
  VALID_AI_RESOURCE_SCOPES,
} from './AIResourceExtensionsProcessor';
export type { AIResourceScope } from './AIResourceExtensionsProcessor';
